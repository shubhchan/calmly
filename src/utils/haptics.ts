import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Safe, graceful haptic sensory feedback utility.
 * Grounded in Apple HIG 'Playing haptics' and Vercel mobile best practices.
 * Never throws on unsupported platforms (e.g. web or simulators without taptic engines).
 */
export const hapticFeedback = {
  /** Soft, subtle click feedback for buttons, chips, toggles, and tab switches */
  light: () => {
    if (Platform.OS === 'web') return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Graceful fallback
    }
  },

  /** Defined impact for meaningful actions like saving a reflection or completing a habit */
  medium: () => {
    if (Platform.OS === 'web') return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Graceful fallback
    }
  },

  /** Crisp selection tick for sliders, segmented tabs, or picker rolls */
  selection: () => {
    if (Platform.OS === 'web') return;
    try {
      Haptics.selectionAsync();
    } catch {
      // Graceful fallback
    }
  },

  /** Harmonious success notification for completing a session or daily goal */
  success: () => {
    if (Platform.OS === 'web') return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Graceful fallback
    }
  },

  /** Gentle warning notification */
  warning: () => {
    if (Platform.OS === 'web') return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {
      // Graceful fallback
    }
  },
};
