/**
 * Size tokens — component heights, icon sizes, border widths, touch targets.
 *
 * All interactive elements honor the 44pt minimum touch target; visual height
 * may be smaller as long as hitSlop covers the remainder.
 */

import { StyleSheet } from 'react-native';
import { spacing } from './spacing';

export const sizes = {
  /** Apple/Google minimum comfortable touch target. */
  touchTarget: 44,
  /** Standard hitSlop to extend small controls to the touch target. */
  hitSlop: { top: 8, bottom: 8, left: 8, right: 8 },
  screenPadding: spacing[5],
  contentMaxWidth: 640,
  headerHeight: 56,
  tabBarHeight: 58,
} as const;

export const buttonSizes = {
  sm: { height: 40, paddingHorizontal: spacing[4], gap: spacing[2], iconSize: 16 },
  md: { height: 48, paddingHorizontal: spacing[5], gap: spacing[2], iconSize: 18 },
  lg: { height: 54, paddingHorizontal: spacing[6], gap: spacing[3], iconSize: 20 },
} as const;

export type ControlSize = keyof typeof buttonSizes;

export const inputSizes = {
  sm: { height: 44, paddingHorizontal: spacing[4], fontSize: 14 },
  md: { height: 52, paddingHorizontal: spacing[4], fontSize: 15 },
  lg: { height: 60, paddingHorizontal: spacing[5], fontSize: 17 },
} as const;

export type InputSize = keyof typeof inputSizes;

export const iconButtonSizes = {
  sm: 32,
  md: 40,
  lg: 48,
} as const;

export type IconButtonSize = keyof typeof iconButtonSizes;

export const avatarSizes = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
  '2xl': 80,
} as const;

export type AvatarSize = keyof typeof avatarSizes;

export const iconSizes = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  '2xl': 40,
} as const;

export type IconSize = keyof typeof iconSizes;

export const borderWidths = {
  none: 0,
  hairline: StyleSheet.hairlineWidth,
  thin: 1,
  medium: 1.5,
  thick: 2,
} as const;

export const dividerThickness = StyleSheet.hairlineWidth;
