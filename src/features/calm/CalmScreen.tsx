import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, BreathingPreset } from '../../types/navigation';
import { useThemeColors } from '../../theme/ThemeContext';
import {
  Card,
  CardContent,
  BreathworkIllustration,
  NatureSoundscapeIllustration,
  SensoryGroundingIllustration,
  BodyScanIllustration,
  PanicAnchorIllustration,
} from '../../components';
import { Ionicons } from '@expo/vector-icons';
import { soundService } from '../../services/soundService';
import { hapticFeedback } from '../../utils/haptics';
import { fontFamilies } from '../../theme/typography';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { PopIn } from '../../components/interactive/PopIn';
import { resolveTint } from '../../theme/tints';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface QuickSound {
  id: 'rain' | 'ocean' | 'birds' | 'night';
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  atmosphere: string;
}

const SOUNDS: QuickSound[] = [
  { id: 'rain', label: 'Rainfall', icon: 'rainy-outline', atmosphere: 'Soft drizzle' },
  { id: 'ocean', label: 'Ocean Waves', icon: 'water-outline', atmosphere: 'Deep tides' },
  { id: 'birds', label: 'Forest Birds', icon: 'leaf-outline', atmosphere: 'Morning woods' },
  { id: 'night', label: 'Night Breeze', icon: 'moon-outline', atmosphere: 'Quiet stream' },
];

const SOUND_ROWS: [QuickSound, QuickSound][] = [
  [SOUNDS[0], SOUNDS[1]],
  [SOUNDS[2], SOUNDS[3]],
];

interface QuickBreathwork {
  id: BreathingPreset;
  title: string;
  cadence: string;
  benefit: string;
  duration: number;
}

const BREATH_PRESETS: QuickBreathwork[] = [
  { id: 'box', title: 'Box Breathing', cadence: '4 · 4 · 4 · 4', benefit: 'Focus & steady pulse', duration: 180 },
  { id: '4-7-8', title: '4-7-8 Tranquil', cadence: '4 · 7 · 8', benefit: 'Deep calm & sleep aid', duration: 300 },
  { id: 'deep', title: 'Vagal Resonance', cadence: '5.5 · 5.5', benefit: 'Heart rate balance', duration: 300 },
];

export function CalmScreen() {
  const navigation = useNavigation<NavigationProp>();
  const colors = useThemeColors();
  const [activeSound, setActiveSound] = useState<string | null>(null);

  useEffect(() => {
    const unsub = soundService.addListener((state) => {
      setActiveSound(state.activeTrack);
    });
    return unsub;
  }, []);

  const handleToggleSound = async (soundId: 'rain' | 'ocean' | 'birds' | 'night') => {
    hapticFeedback.light();
    if (activeSound === soundId) {
      await soundService.stop();
    } else {
      await soundService.play(soundId);
    }
  };

  const handleStartBreathSession = (preset: BreathingPreset, duration: number) => {
    hapticFeedback.medium();
    navigation.navigate('BreathingSession', { preset, duration });
  };

  const skyTint = resolveTint(!!colors.isDark, 'sky');
  const coralTint = resolveTint(!!colors.isDark, 'coral');
  const creamTint = resolveTint(!!colors.isDark, 'cream');
  const sageTint = resolveTint(!!colors.isDark, 'sage');
  const blushTint = resolveTint(!!colors.isDark, 'blush');

  return (
    <ScreenContainer scroll={false} backgroundColor={colors.bgPrimary}>
      {/* Sanctuary Top Bar */}
      <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
        <View style={styles.headerTitleRow}>
          <View>
            <Text style={[styles.mainTitle, { color: colors.textPrimary }]}>Calm</Text>
            <Text style={[styles.mainSubtitle, { color: colors.textTertiary }]}>
              Tactile mindful tools & somatic rest
            </Text>
          </View>
          <Pressable
            onPress={() => navigation.navigate('Soundscapes')}
            style={({ pressed }) => [
              styles.soundStatusBadge,
              {
                backgroundColor: activeSound ? colors.accentBg : colors.bgCard,
                borderColor: activeSound ? colors.accentPrimary : colors.borderLight,
                transform: [{ scale: pressed ? 0.92 : 1 }],
                opacity: pressed ? 0.85 : 1,
              },
            ]}
            hitSlop={8}
          >
            <Ionicons
              name={activeSound ? 'volume-medium' : 'headset-outline'}
              size={18}
              color={activeSound ? colors.accentPrimary : colors.textTertiary}
            />
            {activeSound && <View style={[styles.pulseDot, { backgroundColor: colors.accentPrimary }]} />}
          </Pressable>
        </View>

        {/* Live Audio Mini-Player Bar (When Sound is Active) */}
        {activeSound && (
          <Pressable
            onPress={() => navigation.navigate('Soundscapes')}
            style={({ pressed }) => [
              styles.miniPlayerBar,
              {
                backgroundColor: colors.accentBg,
                borderColor: colors.accentBorder,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <Ionicons name="musical-notes" size={16} color={colors.accentPrimary} />
              <Text style={[styles.miniPlayerText, { color: colors.accentPrimary }]} numberOfLines={1}>
                Playing: {activeSound.toUpperCase()} Ambient Soundscape
              </Text>
            </View>
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                soundService.stop();
              }}
              style={({ pressed }) => [
                styles.miniPlayerStop,
                { transform: [{ scale: pressed ? 0.88 : 1 }] },
              ]}
              hitSlop={8}
            >
              <Ionicons name="pause" size={14} color={colors.accentPrimary} />
            </Pressable>
          </Pressable>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Nature Soundscapes Interactive Player Hub — sky pop card */}
        <PopIn index={0}>
        <Card variant="elevated" tone="sky" style={styles.sectionCard}>
          <CardContent style={styles.cardInner}>
            <View style={styles.cardHeaderRow}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <View style={[styles.badgePill, { backgroundColor: (colors.accentSky || '#6B9BCD') + '18' }]}>
                  <Text style={[styles.badgePillText, { color: colors.accentSky || '#6B9BCD' }]}>
                    Nature Soundscapes
                  </Text>
                </View>
                <Text style={[styles.sectionHeading, { color: skyTint.text }]}>
                  Ambient Sanctuary
                </Text>
                <Text style={[styles.sectionSub, { color: skyTint.muted }]}>
                  Tap any atmosphere for immediate calm
                </Text>
              </View>
              <NatureSoundscapeIllustration width={96} height={76} />
            </View>

            {/* Ambient Sound Grid (2x2 tactile cards) */}
            <View style={styles.soundGrid}>
              {SOUND_ROWS.map((row, rIdx) => (
                <View key={rIdx} style={styles.soundGridRow}>
                  {row.map((snd) => {
                    const isPlaying = activeSound === snd.id;
                    return (
                      <Pressable
                        key={snd.id}
                        onPress={() => handleToggleSound(snd.id)}
                        style={({ pressed }) => [
                          styles.soundTile,
                          {
                            backgroundColor: isPlaying
                              ? (colors.isDark ? '#163022' : '#EDF5EF')
                              : skyTint.plate,
                            borderColor: isPlaying ? colors.accentPrimary : skyTint.border,
                            transform: [{ scale: pressed ? 0.97 : 1 }],
                            opacity: pressed ? 0.92 : 1,
                          },
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={`${snd.label}, ${isPlaying ? 'playing' : snd.atmosphere}`}
                      >
                        <View style={styles.soundTileTop}>
                          <View
                            style={[
                              styles.soundTileOrb,
                              {
                                backgroundColor: isPlaying ? colors.accentPrimary : colors.bgCard,
                                borderColor: isPlaying ? colors.accentPrimary : skyTint.border,
                              },
                            ]}
                          >
                            <Ionicons
                              name={isPlaying ? 'pause' : snd.icon}
                              size={18}
                              color={isPlaying ? '#FFFFFF' : skyTint.accent}
                            />
                          </View>
                          {isPlaying && (
                            <View
                              style={[
                                styles.playingBadge,
                                {
                                  backgroundColor: (colors.accentPrimary || '#3E7B52') + '18',
                                  borderColor: colors.accentPrimary || '#3E7B52',
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.playingBadgeText,
                                  { color: colors.accentPrimary || '#3E7B52' },
                                ]}
                              >
                                Playing
                              </Text>
                            </View>
                          )}
                        </View>

                        <Text
                          style={[
                            styles.soundTileTitle,
                            { color: isPlaying ? colors.accentPrimary : skyTint.text },
                          ]}
                          numberOfLines={1}
                        >
                          {snd.label}
                        </Text>
                        <Text
                          style={[
                            styles.soundTileSub,
                            { color: isPlaying ? colors.accentPrimary : skyTint.muted },
                          ]}
                          numberOfLines={1}
                        >
                          {isPlaying ? 'Tap to pause' : snd.atmosphere}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>

            <Pressable
              onPress={() => navigation.navigate('Soundscapes')}
              style={({ pressed }) => [
                styles.fullPageLink,
                {
                  borderTopColor: skyTint.border,
                  opacity: pressed ? 0.75 : 1,
                  transform: [{ scale: pressed ? 0.99 : 1 }],
                },
              ]}
            >
              <Text style={[styles.fullPageLinkText, { color: skyTint.accent }]}>
                Full Soundscapes Player & Sleep Timer
              </Text>
              <Ionicons name="arrow-forward" size={15} color={skyTint.accent} />
            </Pressable>
          </CardContent>
        </Card>
        </PopIn>

        {/* 2. Interactive Breathwork Studio Hub — coral pop card */}
        <PopIn index={1}>
        <Card variant="elevated" tone="coral" style={styles.sectionCard}>
          <CardContent style={styles.cardInner}>
            <View style={styles.cardHeaderRow}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <View style={[styles.badgePill, { backgroundColor: (colors.accentPeach || '#D76949') + '20' }]}>
                  <Text style={[styles.badgePillText, { color: colors.accentPeach || '#D76949' }]}>
                    Breathwork Studio
                  </Text>
                </View>
                <Text style={[styles.sectionHeading, { color: coralTint.text }]}>
                  Paced Breathing
                </Text>
                <Text style={[styles.sectionSub, { color: coralTint.muted }]}>
                  Restore nervous system rhythm
                </Text>
              </View>
              <BreathworkIllustration width={96} height={76} />
            </View>

            {/* Direct Breathwork Presets */}
            <View style={styles.presetList}>
              {BREATH_PRESETS.map((preset) => (
                <View
                  key={preset.id}
                  style={[
                    styles.presetRow,
                    {
                      backgroundColor: coralTint.plate,
                      borderColor: coralTint.border,
                    },
                  ]}
                >
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[styles.presetTitle, { color: coralTint.text }]}>
                      {preset.title}
                    </Text>
                    <Text style={[styles.presetCadence, { color: coralTint.accent }]}>
                      {preset.cadence}
                    </Text>
                    <Text style={[styles.presetBenefit, { color: coralTint.muted }]}>
                      {preset.benefit}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => handleStartBreathSession(preset.id, preset.duration)}
                    style={({ pressed }) => [
                      styles.presetStartButton,
                      {
                        backgroundColor: coralTint.accent,
                        transform: [{ scale: pressed ? 0.94 : 1 }],
                        opacity: pressed ? 0.88 : 1,
                      },
                    ]}
                  >
                    <Ionicons name="play" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                    <Text style={styles.presetStartText}>Start</Text>
                  </Pressable>
                </View>
              ))}
            </View>

            <Pressable
              onPress={() => navigation.navigate('BreathworkStudio')}
              style={({ pressed }) => [
                styles.fullPageLink,
                {
                  borderTopColor: coralTint.border,
                  opacity: pressed ? 0.75 : 1,
                  transform: [{ scale: pressed ? 0.99 : 1 }],
                },
              ]}
            >
              <Text style={[styles.fullPageLinkText, { color: coralTint.accent }]}>
                Explore Custom Durations & Audio in Studio
              </Text>
              <Ionicons name="arrow-forward" size={15} color={coralTint.accent} />
            </Pressable>
          </CardContent>
        </Card>
        </PopIn>

        {/* 3. 5-4-3-2-1 Sensory Grounding Card — cream pop card */}
        <PopIn index={2}>
        <Card
          variant="elevated"
          tone="cream"
          style={styles.sectionCard}
          onPress={() => navigation.navigate('SensoryGrounding')}
        >
          <CardContent style={styles.cardInner}>
            <View style={styles.cardHeaderRow}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <View style={[styles.badgePill, { backgroundColor: (colors.accentPeach || '#EB876D') + '20' }]}>
                  <Text style={[styles.badgePillText, { color: colors.accentPeach || '#EB876D' }]}>
                    5 Senses Reset
                  </Text>
                </View>
                <Text style={[styles.sectionHeading, { color: creamTint.text }]}>
                  Sensory Grounding
                </Text>
                <Text style={[styles.sectionSub, { color: creamTint.muted }]} numberOfLines={2}>
                  Engage physical senses to interrupt cognitive spirals
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }}>
                  <Text style={[styles.fullPageLinkText, { color: creamTint.accent }]}>
                    Begin Grounding
                  </Text>
                  <Ionicons name="arrow-forward" size={14} color={creamTint.accent} />
                </View>
              </View>
              <SensoryGroundingIllustration width={96} height={76} />
            </View>
          </CardContent>
        </Card>
        </PopIn>

        {/* 4. Somatic Body Scan Card — sage pop card */}
        <PopIn index={3}>
        <Card
          variant="elevated"
          tone="sage"
          style={styles.sectionCard}
          onPress={() => navigation.navigate('BodyScan')}
        >
          <CardContent style={styles.cardInner}>
            <View style={styles.cardHeaderRow}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <View style={[styles.badgePill, { backgroundColor: colors.accentBg }]}>
                  <Text style={[styles.badgePillText, { color: colors.accentPrimary }]}>
                    Muscle Release
                  </Text>
                </View>
                <Text style={[styles.sectionHeading, { color: sageTint.text }]}>
                  Somatic Body Scan
                </Text>
                <Text style={[styles.sectionSub, { color: sageTint.muted }]} numberOfLines={2}>
                  Progressive tension release across 5 anatomy zones
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }}>
                  <Text style={[styles.fullPageLinkText, { color: sageTint.accent }]}>
                    Begin Body Scan
                  </Text>
                  <Ionicons name="arrow-forward" size={14} color={sageTint.accent} />
                </View>
              </View>
              <BodyScanIllustration width={96} height={76} />
            </View>
          </CardContent>
        </Card>
        </PopIn>

        {/* 5. Emergency SOS Acute Panic Anchor Card — blush pop card */}
        <PopIn index={4}>
        <Card
          variant="elevated"
          tone="blush"
          style={styles.sectionCard}
          onPress={() => navigation.navigate('PanicAnchor')}
        >
          <CardContent style={styles.cardInner}>
            <View style={styles.cardHeaderRow}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <View style={[styles.badgePill, { backgroundColor: (colors.accentRose || '#EB697F') + '20' }]}>
                  <Text style={[styles.badgePillText, { color: colors.accentRose || '#EB697F' }]}>
                    Emergency SOS
                  </Text>
                </View>
                <Text style={[styles.sectionHeading, { color: blushTint.text }]}>
                  Acute Panic Anchor
                </Text>
                <Text style={[styles.sectionSub, { color: blushTint.muted }]} numberOfLines={2}>
                  Physiological sigh & cold water reflex for rapid de-escalation
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }}>
                  <Text style={[styles.fullPageLinkText, { color: blushTint.accent }]}>
                    Open SOS Relief
                  </Text>
                  <Ionicons name="arrow-forward" size={14} color={blushTint.accent} />
                </View>
              </View>
              <PanicAnchorIllustration width={96} height={76} />
            </View>
          </CardContent>
        </Card>
        </PopIn>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mainTitle: {
    fontFamily: fontFamilies.calming.bold,
    fontSize: 32,
    letterSpacing: 0.2,
  },
  mainSubtitle: {
    fontFamily: fontFamilies.sans.medium,
    fontSize: 13,
    marginTop: 2,
  },
  soundStatusBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pulseDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  miniPlayerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
  },
  miniPlayerText: {
    fontFamily: fontFamilies.sans.bold,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  miniPlayerStop: {
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 110,
    gap: 16,
  },
  sectionCard: {
    borderRadius: 22,
  },
  cardInner: {
    padding: 18,
    gap: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: 9999,
    marginBottom: 6,
  },
  badgePillText: {
    fontFamily: fontFamilies.sans.bold,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  sectionHeading: {
    fontFamily: fontFamilies.calming.bold,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: 0.1,
  },
  sectionSub: {
    fontFamily: fontFamilies.sans.regular,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  soundGrid: {
    gap: 10,
  },
  soundGridRow: {
    flexDirection: 'row',
    gap: 10,
  },
  soundTile: {
    flex: 1,
    padding: 13,
    borderRadius: 16,
    borderWidth: 1.2,
    minHeight: 104,
    justifyContent: 'space-between',
  },
  soundTileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  soundTileOrb: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 9999,
    borderWidth: 1,
  },
  playingBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  soundTileTitle: {
    fontFamily: fontFamilies.sans.bold,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  soundTileSub: {
    fontFamily: fontFamilies.sans.regular,
    fontSize: 11.5,
    marginTop: 2,
  },
  fullPageLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    marginTop: 2,
  },
  fullPageLinkText: {
    fontFamily: fontFamilies.sans.semiBold,
    fontSize: 13,
    fontWeight: '700',
  },
  presetList: {
    gap: 9,
  },
  presetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  presetTitle: {
    fontFamily: fontFamilies.serif.semiBold,
    fontSize: 14,
    fontWeight: '700',
  },
  presetCadence: {
    fontFamily: fontFamilies.sans.semiBold,
    fontSize: 12,
    fontWeight: '600',
  },
  presetBenefit: {
    fontFamily: fontFamilies.sans.regular,
    fontSize: 11,
  },
  presetStartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  presetStartText: {
    fontFamily: fontFamilies.sans.bold,
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});