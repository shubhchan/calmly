import 'react-native-gesture-handler';
import './src/theme/fontPatcher';
import './global.css';
import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View, StatusBar as RNStatusBar, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeProvider, useThemeColors } from './src/theme/ThemeContext';
import { AppIcon } from './src/components/AppIcon';
import { RootNavigator } from './src/routing/navigation';
import {
  ErrorBoundary,
  GlobalErrorShield,
  buildErrorReport,
  bootLog,
  getBootTrail,
} from './src/components/ErrorBoundary';
import { useFonts } from 'expo-font';
import { getBundledFontAssets } from './src/theme/fontRegistry';
import { hydrateMotionPrefs } from './src/theme/motion';
import { restoreSavedFont } from './src/services/googleFonts';
import { BrandedLoader } from './src/components/interactive/LoadingState';

const NAV_READY_TIMEOUT_MS = 12000;

/**
 * Reserve the status-bar height once at the app shell so every screen starts
 * below it (edge-to-edge Android draws behind the status bar otherwise).
 * Theme-tinted so there's no cream strip in dark mode. Renders nothing when
 * the inset is 0. Must stay inside SafeAreaProvider + ThemeProvider.
 */
function TopInsetSpacer() {
  const insets = useSafeAreaInsets();
  let colors: any;
  try {
    colors = useThemeColors();
  } catch {
    colors = { bgPrimary: '#FBF9F5', isDark: false };
  }
  const top = insets?.top ?? 0;
  if (!top) return null;
  const barColor = colors?.bgPrimary ?? (colors?.isDark ? '#0F141C' : '#FBF9F5');
  return <View style={{ height: top, backgroundColor: barColor }} />;
}

/**
 * Paints instantly (first commit) underneath the navigation tree, so the user
 * never stares at a blank/native-grey window while navigation initializes.
 * It stays mounted until NavigationContainer reports ready, then unmounts.
 * Absolutely positioned so it never affects the navigation layout.
 */
function BootSplash() {
  let colors: any;
  try {
    colors = useThemeColors();
  } catch {
    colors = {
      bgPrimary: '#FBF9F5',
      accentPrimary: '#3E7B52',
      textPrimary: '#1A212D',
      textTertiary: '#607085',
    };
  }
  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: colors?.bgPrimary ?? '#FBF9F5',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
      }}
    >
      <AppIcon name="i-leaf" size={48} color={colors?.accentPrimary ?? '#3E7B52'} />
      <Text
        style={{
          marginTop: 14,
          fontSize: 26,
          fontWeight: '700',
          color: colors?.textPrimary ?? '#1A212D',
          letterSpacing: -0.3,
        }}
      >
        Calmly
      </Text>
      <Text
        style={{
          marginTop: 6,
          fontSize: 14,
          color: colors?.textTertiary ?? '#607085',
          textAlign: 'center',
        }}
      >
        Take a gentle breath…
      </Text>
      <View style={{ marginTop: 18 }}>
        <BrandedLoader />
      </View>
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
  bootLog('stall-overlay-render');
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
      <AppIcon name="i-time" size={40} color="#EB876D" />
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

/**
 * Commits ONLY if the Suspense boundary above the navigation tree pends.
 * Distinguishes "nav tree suspended (promise never resolved)" from
 * "NavigationContainer never rendered children".
 */
function SuspenseFallbackProbe() {
  useEffect(() => {
    bootLog('suspense-fallback-shown (nav tree suspended)');
  }, []);
  return null;
}

/**
 * Render-phase marker placed as a direct child of NavigationContainer.
 * If this logs but root-navigator-render doesn't, RootNavigator itself is
 * the blocker. If this never logs, NavigationContainer never rendered
 * children (threw before children, or the boundary pended first).
 */
function NavChildrenProbe({ children }: { children: React.ReactNode }) {
  const loggedRef = useRef(false);
  if (!loggedRef.current) {
    loggedRef.current = true;
    bootLog('nav-container-children-render');
  }
  return <>{children}</>;
}

function AppShell({
  navReady,
  fontsLoaded,
  navStalled,
  navKey,
  copied,
  handleNavReady,
  handleStateChange,
  handleReloadNavigation,
  handleCopyReport,
  setNavStalled,
}: {
  navReady: boolean;
  fontsLoaded: boolean;
  navStalled: boolean;
  navKey: number;
  copied: boolean;
  handleNavReady: () => void;
  handleStateChange: () => void;
  handleReloadNavigation: () => void;
  handleCopyReport: () => void;
  setNavStalled: (s: boolean) => void;
}) {
  let colors: any;
  try {
    colors = useThemeColors();
  } catch {
    colors = { bgPrimary: '#FBF9F5', isDark: false };
  }
  const isDark = !!colors?.isDark;
  const statusBarColor = colors?.bgPrimary ?? (isDark ? '#0F141C' : '#FBF9F5');
  const barStyle = isDark ? 'light-content' : 'dark-content';

  // The navigation container's own background must match the app surface.
  // Otherwise React Navigation's default light-grey theme shows through during
  // any scene transition — the literal white/grey "flash" on page change.
  const navTheme = useMemo(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors?.accentPrimary ?? '#3E7B52',
        background: colors?.bgPrimary ?? (isDark ? '#111722' : '#FAF8F5'),
        card: colors?.bgCard ?? colors?.bgPrimary ?? (isDark ? '#17202E' : '#FFFFFF'),
        text: colors?.textPrimary ?? (isDark ? '#E8ECF1' : '#1A212D'),
        border: colors?.borderLight ?? (isDark ? '#243245' : '#EBE3D5'),
        notification: colors?.accentPrimary ?? '#3E7B52',
      },
    };
  }, [isDark, colors]);

  useEffect(() => {
    if (Platform.OS === 'android') {
      try {
        RNStatusBar.setBarStyle(barStyle, true);
        RNStatusBar.setBackgroundColor(statusBarColor, true);
      } catch (e) {
        console.warn('Status bar update error:', e);
      }
    }
  }, [isDark, statusBarColor, barStyle]);

  return (
    <View style={{ flex: 1, backgroundColor: statusBarColor }}>
      <TopInsetSpacer />
      <RNStatusBar
        barStyle={barStyle}
        backgroundColor={statusBarColor}
        translucent={true}
      />
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {(!navReady || !fontsLoaded) && <BootSplash />}
      <Suspense fallback={<SuspenseFallbackProbe />}>
        <NavigationContainer
          key={`nav-${navKey}`}
          theme={navTheme}
          onReady={handleNavReady}
          onStateChange={handleStateChange}
        >
          <NavChildrenProbe>
            <RootNavigator />
          </NavChildrenProbe>
        </NavigationContainer>
      </Suspense>
      {navStalled && !navReady && (
        <StallOverlay
          copied={copied}
          onCopy={handleCopyReport}
          onReload={handleReloadNavigation}
          onDismiss={() => setNavStalled(false)}
        />
      )}
    </View>
  );
}

const bundledFontAssets = getBundledFontAssets();

export default function App() {
  const [fontsLoaded] = useFonts(bundledFontAssets);

  const [navReady, setNavReady] = useState(false);
  const [navStalled, setNavStalled] = useState(false);
  const [navKey, setNavKey] = useState(0);
  const [copied, setCopied] = useState(false);
  const navReadyRef = useRef(false);
  const firstStateChangeLoggedRef = useRef(false);
  const renderMarkerRef = useRef(false);
  if (!renderMarkerRef.current) {
    renderMarkerRef.current = true;
    bootLog('app-render v3-probes');
  }
  const bisectMarkerRef = useRef(false);
  if (!bisectMarkerRef.current) {
    bisectMarkerRef.current = true;
    bootLog('bisect-marker-render');
  }

  useEffect(() => {
    hydrateMotionPrefs();
  }, []);

  useEffect(() => {
    if (!fontsLoaded) return;
    // Re-apply the persisted app-wide font choice (bundled or downloaded).
    restoreSavedFont();
  }, [fontsLoaded]);

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
        <ThemeProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
              <AppShell
                navReady={navReady}
                fontsLoaded={fontsLoaded}
                navStalled={navStalled}
                navKey={navKey}
                copied={copied}
                handleNavReady={handleNavReady}
                handleStateChange={handleStateChange}
                handleReloadNavigation={handleReloadNavigation}
                handleCopyReport={handleCopyReport}
                setNavStalled={setNavStalled}
              />
            </SafeAreaProvider>
          </GestureHandlerRootView>
        </ThemeProvider>
      </GlobalErrorShield>
    </ErrorBoundary>
  );
}

