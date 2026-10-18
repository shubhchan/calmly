/**
 * Icon tokens — consistent sizing, coloring and alignment.
 * The app uses Ionicons (via AppIcon) + MaterialCommunityIcons; never mix in
 * another icon library. Prefer outline variants for inactive, filled for active.
 */

import type { ResolvedColors } from '../palette';
import { iconSizes, type IconSize } from './sizes';

export { iconSizes };
export type { IconSize };

export type IconTone =
  | 'default'
  | 'subtle'
  | 'disabled'
  | 'primary'
  | 'inverse'
  | 'success'
  | 'warning'
  | 'error'
  | 'info';

/** Map an icon tone to a theme color. */
export function resolveIconColor(tone: IconTone, colors: ResolvedColors): string {
  switch (tone) {
    case 'default':
      return colors.textPrimary;
    case 'subtle':
      return colors.textTertiary;
    case 'disabled':
      return colors.textTertiary;
    case 'primary':
      return colors.accentPrimary;
    case 'inverse':
      return colors.textInverse;
    case 'success':
      return colors.success;
    case 'warning':
      return colors.warning;
    case 'error':
      return colors.error;
    case 'info':
      return colors.info;
  }
}

/** Icons align to the optical center of the first text line: size / 2. */
export function iconTextOffset(iconSize: number): number {
  return Math.round(iconSize / 2);
}
