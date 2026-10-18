import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useAppTheme } from '../../theme/ThemeContext';
import { dividerThickness, spacing, type SpacingToken } from '../../theme/tokens';
import { AppText } from './AppText';

export type DividerOrientation = 'horizontal' | 'vertical';

export interface DividerProps {
  orientation?: DividerOrientation;
  spacingToken?: SpacingToken;
  label?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Decorative hairline separator in either orientation, with an optional
 * centered caption for labelled section breaks.
 */
export function Divider({
  orientation = 'horizontal',
  spacingToken = 0,
  label,
  style,
}: DividerProps) {
  const theme = useAppTheme();
  const c = theme.colors;
  const margin =
    orientation === 'horizontal'
      ? { marginVertical: spacing[spacingToken] }
      : { marginHorizontal: spacing[spacingToken] };

  if (orientation === 'vertical') {
    return (
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[styles.vertical, { backgroundColor: c.border.subtle }, margin, style]}
      />
    );
  }

  if (label) {
    return (
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[styles.labelRow, margin, style]}
      >
        <View style={[styles.line, { backgroundColor: c.border.subtle }]} />
        <AppText variant="caption" tone="tertiary">
          {label}
        </AppText>
        <View style={[styles.line, { backgroundColor: c.border.subtle }]} />
      </View>
    );
  }

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.horizontal, { backgroundColor: c.border.subtle }, margin, style]}
    />
  );
}

const styles = StyleSheet.create({
  horizontal: {
    height: dividerThickness,
  },
  vertical: {
    width: dividerThickness,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  line: {
    flex: 1,
    height: dividerThickness,
  },
});
