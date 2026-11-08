import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle } from 'react-native-svg';
import { RootStackParamList, BreathingPreset } from '../../types/navigation';
import { useAppTheme } from '../../theme/ThemeContext';
import { AppText, TactilePressable } from '../../components';
import { soundService } from '../../services/soundService';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { spacing } from '../../theme/tokens';
import { withAlpha } from '../../theme/tokens/colors';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface QuickSound {
  id: 'rain' | 'ocean' | 'birds' | 'night';
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  atmosphere: string;
}

const SOUNDS: QuickSound[] = [
  { id: 'rain', label: 'Rain', icon: 'rainy-outline', atmosphere: 'Soft drizzle' },
  { id: 'ocean', label: 'Shore', icon: 'water-outline', atmosphere: 'Slow tide' },
  { id: 'birds', label: 'Pines', icon: 'leaf-outline', atmosphere: 'Morning woods' },
  { id: 'night', label: 'Night', icon: 'moon-outline', atmosphere: 'Quiet air' },
];

const PRACTICES = ['Breathe', 'Body scan', 'Senses', 'Soundscapes'] as const;

const PRACTICE_LIST: {
  title: string;
  note: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  route: string;
}[] = [
  { title: 'Body scan', note: 'Release tension, head to feet', icon: 'body-outline', route: 'BodyScan' },
  { title: 'Sensory grounding', note: 'Five senses, one at a time', icon: 'hand-left-outline', route: 'SensoryGrounding' },
  { title: 'Breathwork studio', note: 'Choose your own cadence', icon: 'pulse-outline', route: 'BreathworkStudio' },
  { title: 'Playground', note: 'Bubbles, sand, a small companion', icon: 'ellipse-outline', route: 'ZenPlayground' },
  { title: 'Affirmations', note: 'Words to keep close', icon: 'sparkles-outline', route: 'Affirmations' },
  { title: 'Thought reframing', note: 'Meet a hard thought gently', icon: 'swap-horizontal-outline', route: 'ThoughtReframing' },
  { title: 'Sphere of control', note: 'Sort what is yours to carry', icon: 'aperture-outline', route: 'WhatCanIControl' },
];

export function CalmScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDark } = useAppTheme();
  const [activeSound, setActiveSound] = useState<string | null>(null);
  const [practice, setPractice] = useState<string>('Breathe');

  useEffect(() => {
    const unsub = soundService.addListener((state) => {
      setActiveSound(state.activeTrack);
    });
    return unsub;
  }, []);

  const handleToggleSound = async (soundId: 'rain' | 'ocean' | 'birds' | 'night') => {
    if (activeSound === soundId) {
      await soundService.stop();
    } else {
      await soundService.play(soundId);
    }
  };

  const startPractice = () => {
    if (practice === 'Body scan') navigation.navigate('BodyScan');
    else if (practice === 'Senses') navigation.navigate('SensoryGrounding');
    else if (practice === 'Soundscapes') navigation.navigate('Soundscapes');
    else navigation.navigate('BreathingSession', { preset: 'box', duration: 180 });
  };

  return (
    <ScreenContainer
      contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 120 }}
      backgroundColor={colors.background.default}
    >
      {/* Header — Still Water v2 */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <AppText variant="overline" tone="tertiary">
            Calm
          </AppText>
          <AppText variant="display" style={{ fontSize: 32, lineHeight: 44, paddingBottom: 4, marginTop: 4 }}>
            Four rooms
          </AppText>
          <AppText variant="bodySmall" tone="secondary" style={{ marginTop: 6 }}>
            Pick the one your body is asking for.
          </AppText>
        </View>
        <TactilePressable
          onPress={() => navigation.navigate('Soundscapes')}
          scaleDownTo={0.92}
          accessibilityRole="button"
          accessibilityLabel="Open soundscapes"
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: activeSound ? colors.surface.selected : colors.surface.default,
          }}
        >
          <Ionicons
            name={activeSound ? 'volume-medium' : 'headset-outline'}
            size={20}
            color={activeSound ? colors.primary.default : colors.text.secondary}
          />
        </TactilePressable>
      </View>

      {/* Continue Card — Still Water hero */}
      <TactilePressable
        onPress={() => navigation.navigate('BodyScan')}
        scaleDownTo={0.99}
        accessibilityRole="button"
        accessibilityLabel="Continue body scan practice"
        style={{
          marginTop: 22,
          backgroundColor: isDark ? colors.primary.subtle : colors.primary.default,
          borderWidth: isDark ? 1 : 0,
          borderColor: isDark ? colors.primary.subtleBorder : 'transparent',
          borderRadius: 22,
          padding: 18,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          overflow: 'hidden',
        }}
      >
        <View style={{ flex: 1 }}>
          <AppText variant="overline" color={isDark ? colors.primary.default : '#A9CBBC'} style={{ letterSpacing: 1.2 }}>
            Continue
          </AppText>
          <AppText variant="display" color={isDark ? colors.text.primary : '#EDF3EF'} style={{ fontSize: 22, lineHeight: 30, paddingBottom: 2, marginTop: 4 }}>
            Evening wind-down
          </AppText>
          <AppText variant="caption" color={isDark ? colors.text.secondary : '#C6DCD1'} style={{ marginTop: 4 }}>
            {activeSound ? `Soundscape · ${activeSound}` : 'Body scan · 3 of 8 min'}
          </AppText>
          <View style={{ height: 4, borderRadius: 2, backgroundColor: isDark ? colors.border.default : 'rgba(198,220,209,0.25)', marginTop: 12, width: 120, overflow: 'hidden' }}>
            <View style={{ width: '42%', height: '100%', backgroundColor: '#D2B078', borderRadius: 2 }} />
          </View>
        </View>
        <View
          style={{
            width: 54,
            height: 54,
            borderRadius: 27,
            backgroundColor: isDark ? colors.primary.default : '#EDF3EF',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" fill={isDark ? colors.primary.foreground : '#223E36'}>
            <Path d="M8 5l12 7-12 7z" />
          </Svg>
        </View>
      </TactilePressable>

      {/* Four Rooms Grid — Still Water v2 */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16 }}>
        {/* Room 1: Breathe */}
        <TactilePressable
          onPress={() => navigation.navigate('BreathingSession', { preset: 'box', duration: 180 })}
          scaleDownTo={0.98}
          accessibilityRole="button"
          accessibilityLabel="Open Breathe room"
          style={{
            width: '48%',
            flexGrow: 1,
            backgroundColor: colors.surface.selected,
            borderRadius: 18,
            padding: 16,
            minHeight: 128,
            justifyContent: 'space-between',
          }}
        >
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 11,
              backgroundColor: colors.surface.default,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke={colors.primary.default} strokeWidth="1.8" strokeLinecap="round">
              <Path d="M12 3c3.5 3 6 6 6 9a6 6 0 01-12 0c0-3 2.5-6 6-9z" />
            </Svg>
          </View>
          <View style={{ marginTop: 20 }}>
            <AppText variant="title" style={{ fontWeight: '600', color: colors.primary.default }}>
              Breathe
            </AppText>
            <AppText variant="caption" tone="secondary" style={{ marginTop: 2 }}>
              Paced &amp; box
            </AppText>
          </View>
        </TactilePressable>

        {/* Room 2: Ground */}
        <TactilePressable
          onPress={() => navigation.navigate('SensoryGrounding')}
          scaleDownTo={0.98}
          accessibilityRole="button"
          accessibilityLabel="Open Ground room"
          style={{
            width: '48%',
            flexGrow: 1,
            backgroundColor: colors.surface.default,
            borderRadius: 18,
            padding: 16,
            minHeight: 128,
            justifyContent: 'space-between',
          }}
        >
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 11,
              backgroundColor: colors.surface.muted,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke={colors.primary.default} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <Path d="M20 4C10.5 4 4 10.5 4 20c9.5 0 16-6.5 16-16z" />
              <Path d="M8 16c2.5-4 5.5-6.5 9-8" />
            </Svg>
          </View>
          <View style={{ marginTop: 20 }}>
            <AppText variant="title" style={{ fontWeight: '600' }}>
              Ground
            </AppText>
            <AppText variant="caption" tone="tertiary" style={{ marginTop: 2 }}>
              5 senses · 3 min
            </AppText>
          </View>
        </TactilePressable>

        {/* Room 3: Sleep */}
        <TactilePressable
          onPress={() => navigation.navigate('BodyScan')}
          scaleDownTo={0.98}
          accessibilityRole="button"
          accessibilityLabel="Open Sleep room"
          style={{
            width: '48%',
            flexGrow: 1,
            backgroundColor: colors.surface.default,
            borderRadius: 18,
            padding: 16,
            minHeight: 128,
            justifyContent: 'space-between',
          }}
        >
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 11,
              backgroundColor: isDark ? 'rgba(176,138,79,0.2)' : '#F0E7D6',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke={isDark ? '#D2B078' : '#B08A4F'} strokeWidth="1.8" strokeLinecap="round">
              <Path d="M20 14.5A8.5 8.5 0 019.5 4 8.5 8.5 0 1020 14.5z" />
            </Svg>
          </View>
          <View style={{ marginTop: 20 }}>
            <AppText variant="title" style={{ fontWeight: '600' }}>
              Sleep
            </AppText>
            <AppText variant="caption" tone="tertiary" style={{ marginTop: 2 }}>
              Wind-down stories
            </AppText>
          </View>
        </TactilePressable>

        {/* Room 4: Sounds */}
        <TactilePressable
          onPress={() => navigation.navigate('Soundscapes')}
          scaleDownTo={0.98}
          accessibilityRole="button"
          accessibilityLabel="Open Sounds room"
          style={{
            width: '48%',
            flexGrow: 1,
            backgroundColor: colors.surface.default,
            borderRadius: 18,
            padding: 16,
            minHeight: 128,
            justifyContent: 'space-between',
          }}
        >
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 11,
              backgroundColor: colors.surface.muted,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke={colors.primary.default} strokeWidth="1.8" strokeLinecap="round">
              <Path d="M4 15c2-2 4-2 6 0s4 2 6 0 4-2 4 0M4 9c2-2 4-2 6 0s4 2 6 0 4-2 4 0" />
            </Svg>
          </View>
          <View style={{ marginTop: 20 }}>
            <AppText variant="title" style={{ fontWeight: '600' }}>
              Sounds
            </AppText>
            <AppText variant="caption" tone="tertiary" style={{ marginTop: 2 }}>
              Rain, forest, room
            </AppText>
          </View>
        </TactilePressable>
      </View>

      {/* Only three minutes? Quick banner */}
      <TactilePressable
        onPress={() => navigation.navigate('BreathingSession', { preset: '4-7-8', duration: 180 })}
        scaleDownTo={0.99}
        accessibilityRole="button"
        accessibilityLabel="Start 3 minute 4-7-8 breath"
        style={{
          marginTop: 18,
          padding: 16,
          borderRadius: 16,
          backgroundColor: colors.surface.default,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke={colors.primary.default} strokeWidth="1.8" strokeLinecap="round">
          <Circle cx="12" cy="12" r="9" />
          <Path d="M12 7v5l3 2" />
        </Svg>
        <View style={{ flex: 1 }}>
          <AppText variant="label" tone="primary" style={{ fontWeight: '600' }}>
            Only three minutes?
          </AppText>
          <AppText variant="caption" tone="secondary" style={{ marginTop: 1 }}>
            Try 4-7-8 breathing, no timer.
          </AppText>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
      </TactilePressable>

      {/* Sounds */}
      <View style={{ marginTop: 40 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
          <AppText variant="h3">Rooms of sound</AppText>
          <TactilePressable scaleDownTo={0.95} onPress={() => navigation.navigate('Soundscapes')}>
            <AppText variant="label" tone="link">
              Mixer
            </AppText>
          </TactilePressable>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {SOUNDS.map((snd) => {
            const playing = activeSound === snd.id;
            return (
              <TactilePressable
                key={snd.id}
                onPress={() => handleToggleSound(snd.id)}
                scaleDownTo={0.97}
                accessibilityRole="button"
                accessibilityLabel={`${snd.label}, ${playing ? 'playing' : 'play'}`}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  paddingHorizontal: 8,
                  borderRadius: 16,
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: playing ? colors.surface.selected : colors.surface.default,
                }}
              >
                <Ionicons
                  name={playing ? 'pause' : snd.icon}
                  size={19}
                  color={playing ? colors.primary.default : colors.text.secondary}
                />
                <AppText variant="label" tone={playing ? 'link' : 'secondary'}>
                  {snd.label}
                </AppText>
              </TactilePressable>
            );
          })}
        </View>
      </View>

      {/* More practices */}
      <View style={{ marginTop: 40 }}>
        <AppText variant="h3" style={{ marginBottom: 8 }}>
          More ways to settle
        </AppText>
        {PRACTICE_LIST.map((item) => (
          <TactilePressable
            key={item.title}
            onPress={() => navigation.navigate(item.route as any)}
            scaleDownTo={0.99}
            accessibilityRole="button"
            accessibilityLabel={`Open ${item.title}`}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              paddingVertical: 15,
              borderBottomWidth: 1,
              borderBottomColor: colors.border.default,
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.surface.selected,
              }}
            >
              <Ionicons name={item.icon} size={18} color={colors.primary.default} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="title">{item.title}</AppText>
              <AppText variant="caption" tone="tertiary" style={{ marginTop: 1 }}>
                {item.note}
              </AppText>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
          </TactilePressable>
        ))}
      </View>

      {/* Emergency */}
      <TactilePressable
        onPress={() => navigation.navigate('PanicAnchor')}
        scaleDownTo={0.99}
        accessibilityRole="button"
        accessibilityLabel="Open acute panic relief"
        style={{
          marginTop: 32,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          padding: 16,
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
            A short, physical reset. No explanation needed.
          </AppText>
        </View>
        <Ionicons name="arrow-forward" size={16} color={colors.status.warning.default} />
      </TactilePressable>

      <View style={{ height: spacing[6] }} />
    </ScreenContainer>
  );
}
