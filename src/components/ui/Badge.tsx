import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useAppTheme } from '../../theme/ThemeContext';
import { borderWidths, iconSizes, radius, spacing } from '../../theme/tokens';
import { AppIcon } from '../AppIcon';
import { AppText } from './AppText';

export type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'error' | 'info';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  size?: BadgeSize;
  iconName?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Non-interactive status pill: subtle semantic fills, optional leading icon
 * and fully token-driven colors in both themes.
 */
export function Badge({ label, tone = 'neutral', size = 'md', iconName, style }: BadgeProps) {
  const theme = useAppTheme();
  const c = theme.colors;

  let background = c.surface.muted;
  let borderColor = 'transparent';
  let ink = c.text.secondary;
  if (tone === 'primary') {
    background = c.primary.subtle;
    borderColor = c.primary.subtleBorder;
    ink = c.primary.default;
  } else if (tone !== 'neutral') {
    const status = c.status[tone];
    background = status.subtle;
    borderColor = status.border;
    ink = status.foreground;
  }

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={label}
      style={[
        styles.badge,
        {
          paddingHorizontal: size === 'sm' ? spacing[2] : spacing[3],
          backgroundColor: background,
          borderColor,
          borderWidth: tone === 'neutral' ? borderWidths.none : borderWidths.thin,
        },
        style,
      ]}
    >
      {iconName ? <AppIcon name={iconName} size={iconSizes.xs} color={ink} animated={false} /> : null}
      <AppText variant="labelSmall" color={ink} numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing[1],
    paddingVertical: spacing[1],
    borderRadius: radius.full,
  },
});
