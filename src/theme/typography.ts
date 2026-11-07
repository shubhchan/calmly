import { Platform, TextStyle } from 'react-native';
import { getActiveFont } from './fontStore';

/**
 * Typographic system for Calmly — "Still Water".
 *
 * One voice: the user's active app font (default Plus Jakarta Sans) drives
 * titles, body copy, labels and every control.
 *
 * Display sizes 48 / 40 / 32 / 24 with -0.02em tracking.
 * Body sizes 17 / 15 / 13. Label 12 / 600.
 * Maximum three weights per screen; never bold body copy.
 */

/** Fixed editorial faces. Kept for font previews and back-compat. */
export const displayFaces = {
  regular: 'Newsreader_400Regular',
  medium: 'Newsreader_500Medium',
  semiBold: 'Newsreader_600SemiBold',
  bold: 'Newsreader_700Bold',
  italic: 'Newsreader_400Regular_Italic',
} as const;

/** Body and UI faces follow the user's font choice. */
export const fontFamilies = {
  get display() {
    return displayFaces;
  },
  // Active Font (Powers body copy, labels and every control)
  get calming() {
    const f = getActiveFont().faces;
    return {
      get regular() { return f.regular; },
      get medium() { return f.medium ?? f.regular; },
      get semiBold() { return f.bold ?? f.medium ?? f.regular; },
      get bold() { return f.bold ?? f.regular; },
      get fallback() { return f.regular; },
    };
  },
  // Headings mapped to the active font
  get serif() {
    const f = getActiveFont().faces;
    return {
      get regular() { return f.regular; },
      get medium() { return f.medium ?? f.regular; },
      get semiBold() { return f.bold ?? f.medium ?? f.regular; },
      get bold() { return f.bold ?? f.regular; },
      get italic() { return f.italic ?? f.regular; },
      get fallback() { return f.regular; },
    };
  },
  // Editorial Book Serif mapped to the active font
  get editorial() {
    const f = getActiveFont().faces;
    return {
      get regular() { return f.regular; },
      get medium() { return f.medium ?? f.regular; },
      get semiBold() { return f.bold ?? f.medium ?? f.regular; },
      get bold() { return f.bold ?? f.regular; },
      get italic() { return f.italic ?? f.regular; },
      get fallback() { return f.regular; },
    };
  },
  // Primary App Font - used everywhere across the app
  get sans() {
    const f = getActiveFont().faces;
    return {
      get regular() { return f.regular; },
      get medium() { return f.medium ?? f.regular; },
      get semiBold() { return f.bold ?? f.medium ?? f.regular; },
      get bold() { return f.bold ?? f.regular; },
      get extraBold() { return f.bold ?? f.regular; },
      get fallback() { return f.regular; },
    };
  },
};

export const typography: Record<string, TextStyle> = {
  displayLarge: {
    fontFamily: fontFamilies.sans.regular,
    fontSize: 48,
    lineHeight: 56,
    letterSpacing: -0.96,
  },
  displayMedium: {
    fontFamily: fontFamilies.sans.regular,
    fontSize: 40,
    lineHeight: 48,
    letterSpacing: -0.8,
  },
  displaySmall: {
    fontFamily: fontFamilies.sans.regular,
    fontSize: 32,
    lineHeight: 42,
    letterSpacing: -0.64,
  },
  quote: {
    fontFamily: fontFamilies.sans.regular,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.2,
  },
  titleLarge: {
    fontFamily: fontFamilies.sans.semiBold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  titleMedium: {
    fontFamily: fontFamilies.sans.semiBold,
    fontSize: 17,
    lineHeight: 24,
    letterSpacing: 0,
  },
  titleSmall: {
    fontFamily: fontFamilies.sans.semiBold,
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0,
  },
  bodyLarge: {
    fontFamily: fontFamilies.sans.regular,
    fontSize: 17,
    lineHeight: 25,
    letterSpacing: 0,
  },
  bodyMedium: {
    fontFamily: fontFamilies.sans.regular,
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0,
  },
  bodySmall: {
    fontFamily: fontFamilies.sans.regular,
    fontSize: 13,
    lineHeight: 19,
    letterSpacing: 0,
  },
  labelLarge: {
    fontFamily: fontFamilies.sans.semiBold,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0,
  },
  labelMedium: {
    fontFamily: fontFamilies.sans.semiBold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.2,
  },
  labelSmall: {
    fontFamily: fontFamilies.sans.semiBold,
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 0.4,
  },
};

// Platform is kept for downstream modules that import it from this file.
export const fontPlatform = Platform.OS;
