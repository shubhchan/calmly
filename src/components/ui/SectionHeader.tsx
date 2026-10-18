import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { useAppTheme } from '../../theme/ThemeContext';
import { pressScale, sizes, spacing } from '../../theme/tokens';
import { TactilePressable } from '../interactive/TactilePressable';
import { AppText } from './AppText';

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Screen-section title with optional subtitle and a right-aligned text action. */
export function SectionHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
  style,
  testID,
}: SectionHeaderProps) {
  const theme = useAppTheme();
  const c = theme.colors;

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing[3],
        },
        style,
      ]}
      testID={testID}
    >
      <View style={{ flex: 1 }}>
        <AppText variant="title">{title}</AppText>
        {subtitle ? (
          <AppText variant="bodySmall" tone="tertiary" style={{ marginTop: spacing[1] }}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {actionLabel ? (
        <TactilePressable
          onPress={onAction}
          disabled={!onAction}
          hapticStyle={onAction ? 'light' : 'none'}
          scaleDownTo={pressScale.chip}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          accessibilityState={{ disabled: !onAction }}
          hitSlop={sizes.hitSlop}
        >
          <AppText variant="label" color={c.primary.default}>
            {actionLabel}
          </AppText>
        </TactilePressable>
      ) : null}
    </View>
  );
}
