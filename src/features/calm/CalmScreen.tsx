import React from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types/navigation';
import { useAppTheme } from '../../theme/ThemeContext';
import { AppText, TactilePressable } from '../../components';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { useResponsive } from '../../theme/responsive';
import {
  BreathworkIllustration,
  NatureSoundscapeIllustration,
  RestSanctuaryIllustration,
  SensoryGroundingIllustration,
} from '../../components/illustrations';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * Calm — four rooms, nothing else.
 *
 * Each room is one destination with one illustration. Anything rarer than
 * these four is reachable through Today search, so the hub stays quiet.
 */
export function CalmScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDark } = useAppTheme();
  const { isWide, pagePadding } = useResponsive();

  const rooms = [
    {
      key: 'breathe',
      title: 'Breathe',
      note: 'Let one breath lead the next.',
      time: '3–6 min',
      illustration: <BreathworkIllustration width={isWide ? 190 : 134} height={isWide ? 171 : 121} />,
      onPress: () => navigation.navigate('BreathingSession', { preset: 'box', duration: 180 }),
    },
    {
      key: 'ground',
      title: 'Ground',
      note: 'Come back through your senses.',
      time: '3 min',
      illustration: <SensoryGroundingIllustration width={isWide ? 190 : 134} height={isWide ? 171 : 121} />,
      onPress: () => navigation.navigate('SensoryGrounding'),
    },
    {
      key: 'rest',
      title: 'Rest',
      note: 'Slow down, head to feet.',
      time: '8 min',
      illustration: <RestSanctuaryIllustration width={isWide ? 190 : 134} height={isWide ? 171 : 121} />,
      onPress: () => navigation.navigate('BodyScan'),
    },
    {
      key: 'sounds',
      title: 'Sounds',
      note: 'Rain, pine, a slow shore.',
      time: 'Endless',
      illustration: <NatureSoundscapeIllustration width={isWide ? 190 : 134} height={isWide ? 171 : 121} />,
      onPress: () => navigation.navigate('Soundscapes'),
    },
  ];

  return (
    <ScreenContainer
      contentContainerStyle={{
        paddingHorizontal: pagePadding,
        paddingTop: isWide ? 40 : 20,
        paddingBottom: 120,
      }}
      backgroundColor={colors.background.default}
    >
      <View>
        <AppText variant="overline" tone="tertiary">
          Calm
        </AppText>
        <AppText variant="display" style={{ fontSize: isWide ? 48 : 32, lineHeight: isWide ? 58 : 44, marginTop: 4 }}>
          Four rooms
        </AppText>
        <AppText variant="bodySmall" tone="secondary" style={{ marginTop: 6 }}>
          Pick the one your body is asking for.
        </AppText>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: isWide ? 18 : 12, marginTop: isWide ? 34 : 22 }}>
        {rooms.map((room) => (
          <TactilePressable
            key={room.key}
            onPress={room.onPress}
            scaleDownTo={0.99}
            accessibilityRole="button"
            accessibilityLabel={`Open ${room.title}`}
            style={{
              width: isWide ? '23%' : '48%',
              flexGrow: 1,
              minHeight: isWide ? 380 : 240,
              padding: isWide ? 20 : 14,
              borderRadius: 22,
              backgroundColor: colors.surface.default,
              justifyContent: 'space-between',
            }}
          >
            <View
              style={{
                height: isWide ? 214 : 132,
                borderRadius: 16,
                backgroundColor: isDark ? colors.surface.muted : colors.background.secondary,
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {room.illustration}
            </View>

            <View style={{ marginTop: isWide ? 16 : 12 }}>
              <AppText variant="h3" style={{ fontSize: isWide ? 28 : 21, lineHeight: isWide ? 36 : 27 }}>
                {room.title}
              </AppText>
              <AppText variant="caption" tone="secondary" style={{ marginTop: 3 }} numberOfLines={2}>
                {room.note}
              </AppText>
            </View>

            {isWide ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
                <AppText variant="caption" tone="tertiary">
                  {room.time}
                </AppText>
                <AppText variant="label" tone="link">
                  Open
                </AppText>
              </View>
            ) : null}
          </TactilePressable>
        ))}
      </View>

      {/* Zen Playground Door */}
      <TactilePressable
        onPress={() => navigation.navigate('ZenPlayground')}
        scaleDownTo={0.99}
        accessibilityRole="button"
        accessibilityLabel="Open Zen Playground"
        style={{
          marginTop: 20,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          paddingVertical: 14,
          paddingHorizontal: 16,
          borderRadius: 20,
          backgroundColor: colors.surface.default,
          borderWidth: 1,
          borderColor: colors.border.subtle,
        }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            backgroundColor: isDark ? 'rgba(74, 107, 93, 0.22)' : 'rgba(44, 79, 69, 0.08)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="sparkles-outline" size={22} color={colors.primary.default} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <AppText variant="h3" style={{ fontSize: 16, lineHeight: 22 }}>
              Playground
            </AppText>
            <View
              style={{
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 6,
                backgroundColor: colors.surface.muted,
              }}
            >
              <AppText
                variant="caption"
                tone="tertiary"
                style={{ fontSize: 10, fontWeight: '600', letterSpacing: 0.4, textTransform: 'uppercase' }}
              >
                Zen
              </AppText>
            </View>
          </View>
          <AppText variant="caption" tone="secondary" style={{ marginTop: 2 }}>
            Sand garden, bubble pop & breathing companion.
          </AppText>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
      </TactilePressable>

      <TactilePressable
        onPress={() => navigation.navigate('PanicAnchor')}
        scaleDownTo={0.99}
        accessibilityRole="button"
        accessibilityLabel="Open a one minute reset"
        style={{
          marginTop: 26,
          marginBottom: 20,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingVertical: 14,
          paddingHorizontal: 16,
          borderRadius: 16,
          backgroundColor: colors.status.warning.subtle,
        }}
      >
        <Ionicons name="flash-outline" size={18} color={colors.status.warning.default} />
        <View style={{ flex: 1 }}>
          <AppText variant="label" tone="warning">
            If it is too much right now
          </AppText>
          <AppText variant="caption" tone="secondary" style={{ marginTop: 2 }}>
            A one-minute reset. No explanation needed.
          </AppText>
        </View>
        <Ionicons name="arrow-forward" size={16} color={colors.status.warning.default} />
      </TactilePressable>
    </ScreenContainer>
  );
}
