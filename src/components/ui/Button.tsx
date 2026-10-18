import React, { forwardRef } from 'react';
import { ActivityIndicator, StyleProp, TextStyle, View, ViewStyle } from 'react-native';
import { useAppTheme } from '../../theme/ThemeContext';
import {
  borderWidths,
  buttonSizes,
  opacity,
  pressScale,
  radius,
  resolveShadow,
  sizes,
  type ControlSize,
} from '../../theme/tokens';
import { TactilePressable } from '../interactive/TactilePressable';
import { AppText } from './AppText';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';

export interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ControlSize;
  disabled?: boolean;
  loading?: boolean;
  /** Static node or `(color, size) => node` to auto-match the button's ink. */
  leftIcon?: React.ReactNode | ((color: string, size: number) => React.ReactNode);
  rightIcon?: React.ReactNode | ((color: string, size: number) => React.ReactNode);
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  className?: string;
  accessibilityLabel?: string;
  testID?: string;
}

const fontSizeBySize: Record<ControlSize, number> = { sm: 14, md: 16, lg: 17 };

function renderIcon(
  icon: ButtonProps['leftIcon'],
  color: string,
  size: number,
): React.ReactNode {
  if (!icon) return null;
  return typeof icon === 'function' ? icon(color, size) : icon;
}

/**
 * Primary action component. Pill-shaped, token-driven, with press physics,
 * haptics, loading and disabled states, and accessible contrast in both themes.
 */
export const Button = forwardRef<View, ButtonProps>(function Button(
  {
    title,
    onPress,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    style,
    textStyle,
    className,
    accessibilityLabel,
    testID,
  }: ButtonProps,
  ref,
) {
  const theme = useAppTheme();
  const c = theme.colors;
  const isDisabled = disabled || loading;
  const sizeSpec = buttonSizes[size];

  // Ink for text/icons sitting ON a solid color fill (primary/destructive).
  // Dark-mode accents are bright, so dark ink reads better than white.
  const solidInk = theme.isDark ? theme.raw.bgPrimary : '#FFFFFF';

  let background = 'transparent';
  let borderColor = 'transparent';
  let borderWidth = 0;
  let ink = c.primary.default;

  switch (variant) {
    case 'primary':
      background = isDisabled ? c.primary.disabled : c.primary.default;
      ink = c.primary.foreground;
      break;
    case 'secondary':
      background = c.primary.subtle;
      borderColor = c.primary.subtleBorder;
      borderWidth = borderWidths.thin;
      ink = isDisabled ? c.text.disabled : c.primary.default;
      break;
    case 'outline':
      borderColor = isDisabled ? c.border.disabled : c.primary.default;
      borderWidth = borderWidths.medium;
      ink = isDisabled ? c.text.disabled : c.primary.default;
      break;
    case 'ghost':
      ink = isDisabled ? c.text.disabled : c.primary.default;
      break;
    case 'destructive':
      background = c.status.error.default;
      ink = solidInk;
      break;
  }

  const shadow =
    variant === 'primary' && !isDisabled
      ? resolveShadow('md', theme.isDark, c.primary.default)
      : variant === 'destructive' && !isDisabled
        ? resolveShadow('sm', theme.isDark, c.status.error.default)
        : undefined;

  const wrapperOpacity =
    isDisabled && (variant === 'secondary' || variant === 'destructive') ? opacity.disabled : 1;

  return (
    <TactilePressable
      ref={ref}
      onPress={onPress}
      disabled={isDisabled}
      hapticStyle={isDisabled ? 'none' : 'light'}
      scaleDownTo={pressScale.button}
      className={className}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      testID={testID}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: radius.full,
          minHeight: sizeSpec.height,
          minWidth: sizes.touchTarget,
          paddingHorizontal: sizeSpec.paddingHorizontal,
          gap: sizeSpec.gap,
          backgroundColor: background,
          borderColor,
          borderWidth,
          width: fullWidth ? '100%' : undefined,
          opacity: wrapperOpacity,
        },
        shadow,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={ink} />
      ) : (
        renderIcon(leftIcon, ink, sizeSpec.iconSize)
      )}
      <AppText
        variant="button"
        color={ink}
        numberOfLines={1}
        style={[{ fontSize: fontSizeBySize[size] }, textStyle]}
      >
        {title}
      </AppText>
      {!loading && renderIcon(rightIcon, ink, sizeSpec.iconSize)}
    </TactilePressable>
  );
});
