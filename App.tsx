import 'react-native-gesture-handler';
import './global.css';
import React, { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/theme/ThemeContext';
import { RootNavigator } from './src/routing/navigation';
import {
  ErrorBoundary,
  GlobalErrorShield,
  CrashScreen,
  bootLog,
  getBootTrail,
} from './src/components/ErrorBoundary';

const NAV_READY_TIMEOUT_MS = 12000;

export default function App() {
  const [navReady, setNavReady] = useState(false);
  const [navStuck, setNavStuck] = useState(false);
  const navReadyRef = useRef(false);

  useEffect(() => {
    bootLog('app-mounted');
    const timer = setTimeout(() => {
      if (!navReadyRef.current) {
        bootLog('WATCHDOG navigation not ready after 12s');
        setNavStuck(true);
      }
    }, NAV_READY_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);

  const handleNavReady = () => {
    navReadyRef.current = true;
    setNavReady(true);
    bootLog('nav-ready');
  };

  void navReady;

  // Navigation never became ready: turn the silent blank screen into a
  // copy-paste report (boot trail included) instead of leaving white/grey.
  if (navStuck) {
    return (
      <ErrorBoundary>
        <CrashScreen
          info={{
            error: new Error(
              'App stayed blank: navigation never became ready. ' +
                `Boot trail: ${getBootTrail().join(' | ') || '(empty — JS may not be executing)'}`,
            ),
            where: 'uncaught-js',
          }}
          onReset={() => setNavStuck(false)}
        />
      </ErrorBoundary>
    );
  }
  return (
    <ErrorBoundary>
      <GlobalErrorShield>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#FDFBF7' }}>
      <ThemeProvider>
        <SafeAreaProvider>
          <NavigationContainer onReady={handleNavReady}>
            {/* Solid fallback background: if NativeWind theme vars ever fail to
                resolve in a release bundle, the window still paints the light
                theme base instead of the native root view's grey. */}
            <View style={{ flex: 1, backgroundColor: '#FDFBF7' }}>
              <StatusBar />
              <RootNavigator />
            </View>
          </NavigationContainer>
        </SafeAreaProvider>
      </ThemeProvider>
      </GestureHandlerRootView>
      </GlobalErrorShield>
    </ErrorBoundary>
  );
}
