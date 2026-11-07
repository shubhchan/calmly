/**
 * Elevation — one shadow per intent, tuned per platform.
 *
 * Still Water uses contrast first: most surfaces have no shadow at all.
 * When a shadow is needed it is soft, low and green-tinted, never a hard drop.
 * Project the shadow color from the theme's ink (a dark pine), not pure black.
 *
 * iOS uses shadow* props; Android uses `elevation`.
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
  xs: { offsetY: 1, radius: 2, elevation: 1, lightOpacity: 0.03, darkOpacity: 0.24 },
  sm: { offsetY: 2, radius: 6, elevation: 2, lightOpacity: 0.04, darkOpacity: 0.28 },
  md: { offsetY: 3, radius: 10, elevation: 3, lightOpacity: 0.05, darkOpacity: 0.32 },
  lg: { offsetY: 6, radius: 18, elevation: 6, lightOpacity: 0.07, darkOpacity: 0.38 },
  xl: { offsetY: 10, radius: 28, elevation: 10, lightOpacity: 0.1, darkOpacity: 0.44 },
};

/** Default shadow ink for light mode. Always a deep pine, not black. */
export const SHADOW_INK = '#14201B';

/**
 * Resolve an elevation level into a platform-ready style.
 * Pass the theme's strongest foreground as `shadowColor`.
 */
export function resolveShadow(
  level: ElevationLevel,
  isDark: boolean,
  shadowColor = SHADOW_INK,
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
  card: 'none',
  raisedCard: 'xs',
  dropdown: 'lg',
  floatingButton: 'md',
  dialog: 'xl',
  bottomSheet: 'xl',
  toast: 'lg',
  tabBar: 'none',
} as const satisfies Record<string, ElevationLevel>;
