import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useAppTheme } from '../../theme/ThemeContext';
import { borderWidths, iconSizes, pressScale, radius, sizes, spacing } from '../../theme/tokens';
import { AppIcon } from '../AppIcon';
import { TactilePressable } from '../interactive/TactilePressable';
import { AppText } from './AppText';

export type CheckboxSize = 'sm' | 'md';

export interface CheckboxProps {
  checked: boolean;
  onToggle: () => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: CheckboxSize;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const boxSizes: Record<CheckboxSize, number> = { sm: 20, md: 24 };
const checkIconSizes: Record<CheckboxSize, number> = { sm: iconSizes.xs, md: iconSizes.sm };

/**
 * Accessible checkbox row: token-driven box, optional label and description,
 * tactile press feedback and full disabled styling.
 */
export function Checkbox({
  checked,
  onToggle,
  label,
  description,
  disabled = false,
  size = 'md',
  style,
  testID,
}: CheckboxProps) {
  const theme = useAppTheme();
  const c = theme.colors;
  const dimension = boxSizes[size];

  const boxBackground = disabled ? c.disabled.background : checked ? c.primary.default : 'transparent';
  const boxBorderColor = disabled ? c.disabled.border : checked ? c.primary.default : c.border.strong;
  const iconColor = disabled ? c.disabled.foreground : c.primary.foreground;

  return (
    <TactilePressable
      onPress={onToggle}
      disabled={disabled}
      hapticStyle={disabled ? 'none' : 'selection'}
      scaleDownTo={pressScale.card}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={label ?? 'Checkbox'}
      testID={testID}
      style={[styles.row, style]}
    >
      <View
        style={{
          width: dimension,
          height: dimension,
          borderRadius: radius.sm,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: boxBackground,
          borderWidth: checked ? borderWidths.none : borderWidths.medium,
          borderColor: boxBorderColor,
        }}
      >
        {checked ? (
          <AppIcon name="i-check" size={checkIconSizes[size]} color={iconColor} animated={false} />
        ) : null}
      </View>
      {label || description ? (
        <View style={styles.textColumn}>
          {label ? (
            <AppText variant="body" tone={disabled ? 'disabled' : 'primary'}>
              {label}
            </AppText>
          ) : null}
          {description ? (
            <AppText variant="bodySmall" tone={disabled ? 'disabled' : 'tertiary'}>
              {description}
            </AppText>
          ) : null}
        </View>
      ) : null}
    </TactilePressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    minHeight: sizes.touchTarget,
  },
  textColumn: {
    flex: 1,
  },
});
