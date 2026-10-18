import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useAppTheme } from '../../theme/ThemeContext';
import { Card, CardContent, NatureSoundscapeIllustration, ScreenHeader, TactilePressable } from '../../components';
import { Ionicons } from '@expo/vector-icons';
import { soundService } from '../../services/soundService';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { PopIn } from '../../components/interactive/PopIn';
import { resolveTint } from '../../theme/tints';
import { useTabBarOffset } from '../../utils/useTabBarOffset';

interface TrackConfig {
  id: 'rain' | 'ocean' | 'birds' | 'night';
  title: string;
  subtitle: string;
  icon: string;
  atmosphere: string;
}

const TRACKS: TrackConfig[] = [
  {
    id: 'rain',
    title: 'Warm Summer Rain',
    subtitle: 'Rhythmic soft droplets against linen canvas',
    icon: 'rainy-outline',
    atmosphere: 'Alpha Brainwave Pacing',
  },
  {
    id: 'ocean',
    title: 'Pacific Ocean Waves',
    subtitle: 'Deep steady shore tides easing body tension',
    icon: 'water-outline',
    atmosphere: 'Vagus Nerve Regulation',
  },
  {
    id: 'birds',
    title: 'Morning Forest Canopy',
    subtitle: 'Gentle woodland warblers and rustling leaves',
    icon: 'leaf-outline',
    atmosphere: 'Attention Restoration',
  },
  {
    id: 'night',
    title: 'Nocturnal Crickets & Stream',
    subtitle: 'Quiet meadow evening breeze for deep sleep',
    icon: 'moon-outline',
    atmosphere: 'Deep Delta Sleep Aid',
  },
];

export function SoundscapesScreen() {
  const { colors, isDark } = useAppTheme();
  const skyTint = resolveTint(!!isDark, 'sky');
  const tabBarOffset = useTabBarOffset();

  const [activeSound, setActiveSound] = useState<string | null>(null);
  const [selectedTimer, setSelectedTimer] = useState<string>('Off');
  const [volumeLevel, setVolumeLevel] = useState<number>(0.8);

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

  const handleSelectTimer = (timer: string) => {
    setSelectedTimer(timer);
    const minutes = timer === 'Off' ? 0 : parseInt(timer, 10);
    soundService.setTimer(minutes);
  };

  const handleSetVolume = async (vol: number) => {
    setVolumeLevel(vol);
    await soundService.setVolume(vol);
  };

  return (
    <ScreenContainer scroll={false} backgroundColor={colors.background.default}>
      <ScreenHeader title="Soundscapes Sanctuary" subtitle="Acoustic Rest & Masking" bordered />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, activeSound ? styles.scrollContentPlaying : null]}
        showsVerticalScrollIndicator={false}
      >
        {/* Full-Page Hero Illustration Card */}
        <PopIn index={0}>
        <Card variant="elevated" style={styles.heroCard}>
          <CardContent style={styles.heroCardContent}>
            <View style={[styles.heroAuraGlow, { backgroundColor: (colors.accents.sky) + '15' }]}>
              <NatureSoundscapeIllustration width={190} height={155} />
            </View>
            <View style={styles.heroBadgeRow}>
              <View style={[styles.heroBadge, { backgroundColor: colors.primary.subtle, borderColor: colors.primary.subtleBorder }]}>
                <Ionicons name="infinite" size={13} color={colors.primary.default} />
                <Text style={[styles.heroBadgeText, { color: colors.primary.default }]}>Continuous Bio-Acoustics</Text>
              </View>
              <Text style={[styles.heroStatusText, { color: activeSound ? colors.primary.default : colors.text.tertiary }]}>
                {activeSound ? 'Streaming now' : 'Ready to play'}
              </Text>
            </View>
          </CardContent>
        </Card>
        </PopIn>

        {/* Header Cue */}
        <PopIn index={1}>
        <View style={{ marginBottom: 4 }}>
          <Text style={[styles.headline, { color: colors.text.primary }]}>
            Organic Ambient Audio
          </Text>
          <Text style={[styles.subheadline, { color: colors.text.secondary }]}>
            Select an acoustic landscape for focus, calm, or restful sleep.
          </Text>
        </View>
        </PopIn>

        {/* Soundscape Tiles */}
        <PopIn index={2}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Nature Soundscape Library
          </Text>
          <View style={styles.tracksList}>
            {TRACKS.map((track) => {
              const isPlaying = activeSound === track.id;
              return (
                <TactilePressable
                  key={track.id}
                  onPress={() => handleToggleSound(track.id)}
                  scaleDownTo={0.98}
                  style={[
                    styles.trackCard,
                    {
                      backgroundColor: isPlaying
                        ? (isDark ? 'rgba(94, 190, 123, 0.16)' : '#EEF6F0')
                        : colors.surface.default,
                      borderColor: isPlaying ? colors.primary.default : colors.border.default,
                    },
                  ]}
                >
                  <View style={styles.trackCardRow}>
                    <View
                      style={[
                        styles.trackIconOrb,
                        {
                          backgroundColor: isPlaying
                            ? colors.primary.default
                            : (isDark ? 'rgba(255,255,255,0.08)' : colors.background.secondary),
                        },
                      ]}
                    >
                      <Ionicons
                        name={track.icon as any}
                        size={22}
                        color={isPlaying ? '#FFFFFF' : colors.primary.default}
                      />
                    </View>
                    <View style={styles.trackInfo}>
                      <Text
                        style={[
                          styles.trackTitle,
                          { color: isPlaying ? colors.primary.default : colors.text.primary },
                        ]}
                        numberOfLines={1}
                      >
                        {track.title}
                      </Text>
                      <Text style={[styles.trackSub, { color: colors.text.tertiary }]} numberOfLines={2}>
                        {track.subtitle}
                      </Text>
                      <View style={[styles.atmosphereBadge, { backgroundColor: colors.primary.subtle }]}>
                        <Text style={[styles.atmosphereText, { color: colors.primary.default }]} numberOfLines={1}>
                          {track.atmosphere}
                        </Text>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.playToggleBtn,
                        {
                          backgroundColor: isPlaying ? colors.primary.default : 'transparent',
                          borderColor: isPlaying ? colors.primary.default : colors.border.default,
                        },
                      ]}
                    >
                      <Ionicons
                        name={isPlaying ? 'pause' : 'play'}
                        size={16}
                        color={isPlaying ? '#FFFFFF' : colors.text.primary}
                      />
                    </View>
                  </View>
                </TactilePressable>
              );
            })}
          </View>
        </View>
        </PopIn>

        {/* Sleep Timer & Volume Controls */}
        <PopIn index={3}>
        <Card variant="outlined" tone="sky" style={styles.controlsCard}>
          <CardContent style={styles.controlsContent}>
            {/* Sleep Timer */}
            <View style={styles.controlRow}>
              <View style={styles.controlLabelGroup}>
                <Ionicons name="timer-outline" size={18} color={skyTint.accent} />
                <Text style={[styles.controlHeading, { color: skyTint.text }]}>Sleep Auto-Timer</Text>
              </View>
              <View style={styles.timerPillsRow}>
                {['Off', '15m', '30m', '60m', '90m'].map((timer) => {
                  const isTimerActive = selectedTimer === timer;
                  return (
                    <TactilePressable
                      key={timer}
                      onPress={() => handleSelectTimer(timer)}
                      scaleDownTo={0.93}
                      style={[
                        styles.timerPill,
                        {
                          backgroundColor: isTimerActive ? skyTint.accent : skyTint.plate,
                          borderColor: isTimerActive ? skyTint.accent : skyTint.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.timerPillText,
                          { color: isTimerActive ? '#FFFFFF' : skyTint.text },
                        ]}
                      >
                        {timer}
                      </Text>
                    </TactilePressable>
                  );
                })}
              </View>
            </View>

            {/* Volume Presets */}
            <View style={[styles.controlRow, { marginTop: 12 }]}>
              <View style={styles.controlLabelGroup}>
                <Ionicons name="volume-medium-outline" size={18} color={skyTint.accent} />
                <Text style={[styles.controlHeading, { color: skyTint.text }]}>Soundscape Volume</Text>
              </View>
              <View style={styles.volumePillsRow}>
                {[
                  { label: 'Soft (25%)', val: 0.25 },
                  { label: 'Balanced (50%)', val: 0.5 },
                  { label: 'Immersive (80%)', val: 0.8 },
                  { label: 'Full (100%)', val: 1.0 },
                ].map((vol) => {
                  const isVolActive = Math.abs(volumeLevel - vol.val) < 0.05;
                  return (
                    <TactilePressable
                      key={vol.label}
                      onPress={() => handleSetVolume(vol.val)}
                      scaleDownTo={0.93}
                      style={[
                        styles.volumePill,
                        {
                          backgroundColor: isVolActive ? skyTint.accent : skyTint.plate,
                          borderColor: isVolActive ? skyTint.accent : skyTint.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.volumePillText,
                          { color: isVolActive ? '#FFFFFF' : skyTint.text },
                        ]}
                      >
                        {vol.label}
                      </Text>
                    </TactilePressable>
                  );
                })}
              </View>
            </View>
          </CardContent>
        </Card>
        </PopIn>
      </ScrollView>

      {/* Floating Bottom Bar */}
      {activeSound && (
        <View
          style={[
            styles.bottomBar,
            {
              bottom: tabBarOffset,
              backgroundColor: colors.surface.default,
              borderTopColor: colors.border.default,
            },
          ]}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.bottomBarTitle, { color: colors.text.primary }]}>
              Playing: {TRACKS.find((t) => t.id === activeSound)?.title}
            </Text>
            <Text style={[styles.bottomBarSub, { color: colors.text.tertiary }]}>
              {selectedTimer !== 'Off' ? `Timer active: ${selectedTimer}` : 'Continuous loop'}
            </Text>
          </View>
          <TactilePressable
            onPress={() => soundService.stop()}
            scaleDownTo={0.94}
            style={[
              styles.stopBtn,
              {
                backgroundColor: colors.primary.subtle,
                borderColor: colors.primary.subtleBorder,
              },
            ]}
          >
            <Ionicons name="stop" size={16} color={colors.primary.default} />
            <Text style={[styles.stopBtnText, { color: colors.primary.default }]}>Stop</Text>
          </TactilePressable>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 120,
    gap: 20,
  },
  scrollContentPlaying: {
    paddingBottom: 200,
  },
  heroCard: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  heroCardContent: {
    padding: 20,
    alignItems: 'center',
  },
  heroAuraGlow: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 14,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1,
  },
  heroBadgeText: { fontSize: 12, fontWeight: '700' },
  heroStatusText: { fontSize: 13, fontWeight: '600' },
  section: { gap: 10 },
  headline: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
    lineHeight: 30,
  },
  subheadline: {
    fontSize: 14,
    lineHeight: 21,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  tracksList: { gap: 12 },
  trackCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  trackCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  trackIconOrb: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackInfo: { flex: 1, gap: 4 },
  trackTitle: { fontSize: 16, fontWeight: '700' },
  atmosphereBadge: {
    alignSelf: 'flex-start',
    marginTop: 2,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  atmosphereText: { fontSize: 10, fontWeight: '700' },
  trackSub: { fontSize: 12, lineHeight: 16 },
  playToggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlsCard: { borderRadius: 20 },
  controlsContent: { padding: 16, gap: 10 },
  controlRow: { gap: 10 },
  controlLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlHeading: { fontSize: 14, fontWeight: '700' },
  timerPillsRow: { flexDirection: 'row', gap: 8 },
  timerPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  timerPillText: { fontSize: 12, fontWeight: '700' },
  volumePillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  volumePill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  volumePillText: { fontSize: 12, fontWeight: '600' },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomBarTitle: { fontSize: 14, fontWeight: '700' },
  bottomBarSub: { fontSize: 12 },
  stopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: 1,
  },
  stopBtnText: { fontSize: 13, fontWeight: '700' },
});
