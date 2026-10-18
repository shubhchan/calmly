import React, { forwardRef } from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';
import { useAppTheme } from '../../theme/ThemeContext';
import { borderWidths, radius, resolveShadow, spacing } from '../../theme/tokens';
import { resolveTint, type TintName } from '../../theme/tints';
import { TactilePressable } from '../interactive/TactilePressable';

export interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'elevated' | 'outlined';
  /** Playful pastel tint — makes this card pop in one of eight colors. */
  tone?: TintName;
  className?: string;
  onPress?: () => void;
}

/**
 * Token-driven card. Same public API as the original component (variant +
 * pastel `tone` + optional press), now built on the design system.
 */
export const Card = forwardRef<View, CardProps>(
  ({ children, style, variant = 'default', tone, className = '', onPress, ...props }, ref) => {
    const theme = useAppTheme();
    const c = theme.colors;
    const tint = tone ? resolveTint(theme.isDark, tone) : null;

    const baseCardStyle: ViewStyle = {
      backgroundColor: tint ? tint.bg : c.surface.default,
      borderRadius: variant === 'elevated' ? radius['3xl'] : radius['2xl'],
      borderWidth: borderWidths.thin,
      borderColor: tint ? tint.border : c.border.default,
    };

    const shadow =
      variant === 'outlined'
        ? undefined
        : resolveShadow(variant === 'elevated' ? 'md' : 'sm', theme.isDark, c.text.primary);

    const flatCombinedStyle = [baseCardStyle, shadow, style];

    if (onPress) {
      return (
        <TactilePressable
          ref={ref}
          style={flatCombinedStyle}
          scaleDownTo={0.985}
          hapticStyle="light"
          onPress={onPress}
          accessibilityRole="button"
          className={className}
          {...props}
        >
          {children}
        </TactilePressable>
      );
    }

    return (
      <View ref={ref} style={flatCombinedStyle} className={className} {...props}>
        {children}
      </View>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader = ({ children, style, className = '', ...props }: React.ComponentProps<typeof View>) => (
  <View
    style={[
      { paddingHorizontal: spacing[5], paddingTop: spacing[5], paddingBottom: spacing[3] },
      style,
    ]}
    className={className}
    {...props}
  >
    {children}
  </View>
);

export const CardContent = ({ children, style, className = '', ...props }: React.ComponentProps<typeof View>) => (
  <View
    style={[{ paddingHorizontal: spacing[5], paddingVertical: spacing[4] }, style]}
    className={className}
    {...props}
  >
    {children}
  </View>
);

export const CardFooter = ({ children, style, className = '', ...props }: React.ComponentProps<typeof View>) => {
  const { colors } = useAppTheme();
  return (
    <View
      style={[
        {
          paddingHorizontal: spacing[5],
          paddingVertical: spacing[4],
          borderTopWidth: borderWidths.thin,
          borderTopColor: colors.border.default,
        },
        style,
      ]}
      className={className}
      {...props}
    >
      {children}
    </View>
  );
};
