import React from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { useAppTheme } from '../../theme/ThemeContext';
import { borderWidths, iconSizes, pressScale, radius, spacing } from '../../theme/tokens';
import { AppIcon } from '../AppIcon';
import { TactilePressable } from '../interactive/TactilePressable';
import { AppText } from './AppText';

export type ChipSize = 'sm' | 'md';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  size?: ChipSize;
  iconName?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const chipSizes: Record<ChipSize, { height: number; paddingHorizontal: number; iconSize: number }> = {
  sm: { height: 30, paddingHorizontal: spacing[3], iconSize: iconSizes.xs },
  md: { height: 36, paddingHorizontal: spacing[4], iconSize: iconSizes.sm },
};

/**
 * Pill-shaped selectable chip with optional leading icon, pressed scale
 * feedback and selected/disabled accessibility state.
 */
export function Chip({
  label,
  selected = false,
  onPress,
  size = 'md',
  iconName,
  disabled = false,
  style,
  testID,
}: ChipProps) {
  const theme = useAppTheme();
  const c = theme.colors;
  const spec = chipSizes[size];

  const ink = disabled ? c.disabled.foreground : selected ? c.primary.foreground : c.text.secondary;
  const background = disabled ? c.disabled.background : selected ? c.primary.default : c.surface.muted;
  const borderColor = disabled ? c.disabled.border : selected ? c.primary.default : c.border.default;

  return (
    <TactilePressable
      onPress={onPress}
      disabled={disabled}
      hapticStyle={disabled ? 'none' : 'selection'}
      scaleDownTo={pressScale.chip}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={label}
      testID={testID}
      style={[
        styles.chip,
        {
          height: spec.height,
          paddingHorizontal: spec.paddingHorizontal,
          backgroundColor: background,
          borderColor,
        },
        style,
      ]}
    >
      {iconName ? <AppIcon name={iconName} size={spec.iconSize} color={ink} animated={false} /> : null}
      <AppText variant={size === 'sm' ? 'labelSmall' : 'label'} color={ink} numberOfLines={1}>
        {label}
      </AppText>
    </TactilePressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
    borderRadius: radius.full,
    borderWidth: borderWidths.thin,
  },
});
