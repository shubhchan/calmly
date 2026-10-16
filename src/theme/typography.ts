import { Platform, TextStyle } from 'react-native';

/**
 * Editorial & Humanist Typographic Design System for Calmly.
 * Grounded in DESIGN.md, Apple HIG 'Typography', and mindfulness design principles:
 * - Newsreader: Literary, warm, serif for headings, reflections, and mindfulness moments.
 * - Plus Jakarta Sans: Clean, geometric humanist sans for high legibility in UI and controls.
 */

export const fontFamilies = {
  // Oddly Calming Handwritten Display (Powers screen titles, greetings, mindfulness cards, quotes)
  calming: {
    regular: 'OddlyCalming',
    medium: 'OddlyCalming',
    semiBold: 'OddlyCalming',
    bold: 'OddlyCalming',
    fallback: 'OddlyCalming',
  },
  // Headings mapped to Oddly Calming for global friendly journal aesthetic
  serif: {
    regular: 'OddlyCalming',
    medium: 'OddlyCalming',
    semiBold: 'OddlyCalming',
    bold: 'OddlyCalming',
    italic: 'OddlyCalming',
    fallback: 'OddlyCalming',
  },
  // Editorial Book Serif mapped to Oddly Calming
  editorial: {
    regular: 'OddlyCalming',
    medium: 'OddlyCalming',
    semiBold: 'OddlyCalming',
    bold: 'OddlyCalming',
    italic: 'OddlyCalming',
    fallback: 'OddlyCalming',
  },
  // Primary App Font - Oddly Calming used everywhere across the app
  sans: {
    regular: 'OddlyCalming',
    medium: 'OddlyCalming',
    semiBold: 'OddlyCalming',
    bold: 'OddlyCalming',
    extraBold: 'OddlyCalming',
    fallback: 'OddlyCalming',
  },
};

export const typography: Record<string, TextStyle> = {
  displayLarge: {
    fontFamily: fontFamilies.calming.bold,
    fontSize: 34,
    lineHeight: 42,
    letterSpacing: 0.1,
  },
  displayMedium: {
    fontFamily: fontFamilies.calming.semiBold,
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: 0.1,
  },
  displaySmall: {
    fontFamily: fontFamilies.calming.medium,
    fontSize: 23,
    lineHeight: 30,
    letterSpacing: 0.1,
  },
  quote: {
    fontFamily: fontFamilies.calming.regular,
    fontSize: 21,
    lineHeight: 28,
    letterSpacing: 0.2,
  },
  titleLarge: {
    fontFamily: fontFamilies.sans.bold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: 0.1,
  },
  titleMedium: {
    fontFamily: fontFamilies.sans.semiBold,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: 0.1,
  },
  titleSmall: {
    fontFamily: fontFamilies.sans.semiBold,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0.1,
  },
  bodyLarge: {
    fontFamily: fontFamilies.sans.regular,
    fontSize: 17,
    lineHeight: 25,
    letterSpacing: 0.15,
  },
  bodyMedium: {
    fontFamily: fontFamilies.sans.regular,
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0.15,
  },
  bodySmall: {
    fontFamily: fontFamilies.sans.regular,
    fontSize: 13,
    lineHeight: 19,
    letterSpacing: 0.15,
  },
  labelLarge: {
    fontFamily: fontFamilies.sans.semiBold,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  labelMedium: {
    fontFamily: fontFamilies.sans.semiBold,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.2,
  },
  labelSmall: {
    fontFamily: fontFamilies.sans.bold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.3,
  },
};
