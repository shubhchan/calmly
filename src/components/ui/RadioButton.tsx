import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useAppTheme } from '../../theme/ThemeContext';
import { borderWidths, pressScale, radius, sizes, spacing } from '../../theme/tokens';
import { TactilePressable } from '../interactive/TactilePressable';
import { AppText } from './AppText';

export type RadioSize = 'sm' | 'md';
export type RadioDirection = 'vertical' | 'horizontal';

export interface RadioButtonProps {
  selected: boolean;
  onSelect: () => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: RadioSize;
  style?: StyleProp<ViewStyle>;
}

export interface RadioGroupOption {
  value: string;
  label: string;
  description?: string;
}

export interface RadioGroupProps {
  options: RadioGroupOption[];
  value: string;
  onChange: (value: string) => void;
  direction?: RadioDirection;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const circleSizes: Record<RadioSize, number> = { sm: 20, md: 24 };
const dotSizes: Record<RadioSize, number> = { sm: 8, md: 10 };

/**
 * Accessible radio row: outer ring, inner dot, optional label/description
 * and tactile press feedback, mirroring the Checkbox row pattern.
 */
export function RadioButton({
  selected,
  onSelect,
  label,
  description,
  disabled = false,
  size = 'md',
  style,
}: RadioButtonProps) {
  const theme = useAppTheme();
  const c = theme.colors;
  const dimension = circleSizes[size];

  const ringColor = disabled ? c.disabled.border : selected ? c.primary.default : c.border.strong;
  const dotColor = disabled ? c.disabled.foreground : c.primary.default;

  return (
    <TactilePressable
      onPress={onSelect}
      disabled={disabled}
      hapticStyle={disabled ? 'none' : 'selection'}
      scaleDownTo={pressScale.card}
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={label ?? 'Option'}
      style={[styles.row, style]}
    >
      <View
        style={{
          width: dimension,
          height: dimension,
          borderRadius: radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: selected ? borderWidths.thick : borderWidths.medium,
          borderColor: ringColor,
          backgroundColor: disabled && selected ? c.disabled.background : 'transparent',
        }}
      >
        {selected ? (
          <View
            style={{
              width: dotSizes[size],
              height: dotSizes[size],
              borderRadius: radius.full,
              backgroundColor: dotColor,
            }}
          />
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

/**
 * Group wrapper rendering a set of RadioButtons with a single selected value
 * and radiogroup semantics for screen readers.
 */
export function RadioGroup({
  options,
  value,
  onChange,
  direction = 'vertical',
  style,
  testID,
}: RadioGroupProps) {
  return (
    <View
      accessibilityRole="radiogroup"
      testID={testID}
      style={[direction === 'horizontal' ? styles.groupHorizontal : styles.groupVertical, style]}
    >
      {options.map((option) => (
        <RadioButton
          key={option.value}
          selected={option.value === value}
          onSelect={() => onChange(option.value)}
          label={option.label}
          description={option.description}
        />
      ))}
    </View>
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
  groupVertical: {
    gap: spacing[3],
  },
  groupHorizontal: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[4],
  },
});
