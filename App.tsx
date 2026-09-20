import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { ThemeProvider } from './src/theme/ThemeContext';
import { RootNavigator } from './src/routing/navigation';

export default function App() {
  return (
    <ThemeProvider>
      <View style={{ flex: 1 }}>
        <StatusBar />
        <RootNavigator />
      </View>
    </ThemeProvider>
  );
}