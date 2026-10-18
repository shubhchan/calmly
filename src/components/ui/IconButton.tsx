import React, { forwardRef } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { useAppTheme } from '../../theme/ThemeContext';
import {
  borderWidths,
  iconButtonSizes,
  iconSizes,
  pressScale,
  radius,
  sizes,
  type IconButtonSize,
} from '../../theme/tokens';
import { resolveIconColor, type IconTone } from '../../theme/tokens';
import { AppIcon, type AppIconName } from '../AppIcon';
import { TactilePressable } from '../interactive/TactilePressable';

export type IconButtonVariant = 'ghost' | 'subtle' | 'solid' | 'outline';

export interface IconButtonProps {
  icon: AppIconName | string;
  /** Required for accessibility — icon-only controls have no visible label. */
  accessibilityLabel: string;
  onPress?: () => void;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  /** Icon tone for ghost/subtle/outline; solid always uses on-primary ink. */
  tone?: IconTone;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const iconSizeFor: Record<IconButtonSize, number> = {
  sm: iconSizes.sm,
  md: iconSizes.md,
  lg: iconSizes.lg,
};

/** Circular, token-driven icon-only control with press physics + haptics. */
export const IconButton = forwardRef<View, IconButtonProps>(function IconButton(
  {
    icon,
    accessibilityLabel,
    onPress,
    variant = 'ghost',
    size = 'md',
    tone,
    disabled = false,
    style,
    testID,
  }: IconButtonProps,
  ref,
) {
  const theme = useAppTheme();
  const c = theme.colors;
  const dimension = iconButtonSizes[size];
  const iconSize = iconSizeFor[size];

  let background = 'transparent';
  let borderColor = 'transparent';
  let borderWidth = 0;
  let ink: string;

  switch (variant) {
    case 'ghost':
      ink = disabled ? c.text.disabled : resolveIconColor(tone ?? 'primary', theme.raw);
      break;
    case 'subtle':
      background = c.surface.muted;
      ink = disabled ? c.text.disabled : resolveIconColor(tone ?? 'default', theme.raw);
      break;
    case 'outline':
      borderColor = disabled ? c.border.disabled : c.border.default;
      borderWidth = borderWidths.thin;
      ink = disabled ? c.text.disabled : resolveIconColor(tone ?? 'default', theme.raw);
      break;
    case 'solid':
      background = disabled ? c.primary.disabled : c.primary.default;
      ink = c.primary.foreground;
      break;
  }

  // Keep touch targets >= 44 even for the sm (32pt) circle.
  const needsHitSlop = dimension < sizes.touchTarget;

  return (
    <TactilePressable
      ref={ref}
      onPress={onPress}
      disabled={disabled}
      hapticStyle={disabled ? 'none' : 'light'}
      scaleDownTo={pressScale.iconButton}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      testID={testID}
      hitSlop={needsHitSlop ? sizes.hitSlop : undefined}
      style={[
        {
          width: dimension,
          height: dimension,
          borderRadius: radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: background,
          borderColor,
          borderWidth,
          opacity: disabled && variant !== 'solid' ? 0.7 : 1,
        },
        style,
      ]}
    >
      <AppIcon name={icon} size={iconSize} color={ink} animated={false} />
    </TactilePressable>
  );
});
