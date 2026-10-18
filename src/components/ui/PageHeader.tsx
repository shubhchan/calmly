import React from 'react';
import { StyleProp, View, ViewStyle, StyleSheet } from 'react-native';
import { spacing } from '../../theme/tokens';
import { AppText } from './AppText';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Trailing control (filter toggle, add button, badge) aligned with the title block. */
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * The canonical title block for tab / root pages: one `h1` in the active font
 * everywhere, calm subtitle, optional trailing control. Keeps "Good evening",
 * "My Journal", "Settings"… reading as one system.
 */
export function PageHeader({ title, subtitle, right, style }: PageHeaderProps) {
  return (
    <View style={[styles.row, style]}>
      <View style={styles.titleCol}>
        <AppText variant="h1">{title}</AppText>
        {subtitle ? (
          <AppText variant="bodySmall" tone="tertiary" style={styles.subtitle}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  titleCol: {
    flex: 1,
  },
  subtitle: {
    marginTop: spacing[1],
  },
});
