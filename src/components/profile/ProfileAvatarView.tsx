import React from 'react';
import { Image, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme/ThemeContext';
import type { ProfileAvatar } from '../../types/profile';
import { mascotById, ZenMascotAvatar } from './ZenMascotAvatar';

export interface ProfileAvatarViewProps {
  avatar?: ProfileAvatar | null;
  googlePhotoUrl?: string | null;
  size?: number;
  borderRadius?: number;
  showGuestBadge?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function ProfileAvatarView({
  avatar,
  googlePhotoUrl,
  size = 44,
  borderRadius,
  showGuestBadge = false,
  style,
}: ProfileAvatarViewProps) {
  const { colors } = useAppTheme();
  const radius = borderRadius ?? Math.round(size * 0.33);
  const customUri = avatar?.kind === 'custom' ? avatar.uri : undefined;
  const googleUri = avatar?.kind === 'google' ? googlePhotoUrl : undefined;
  const photoUri = customUri || googleUri;
  const mascotId = avatar?.kind === 'mascot' ? avatar.mascotId : 'lotus';
  const mascot = mascotById(mascotId);

  return (
    <View style={[{ width: size, height: size }, style]}>
      <View
        style={[
          styles.frame,
          {
            width: size,
            height: size,
            borderRadius: radius,
            borderColor: colors.border.default,
            backgroundColor: photoUri ? colors.primary.subtle : mascot.background,
          },
        ]}
      >
        {photoUri ? (
          <Image
            source={{ uri: photoUri }}
            style={[styles.image, { borderRadius: radius }]}
            accessibilityRole="image"
            accessibilityLabel="Profile photo"
          />
        ) : (
          <ZenMascotAvatar id={mascotId} size={size} shape="square" borderRadius={radius} />
        )}
      </View>
      {showGuestBadge ? (
        <View
          style={[
            styles.badge,
            {
              backgroundColor: colors.primary.default,
              borderColor: colors.background.default,
              width: Math.max(16, size * 0.34),
              height: Math.max(16, size * 0.34),
              borderRadius: Math.max(8, size * 0.17),
            },
          ]}
        >
          <Ionicons name="person-add" size={Math.max(9, size * 0.18)} color={colors.primary.foreground} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
