import React from 'react';
import { StyleProp, View, ViewStyle, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../../theme/ThemeContext';
import { borderWidths, iconButtonSizes, radius, spacing } from '../../theme/tokens';
import { AppIcon } from '../AppIcon';
import { TactilePressable } from '../interactive/TactilePressable';
import { AppText } from './AppText';

export interface ScreenHeaderProps {
  title?: string;
  subtitle?: string;
  /** Defaults to `navigation.goBack()` when omitted. */
  onBack?: () => void;
  /** Replaces the title column — use for timers, progress rings, step counters. */
  center?: React.ReactNode;
  /** Trailing control (icon button, action). A spacer keeps alignment when omitted. */
  right?: React.ReactNode;
  /** Hairline bottom border, for screens whose content scrolls under the header. */
  bordered?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * The single canonical header for stack screens: spring-pressable back chip,
 * title + optional subtitle, optional trailing control. Every secondary screen
 * uses this so headers read as one system instead of 24 hand-rolled copies.
 */
export function ScreenHeader({
  title,
  subtitle,
  onBack,
  center,
  right,
  bordered = false,
  style,
}: ScreenHeaderProps) {
  const { colors } = useAppTheme();
  const navigation = useNavigation<any>();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    navigation?.goBack?.();
  };

  return (
    <View
      style={[
        styles.row,
        bordered && {
          borderBottomWidth: borderWidths.thin,
          borderBottomColor: colors.border.default,
        },
        style,
      ]}
    >
      <TactilePressable
        onPress={handleBack}
        scaleDownTo={0.92}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        style={[
          styles.backChip,
          {
            backgroundColor: colors.surface.default,
            borderColor: colors.border.default,
          },
        ]}
      >
        <AppIcon name="i-arrow-back" size={20} color={colors.text.primary} />
      </TactilePressable>

      {center ?? (
        <View style={styles.titleCol}>
          {title ? (
            <AppText variant="h3" numberOfLines={1}>
              {title}
            </AppText>
          ) : null}
          {subtitle ? (
            <AppText variant="caption" tone="tertiary" numberOfLines={1} style={styles.subtitle}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
      )}

      {right ?? <View style={styles.rightSpacer} />}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[5],
    paddingTop: spacing[3],
    paddingBottom: spacing[3],
  },
  backChip: {
    width: iconButtonSizes.md,
    height: iconButtonSizes.md,
    borderRadius: radius.full,
    borderWidth: borderWidths.thin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleCol: {
    flex: 1,
  },
  subtitle: {
    marginTop: spacing[1],
  },
  rightSpacer: {
    width: iconButtonSizes.md,
  },
});
