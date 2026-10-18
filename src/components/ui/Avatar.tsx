import React from 'react';
import { Image, ImageSourcePropType, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useAppTheme } from '../../theme/ThemeContext';
import { avatarSizes, borderWidths, radius, type AvatarSize } from '../../theme/tokens';
import { resolveTint, type TintName } from '../../theme/tints';
import { AppIcon } from '../AppIcon';
import { AppText } from './AppText';

export interface AvatarProps {
  size?: AvatarSize;
  name?: string;
  iconName?: string;
  source?: ImageSourcePropType;
  tone?: TintName;
  style?: StyleProp<ViewStyle>;
}

const initialsFontSizes: Record<AvatarSize, number> = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  '2xl': 24,
};

function initialsFromName(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();
}

/**
 * Circular identity token — photo, tinted initials or an icon — sized from
 * the avatar scale and colored exclusively from theme tokens.
 */
export function Avatar({ size = 'md', name, iconName, source, tone, style }: AvatarProps) {
  const theme = useAppTheme();
  const c = theme.colors;
  const dimension = avatarSizes[size];
  const tint = tone ? resolveTint(theme.isDark, tone) : null;

  if (source) {
    return (
      <View
        accessibilityRole="image"
        accessibilityLabel={name ?? 'Avatar'}
        style={[styles.frame, { width: dimension, height: dimension }, style]}
      >
        <Image source={source} style={styles.image} />
      </View>
    );
  }

  const background = tint ? tint.bg : c.primary.subtle;
  const ink = tint ? tint.text : c.primary.default;
  const iconInk = tint ? tint.accent : c.primary.default;
  const initials = name ? initialsFromName(name) : '';
  const fontSize = initialsFontSizes[size];

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={name ?? 'Avatar'}
      style={[
        styles.circle,
        {
          width: dimension,
          height: dimension,
          backgroundColor: background,
          borderColor: c.border.default,
        },
        style,
      ]}
    >
      {iconName ? (
        <AppIcon name={iconName} size={Math.round(dimension * 0.5)} color={iconInk} animated={false} />
      ) : initials ? (
        <AppText variant="label" color={ink} style={{ fontSize, lineHeight: fontSize + 2 }}>
          {initials}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  circle: {
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: borderWidths.thin,
  },
});
