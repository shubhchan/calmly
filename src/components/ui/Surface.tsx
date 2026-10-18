import React from 'react';
import { View, ViewProps, ViewStyle, StyleProp } from 'react-native';
import { useAppTheme } from '../../theme/ThemeContext';
import {
  radius,
  resolveShadow,
  spacing,
  type ElevationLevel,
  type RadiusToken,
  type SpacingToken,
} from '../../theme/tokens';
import { resolveTint, type TintName } from '../../theme/tints';

export type SurfaceBackground =
  | 'card'
  | 'background'
  | 'secondary'
  | 'tertiary'
  | 'muted'
  | 'transparent';

export type SurfaceBorder = 'none' | 'subtle' | 'default' | 'strong';

export interface SurfaceProps extends ViewProps {
  /** Fill role — defaults to the standard card surface. */
  background?: SurfaceBackground;
  border?: SurfaceBorder;
  radiusToken?: RadiusToken;
  elevationLevel?: ElevationLevel;
  /** Uniform padding from the spacing scale. */
  padding?: SpacingToken;
  /** Optional playful pastel tone (overrides background + border). */
  tone?: TintName;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/**
 * Themed container primitive. Cards, sheets, banners and grouped rows should
 * build on Surface so fills, borders, radii and shadows stay token-driven.
 */
export function Surface({
  background = 'card',
  border = 'none',
  radiusToken = 'xl',
  elevationLevel = 'none',
  padding,
  tone,
  style,
  children,
  ...rest
}: SurfaceProps) {
  const theme = useAppTheme();
  const c = theme.colors;
  const tint = tone ? resolveTint(theme.isDark, tone) : null;

  const fill: Record<SurfaceBackground, string> = {
    card: c.surface.default,
    background: c.background.default,
    secondary: c.background.secondary,
    tertiary: c.background.tertiary,
    muted: c.surface.muted,
    transparent: 'transparent',
  };

  const borderColor: Record<SurfaceBorder, string> = {
    none: 'transparent',
    subtle: c.border.subtle,
    default: c.border.default,
    strong: c.border.strong,
  };

  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: tint ? tint.bg : fill[background],
          borderRadius: radius[radiusToken],
          borderWidth: border === 'none' && !tint ? 0 : 1,
          borderColor: tint ? tint.border : borderColor[border],
          padding: padding !== undefined ? spacing[padding] : undefined,
        },
        resolveShadow(elevationLevel, theme.isDark, c.text.primary),
        style,
      ]}
    >
      {children}
    </View>
  );
}
