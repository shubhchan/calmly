import 'react-native-gesture-handler';
import './global.css';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/theme/ThemeContext';
import { RootNavigator } from './src/routing/navigation';
import { ErrorBoundary } from './src/components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <SafeAreaProvider>
          <NavigationContainer>
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
    </ErrorBoundary>
  );
}
