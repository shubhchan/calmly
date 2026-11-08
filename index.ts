import 'react-native-gesture-handler';
import './src/theme/fontPatcher';
import { Platform } from 'react-native';
import { registerRootComponent } from 'expo';
import App from './App';

// Register PWA service worker on Web
if (Platform.OS === 'web' && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((err) => {
      console.warn('PWA service worker registration failed:', err);
    });
  });
}

registerRootComponent(App);
