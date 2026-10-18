import { Platform, TextStyle } from 'react-native';
import { getActiveFont } from './fontStore';

/**
 * Editorial & Humanist Typographic Design System for Calmly.
 * Dynamic: reads the currently active font (bundled or Google Font) with weight hierarchy.
 */

export const fontFamilies = {
  // Active Font (Powers screen titles, greetings, mindfulness cards, quotes)
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
  // Headings mapped to active font
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
  // Editorial Book Serif mapped to active font
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
