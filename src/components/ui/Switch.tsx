import React from 'react';
import { StyleProp, StyleSheet, Switch as RNSwitch, View, ViewStyle } from 'react-native';
import { useAppTheme } from '../../theme/ThemeContext';
import { sizes, spacing } from '../../theme/tokens';
import { AppText } from './AppText';

export interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Token-themed wrapper around the native Switch: label and description on
 * the left, control on the right, consistent track colors in both themes.
 */
export function Switch({
  value,
  onValueChange,
  label,
  description,
  disabled = false,
  style,
  testID,
}: SwitchProps) {
  const theme = useAppTheme();
  const c = theme.colors;

  const control = (
    <RNSwitch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{ false: c.border.strong, true: c.primary.default }}
      ios_backgroundColor={c.border.default}
      accessibilityLabel={label ?? 'Toggle'}
      accessibilityState={{ disabled }}
      testID={testID}
    />
  );

  if (!label && !description) {
    return <View style={style}>{control}</View>;
  }

  return (
    <View style={[styles.row, style]}>
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
      {control}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
    minHeight: sizes.touchTarget,
  },
  textColumn: {
    flex: 1,
  },
});
