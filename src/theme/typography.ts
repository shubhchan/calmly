import { Platform, TextStyle } from 'react-native';

/**
 * Editorial & Humanist Typographic Design System for Calmly.
 * Grounded in DESIGN.md, Apple HIG 'Typography', and mindfulness design principles:
 * - Newsreader: Literary, warm, serif for headings, reflections, and mindfulness moments.
 * - Plus Jakarta Sans: Clean, geometric humanist sans for high legibility in UI and controls.
 */

export const fontFamilies = {
  // Editorial Serif (Headings, titles, sanctuary intros)
  serif: {
    regular: 'Newsreader_400Regular',
    medium: 'Newsreader_500Medium',
    semiBold: 'Newsreader_600SemiBold',
    bold: 'Newsreader_700Bold',
    italic: 'Newsreader_400Regular_Italic',
    fallback: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  // Humanist Sans (Body, buttons, metrics, navigation)
  sans: {
    regular: 'PlusJakartaSans_400Regular',
    medium: 'PlusJakartaSans_500Medium',
    semiBold: 'PlusJakartaSans_600SemiBold',
    bold: 'PlusJakartaSans_700Bold',
    extraBold: 'PlusJakartaSans_800ExtraBold',
    fallback: Platform.select({ ios: 'System', android: 'sans-serif', default: 'sans-serif' }),
  },
};

export const typography: Record<string, TextStyle> = {
  displayLarge: {
    fontFamily: fontFamilies.serif.bold,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.6,
  },
  displayMedium: {
    fontFamily: fontFamilies.serif.semiBold,
    fontSize: 26,
    lineHeight: 34,
    letterSpacing: -0.4,
  },
  displaySmall: {
    fontFamily: fontFamilies.serif.medium,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  titleLarge: {
    fontFamily: fontFamilies.sans.bold,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.3,
  },
  titleMedium: {
    fontFamily: fontFamilies.sans.semiBold,
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  titleSmall: {
    fontFamily: fontFamilies.sans.semiBold,
    fontSize: 15,
    lineHeight: 20,
  },
  bodyLarge: {
    fontFamily: fontFamilies.sans.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  bodyMedium: {
    fontFamily: fontFamilies.sans.regular,
    fontSize: 14,
    lineHeight: 21,
  },
  bodySmall: {
    fontFamily: fontFamilies.sans.regular,
    fontSize: 12,
    lineHeight: 18,
  },
  labelLarge: {
    fontFamily: fontFamilies.sans.semiBold,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 0.1,
  },
  labelMedium: {
    fontFamily: fontFamilies.sans.semiBold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.2,
  },
  labelSmall: {
    fontFamily: fontFamilies.sans.bold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.4,
  },
};
