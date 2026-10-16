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

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface QuickSound {
  id: 'rain' | 'ocean' | 'birds' | 'night';
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  atmosphere: string;
}

const SOUND_ROWS: [QuickSound, QuickSound][] = [
  [
    { id: 'rain', label: 'Rainfall', icon: 'rainy-outline', atmosphere: 'Soft drizzle' },
    { id: 'ocean', label: 'Ocean Waves', icon: 'water-outline', atmosphere: 'Deep tides' },
  ],
  [
    { id: 'birds', label: 'Forest Birds', icon: 'leaf-outline', atmosphere: 'Morning woods' },
    { id: 'night', label: 'Night Breeze', icon: 'moon-outline', atmosphere: 'Quiet stream' },
  ],
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

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
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
        {/* 1. Nature Soundscapes Interactive Player Hub */}
        <Card variant="elevated" style={styles.sectionCard}>
          <CardContent style={styles.cardInner}>
            <View style={styles.cardHeaderRow}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <View style={[styles.badgePill, { backgroundColor: (colors.accentSky || '#6B9BCD') + '18' }]}>
                  <Text style={[styles.badgePillText, { color: colors.accentSky || '#6B9BCD' }]}>
                    Nature Soundscapes
                  </Text>
                </View>
                <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
                  Ambient Sanctuary
                </Text>
                <Text style={[styles.sectionSub, { color: colors.textTertiary }]}>
                  Tap any atmosphere for immediate calm
                </Text>
              </View>
              <NatureSoundscapeIllustration width={110} height={85} />
            </View>

            {/* Symmetrical 2x2 Ambient Sound Grid */}
            <View style={styles.soundGrid}>
              {SOUND_ROWS.map((row, rowIdx) => (
                <View key={rowIdx} style={styles.soundRow}>
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
                              : (colors.isDark ? '#1E293B' : (colors.bgSecondary || '#F4EFE6')),
                            borderColor: isPlaying
                              ? colors.accentPrimary
                              : (colors.isDark ? '#354760' : (colors.borderMedium || '#D5CCC0')),
                            transform: [{ scale: pressed ? 0.96 : 1 }],
                            opacity: pressed ? 0.92 : 1,
                          },
                          isPlaying && styles.soundTileActive,
                        ]}
                      >
                        <View
                          style={[
                            styles.soundIconOrb,
                            {
                              backgroundColor: isPlaying
                                ? colors.accentPrimary
                                : (colors.isDark ? '#26344A' : colors.bgCard),
                              borderColor: isPlaying
                                ? colors.accentPrimary
                                : (colors.isDark ? '#3D526E' : (colors.borderLight || '#E6E0D4')),
                            },
                          ]}
                        >
                          <Ionicons
                            name={isPlaying ? 'pause' : snd.icon}
                            size={20}
                            color={isPlaying ? '#FFFFFF' : colors.accentPrimary}
                          />
                        </View>

                        <Text
                          style={[
                            styles.soundTileTitle,
                            { color: isPlaying ? colors.accentPrimary : colors.textPrimary },
                          ]}
                          numberOfLines={1}
                        >
                          {snd.label}
                        </Text>

                        <Text
                          style={[
                            styles.soundTileSub,
                            { color: isPlaying ? colors.accentPrimary : colors.textTertiary },
                          ]}
                          numberOfLines={1}
                        >
                          {isPlaying ? 'Playing ♪' : snd.atmosphere}
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
                  borderTopColor: colors.borderLight,
                  opacity: pressed ? 0.75 : 1,
                  transform: [{ scale: pressed ? 0.99 : 1 }],
                },
              ]}
            >
              <Text style={[styles.fullPageLinkText, { color: colors.accentPrimary }]}>
                Full Soundscapes Player & Sleep Timer
              </Text>
              <Ionicons name="arrow-forward" size={15} color={colors.accentPrimary} />
            </Pressable>
          </CardContent>
        </Card>

        {/* 2. Interactive Breathwork Studio Hub */}
        <Card variant="elevated" style={styles.sectionCard}>
          <CardContent style={styles.cardInner}>
            <View style={styles.cardHeaderRow}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <View style={[styles.badgePill, { backgroundColor: colors.accentBg }]}>
                  <Text style={[styles.badgePillText, { color: colors.accentPrimary }]}>
                    Breathwork Studio
                  </Text>
                </View>
                <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
                  Paced Breathing
                </Text>
                <Text style={[styles.sectionSub, { color: colors.textTertiary }]}>
                  Restore nervous system rhythm
                </Text>
              </View>
              <BreathworkIllustration width={110} height={85} />
            </View>

            {/* Direct Breathwork Presets */}
            <View style={styles.presetList}>
              {BREATH_PRESETS.map((preset) => (
                <View
                  key={preset.id}
                  style={[
                    styles.presetRow,
                    {
                      backgroundColor: colors.bgSecondary || '#F4EFE6',
                      borderColor: colors.borderLight,
                    },
                  ]}
                >
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[styles.presetTitle, { color: colors.textPrimary }]}>
                      {preset.title}
                    </Text>
                    <Text style={[styles.presetCadence, { color: colors.accentPrimary }]}>
                      {preset.cadence}
                    </Text>
                    <Text style={[styles.presetBenefit, { color: colors.textTertiary }]}>
                      {preset.benefit}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => handleStartBreathSession(preset.id, preset.duration)}
                    style={({ pressed }) => [
                      styles.presetStartButton,
                      {
                        backgroundColor: colors.accentPrimary,
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
                  borderTopColor: colors.borderLight,
                  opacity: pressed ? 0.75 : 1,
                  transform: [{ scale: pressed ? 0.99 : 1 }],
                },
              ]}
            >
              <Text style={[styles.fullPageLinkText, { color: colors.accentPrimary }]}>
                Explore Custom Durations & Audio in Studio
              </Text>
              <Ionicons name="arrow-forward" size={15} color={colors.accentPrimary} />
            </Pressable>
          </CardContent>
        </Card>

        {/* 3. 5-4-3-2-1 Sensory Grounding Card (Full Width Horizontal) */}
        <Card
          variant="elevated"
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
                <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
                  Sensory Grounding
                </Text>
                <Text style={[styles.sectionSub, { color: colors.textTertiary }]} numberOfLines={2}>
                  Engage physical senses to interrupt cognitive spirals
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }}>
                  <Text style={[styles.fullPageLinkText, { color: colors.accentPeach || '#EB876D' }]}>
                    Begin Grounding
                  </Text>
                  <Ionicons name="arrow-forward" size={14} color={colors.accentPeach || '#EB876D'} />
                </View>
              </View>
              <SensoryGroundingIllustration width={105} height={90} />
            </View>
          </CardContent>
        </Card>

        {/* 4. Somatic Body Scan Card (Full Width Horizontal) */}
        <Card
          variant="elevated"
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
                <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
                  Somatic Body Scan
                </Text>
                <Text style={[styles.sectionSub, { color: colors.textTertiary }]} numberOfLines={2}>
                  Progressive tension release across 5 anatomy zones
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }}>
                  <Text style={[styles.fullPageLinkText, { color: colors.accentPrimary }]}>
                    Begin Body Scan
                  </Text>
                  <Ionicons name="arrow-forward" size={14} color={colors.accentPrimary} />
                </View>
              </View>
              <BodyScanIllustration width={105} height={90} />
            </View>
          </CardContent>
        </Card>

        {/* 5. Emergency SOS Acute Panic Anchor Card (Full Width Horizontal) */}
        <Card
          variant="elevated"
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
                <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
                  Acute Panic Anchor
                </Text>
                <Text style={[styles.sectionSub, { color: colors.textTertiary }]} numberOfLines={2}>
                  Physiological sigh & cold water reflex for rapid de-escalation
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }}>
                  <Text style={[styles.fullPageLinkText, { color: colors.accentRose || '#EB697F' }]}>
                    Open SOS Relief
                  </Text>
                  <Ionicons name="arrow-forward" size={14} color={colors.accentRose || '#EB697F'} />
                </View>
              </View>
              <PanicAnchorIllustration width={105} height={90} />
            </View>
          </CardContent>
        </Card>
      </ScrollView>
    </View>
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
  soundRow: {
    flexDirection: 'row',
    gap: 10,
  },
  soundTile: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 108,
    gap: 4,
  },
  soundTileActive: {
    borderWidth: 1.6,
  },
  soundIconOrb: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  soundTileTitle: {
    fontFamily: fontFamilies.sans.bold,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  soundTileSub: {
    fontFamily: fontFamilies.sans.regular,
    fontSize: 11,
    textAlign: 'center',
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