/**
 * Elevation — one shadow per intent, tuned per platform.
 *
 * iOS uses shadow* props; Android uses `elevation`. Dark mode pushes opacity
 * up so surfaces still separate from the background without glowing.
 */

import type { ViewStyle } from 'react-native';

export type ElevationLevel = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface ElevationSpec {
  offsetY: number;
  radius: number;
  elevation: number;
  lightOpacity: number;
  darkOpacity: number;
}

const levels: Record<ElevationLevel, ElevationSpec> = {
  none: { offsetY: 0, radius: 0, elevation: 0, lightOpacity: 0, darkOpacity: 0 },
  xs: { offsetY: 1, radius: 2, elevation: 1, lightOpacity: 0.04, darkOpacity: 0.3 },
  sm: { offsetY: 2, radius: 8, elevation: 2, lightOpacity: 0.05, darkOpacity: 0.35 },
  md: { offsetY: 3, radius: 12, elevation: 3, lightOpacity: 0.08, darkOpacity: 0.4 },
  lg: { offsetY: 6, radius: 18, elevation: 6, lightOpacity: 0.1, darkOpacity: 0.45 },
  xl: { offsetY: 10, radius: 26, elevation: 12, lightOpacity: 0.14, darkOpacity: 0.5 },
};

/**
 * Resolve an elevation level into a platform-ready style.
 * Pass the theme's strongest foreground as `shadowColor`.
 */
export function resolveShadow(
  level: ElevationLevel,
  isDark: boolean,
  shadowColor = '#0F172A',
): ViewStyle {
  const spec = levels[level];
  if (level === 'none') return {};
  return {
    shadowColor,
    shadowOffset: { width: 0, height: spec.offsetY },
    shadowOpacity: isDark ? spec.darkOpacity : spec.lightOpacity,
    shadowRadius: spec.radius,
    elevation: spec.elevation,
  };
}

/** Elevation per component family — documented intents, no ad-hoc shadows. */
export const elevation = {
  flat: 'none',
  card: 'sm',
  raisedCard: 'md',
  dropdown: 'lg',
  floatingButton: 'md',
  dialog: 'xl',
  bottomSheet: 'xl',
  toast: 'lg',
  tabBar: 'lg',
} as const satisfies Record<string, ElevationLevel>;
