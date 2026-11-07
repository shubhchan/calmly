import React from 'react';
import { StyleProp, View, ViewStyle, StyleSheet, Platform, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme/ThemeContext';
import { borderWidths, spacing } from '../../theme/tokens';
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
  const insets = useSafeAreaInsets();
  const topPad = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0, spacing[3]);

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
        { paddingTop: topPad },
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
        style={styles.backChip}
      >
        <Ionicons name="chevron-back" size={22} color={colors.text.secondary} />
      </TactilePressable>

      {center ?? (
        <View style={styles.titleCol}>
          {title ? (
            <AppText variant="h3" numberOfLines={1} style={styles.titleText}>
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
    gap: spacing[2],
    paddingHorizontal: spacing[5],
    paddingTop: spacing[2],
    paddingBottom: spacing[2],
    minHeight: 52,
  },
  backChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  titleCol: {
    flex: 1,
    justifyContent: 'center',
  },
  titleText: {
    paddingBottom: 3,
  },
  subtitle: {
    marginTop: 2,
    paddingBottom: 1,
  },
  rightSpacer: {
    width: 40,
  },
});
