import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, TouchableOpacity } from 'react-native';
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

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface QuickSound {
  id: 'rain' | 'ocean' | 'birds' | 'night';
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  atmosphere: string;
}

const SOUND_ROWS: [QuickSound, QuickSound][] = [
  [
    { id: 'rain', label: 'Rainfall', icon: 'rainy-outline', atmosphere: 'Soft & steady' },
    { id: 'ocean', label: 'Ocean Waves', icon: 'water-outline', atmosphere: 'Deep tide' },
  ],
  [
    { id: 'birds', label: 'Forest Birds', icon: 'leaf-outline', atmosphere: 'Morning woods' },
    { id: 'night', label: 'Night Breeze', icon: 'moon-outline', atmosphere: 'Gentle stream' },
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
    if (activeSound === soundId) {
      await soundService.stop();
    } else {
      await soundService.play(soundId);
    }
  };

  const handleStartBreathSession = (preset: BreathingPreset, duration: number) => {
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
          <TouchableOpacity
            onPress={() => navigation.navigate('Soundscapes')}
            style={[
              styles.soundStatusBadge,
              {
                backgroundColor: activeSound ? colors.accentBg : colors.bgCard,
                borderColor: activeSound ? colors.accentPrimary : colors.borderLight,
              },
            ]}
          >
            <Ionicons
              name={activeSound ? 'volume-medium' : 'headset-outline'}
              size={18}
              color={activeSound ? colors.accentPrimary : colors.textTertiary}
            />
            {activeSound && <View style={[styles.pulseDot, { backgroundColor: colors.accentPrimary }]} />}
          </TouchableOpacity>
        </View>

        {/* Live Audio Mini-Player Bar (When Sound is Active) */}
        {activeSound && (
          <Pressable
            onPress={() => navigation.navigate('Soundscapes')}
            style={[styles.miniPlayerBar, { backgroundColor: colors.accentBg, borderColor: colors.accentBorder }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <Ionicons name="musical-notes" size={16} color={colors.accentPrimary} />
              <Text style={[styles.miniPlayerText, { color: colors.accentPrimary }]} numberOfLines={1}>
                Playing: {activeSound.toUpperCase()} Ambient Soundscape
              </Text>
            </View>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                soundService.stop();
              }}
              style={styles.miniPlayerStop}
              hitSlop={8}
            >
              <Ionicons name="pause" size={14} color={colors.accentPrimary} />
            </TouchableOpacity>
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

            {/* Direct Symmetrical 2x2 Sound Grid */}
            <View style={styles.soundGrid}>
              {SOUND_ROWS.map((row, rowIdx) => (
                <View key={rowIdx} style={styles.soundRow}>
                  {row.map((snd) => {
                    const isPlaying = activeSound === snd.id;
                    return (
                      <TouchableOpacity
                        key={snd.id}
                        onPress={() => handleToggleSound(snd.id)}
                        style={[
                          styles.soundTile,
                          {
                            backgroundColor: isPlaying ? colors.accentBg : (colors.bgSecondary || '#F4EFE6'),
                            borderColor: isPlaying ? colors.accentPrimary : colors.borderLight,
                          },
                          isPlaying && styles.soundTileActive,
                        ]}
                        activeOpacity={0.7}
                      >
                        <View style={styles.soundTileTop}>
                          <View
                            style={[
                              styles.soundIconOrb,
                              {
                                backgroundColor: isPlaying ? colors.accentPrimary : colors.bgCard,
                              },
                            ]}
                          >
                            <Ionicons
                              name={isPlaying ? 'pause' : snd.icon}
                              size={17}
                              color={isPlaying ? '#FFFFFF' : colors.textPrimary}
                            />
                          </View>
                          <Ionicons
                            name={isPlaying ? 'volume-high' : 'play'}
                            size={14}
                            color={isPlaying ? colors.accentPrimary : colors.textTertiary}
                          />
                        </View>
                        <Text style={[styles.soundTileTitle, { color: colors.textPrimary }]}>
                          {snd.label}
                        </Text>
                        <Text style={[styles.soundTileSub, { color: colors.textTertiary }]}>
                          {snd.atmosphere}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>

            <TouchableOpacity
              onPress={() => navigation.navigate('Soundscapes')}
              style={[styles.fullPageLink, { borderTopColor: colors.borderLight }]}
            >
              <Text style={[styles.fullPageLinkText, { color: colors.accentPrimary }]}>
                Full Soundscapes Player & Sleep Timer
              </Text>
              <Ionicons name="arrow-forward" size={15} color={colors.accentPrimary} />
            </TouchableOpacity>
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
                  <TouchableOpacity
                    onPress={() => handleStartBreathSession(preset.id, preset.duration)}
                    style={[styles.presetStartButton, { backgroundColor: colors.accentPrimary }]}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="play" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                    <Text style={styles.presetStartText}>Start</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <TouchableOpacity
              onPress={() => navigation.navigate('BreathworkStudio')}
              style={[styles.fullPageLink, { borderTopColor: colors.borderLight }]}
            >
              <Text style={[styles.fullPageLinkText, { color: colors.accentPrimary }]}>
                Explore Custom Durations & Audio in Studio
              </Text>
              <Ionicons name="arrow-forward" size={15} color={colors.accentPrimary} />
            </TouchableOpacity>
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
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  mainSubtitle: {
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
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 23,
  },
  sectionSub: {
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
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  soundTileActive: {
    borderWidth: 1.5,
  },
  soundTileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  soundIconOrb: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soundTileTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  soundTileSub: {
    fontSize: 11,
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
    fontSize: 14,
    fontWeight: '700',
  },
  presetCadence: {
    fontSize: 12,
    fontWeight: '600',
  },
  presetBenefit: {
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
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});