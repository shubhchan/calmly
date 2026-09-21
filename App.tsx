import 'react-native-gesture-handler';
import './global.css';
import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/theme/ThemeContext';
import { RootNavigator } from './src/routing/navigation';
import {
  ErrorBoundary,
  GlobalErrorShield,
  buildErrorReport,
  bootLog,
  getBootTrail,
} from './src/components/ErrorBoundary';

const NAV_READY_TIMEOUT_MS = 12000;

/**
 * Paints instantly (first commit) underneath the navigation tree, so the user
 * never stares at a blank/native-grey window while navigation initializes.
 * It stays mounted until NavigationContainer reports ready, then unmounts.
 * Absolutely positioned so it never affects the navigation layout.
 */
function BootSplash() {
  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#FDFBF7',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
      }}
    >
      <Text style={{ fontSize: 44 }}>🌿</Text>
      <Text style={{ marginTop: 12, fontSize: 24, fontWeight: '700', color: '#1E232E' }}>
        Calmly
      </Text>
      <Text style={{ marginTop: 6, fontSize: 14, color: '#425474', textAlign: 'center' }}>
        Take a breath… loading your space
      </Text>
      <ActivityIndicator size="large" color="#5A955A" style={{ marginTop: 20 }} />
    </View>
  );
}

/**
 * Shown (dismissibly, ON TOP of the still-mounted app) only if navigation
 * hasn't reported ready within NAV_READY_TIMEOUT_MS. Unlike the old behavior,
 * this never unmounts the navigation tree — the app keeps whatever UI it has
 * and the user gets a copyable diagnostic plus a way to retry.
 */
function StallOverlay({
  copied,
  onCopy,
  onReload,
  onDismiss,
}: {
  copied: boolean;
  onCopy: () => void;
  onReload: () => void;
  onDismiss: () => void;
}) {
  const trail = getBootTrail().slice(-10).join('\n');
  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#FDFBF7',
        paddingTop: 72,
        paddingHorizontal: 20,
      }}
    >
      <Text style={{ fontSize: 40, textAlign: 'center' }}>🐢</Text>
      <Text
        style={{
          marginTop: 8,
          fontSize: 20,
          fontWeight: '700',
          color: '#1E232E',
          textAlign: 'center',
        }}
      >
        Taking longer than usual…
      </Text>
      <Text style={{ marginTop: 8, fontSize: 14, color: '#425474', textAlign: 'center' }}>
        The app is still trying to load. You can wait, retry, or send this info to the
        developer.
      </Text>

      <View style={{ flexDirection: 'row', marginTop: 16, marginBottom: 12 }}>
        <Pressable
          onPress={onCopy}
          style={{
            backgroundColor: '#5A955A',
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: 10,
            marginRight: 8,
            flex: 1,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#FDFBF7', fontWeight: '700' }}>
            {copied ? 'Copied ✓' : 'Copy info'}
          </Text>
        </Pressable>
        <Pressable
          onPress={onReload}
          style={{
            backgroundColor: '#6B9BCD',
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: 10,
            marginRight: 8,
            flex: 1,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#FDFBF7', fontWeight: '700' }}>Reload UI</Text>
        </Pressable>
        <Pressable
          onPress={onDismiss}
          style={{
            backgroundColor: '#E4DEBC',
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: 10,
            flex: 1,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#1E232E', fontWeight: '700' }}>Dismiss</Text>
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }}>
        <Text selectable style={{ color: '#425474', fontSize: 12, fontFamily: 'monospace' }}>
          {trail || '(boot trail empty — JS may not be executing)'}
        </Text>
      </ScrollView>
    </View>
  );
}

export default function App() {
  const [navReady, setNavReady] = useState(false);
  const [navStalled, setNavStalled] = useState(false);
  const [navKey, setNavKey] = useState(0);
  const [copied, setCopied] = useState(false);
  const navReadyRef = useRef(false);
  const firstStateChangeLoggedRef = useRef(false);

  useEffect(() => {
    bootLog('app-mounted');
    const timer = setTimeout(() => {
      if (!navReadyRef.current) {
        // Diagnostic only: the navigation tree stays mounted underneath.
        bootLog('WATCHDOG navigation not ready after 12s (UI kept mounted)');
        setNavStalled(true);
      }
    }, NAV_READY_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [navKey]);

  const handleNavReady = useCallback(() => {
    navReadyRef.current = true;
    setNavReady(true);
    setNavStalled(false);
    bootLog('nav-ready');
  }, []);

  const handleStateChange = useCallback(() => {
    if (!firstStateChangeLoggedRef.current) {
      firstStateChangeLoggedRef.current = true;
      bootLog('nav-first-state-change');
    }
  }, []);

  const handleReloadNavigation = useCallback(() => {
    bootLog('nav-reload-requested');
    firstStateChangeLoggedRef.current = false;
    navReadyRef.current = false;
    setCopied(false);
    setNavReady(false);
    setNavStalled(false);
    // Remount NavigationContainer: clears any stuck native-screens state
    // without requiring a full app restart.
    setNavKey((k) => k + 1);
  }, []);

  const handleCopyReport = useCallback(async () => {
    try {
      const report = buildErrorReport({
        error: new Error(
          'Navigation slow to become ready. ' +
            `Boot trail: ${getBootTrail().join(' | ') || '(empty — JS may not be executing)'}`,
        ),
        where: 'uncaught-js',
      });
      await Clipboard.setStringAsync(report);
      setCopied(true);
    } catch (e) {
      console.warn('Copy to clipboard failed:', e);
    }
  }, []);

  return (
    <ErrorBoundary>
      <GlobalErrorShield>
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#FDFBF7' }}>
          <ThemeProvider>
            <SafeAreaProvider>
              {/* Solid fallback background: if NativeWind theme vars ever fail to
                  resolve in a release bundle, the window still paints the light
                  theme base instead of the native root view's grey. */}
              <View style={{ flex: 1, backgroundColor: '#FDFBF7' }}>
                <StatusBar />
                {/* Instant paint under navigation; hidden once nav is ready. */}
                {!navReady && <BootSplash />}
                <Suspense fallback={null}>
                  <NavigationContainer
                    key={`nav-${navKey}`}
                    onReady={handleNavReady}
                    onStateChange={handleStateChange}
                  >
                    <View style={{ flex: 1, backgroundColor: '#FDFBF7' }}>
                      <RootNavigator />
                    </View>
                  </NavigationContainer>
                </Suspense>
                {/* Dismissible diagnostics overlay — the app underneath is never
                    unmounted by the watchdog. */}
                {navStalled && !navReady && (
                  <StallOverlay
                    copied={copied}
                    onCopy={handleCopyReport}
                    onReload={handleReloadNavigation}
                    onDismiss={() => setNavStalled(false)}
                  />
                )}
              </View>
            </SafeAreaProvider>
          </ThemeProvider>
        </GestureHandlerRootView>
      </GlobalErrorShield>
    </ErrorBoundary>
  );
}
