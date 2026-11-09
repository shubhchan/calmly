import { Platform, useWindowDimensions } from 'react-native';

/**
 * Shared screen breakpoints.
 *
 * `wide` is the point where a pointer-first desktop layout takes over: a left
 * rail replaces the bottom tab bar and content is capped to a readable column.
 */
export const breakpoints = {
  medium: 720,
  wide: 1024,
} as const;

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const isMedium = width >= breakpoints.medium;
  const isWide = width >= breakpoints.wide;
  const usesDesktopNav = Platform.OS === 'web' && isWide;

  return {
    width,
    height,
    isMedium,
    isWide,
    usesDesktopNav,
    /** Comfortable editorial column on large screens. */
    contentMaxWidth: isWide ? 1120 : 720,
    /** Reads better for long lists and forms inside a wide shell. */
    readingMaxWidth: isWide ? 760 : undefined,
    pagePadding: isWide ? 48 : 24,
  };
}
