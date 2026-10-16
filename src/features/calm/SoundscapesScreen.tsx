import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemeColors } from '../../theme/ThemeContext';
import { Card, CardContent, PrimaryButton, NatureSoundscapeIllustration, AppIcon } from '../../components';
import { Ionicons } from '@expo/vector-icons';
import { soundService } from '../../services/soundService';

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
  const navigation = useNavigation();
  const colors = useThemeColors();
  const isDark = colors.isDark;

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
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      {/* Top Bar */}
      <View style={[styles.navBar, { borderBottomColor: colors.borderLight }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [
            styles.backButton,
            {
              backgroundColor: colors.bgCard,
              borderColor: colors.borderLight,
              transform: [{ scale: pressed ? 0.92 : 1 }],
              opacity: pressed ? 0.8 : 1,
            },
          ]}
          hitSlop={10}
        >
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.navTitleCol}>
          <Text style={[styles.navTitle, { color: colors.textPrimary }]}>Soundscapes Sanctuary</Text>
          <Text style={[styles.navSubtitle, { color: colors.textTertiary }]}>Acoustic Rest & Masking</Text>
        </View>
        <View
          style={[
            styles.liveIndicator,
            {
              backgroundColor: activeSound ? colors.accentBg : colors.bgCard,
              borderColor: activeSound ? colors.accentPrimary : colors.borderLight,
            },
          ]}
        >
          <Ionicons
            name={activeSound ? 'volume-medium' : 'volume-mute-outline'}
            size={16}
            color={activeSound ? colors.accentPrimary : colors.textTertiary}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Full-Page Hero Illustration Card */}
        <Card variant="elevated" style={styles.heroCard}>
          <CardContent style={styles.heroCardContent}>
            <View style={[styles.heroAuraGlow, { backgroundColor: (colors.accentSky || '#6B9BCD') + '15' }]}>
              <NatureSoundscapeIllustration width={190} height={155} />
            </View>
            <View style={styles.heroBadgeRow}>
              <View style={[styles.heroBadge, { backgroundColor: colors.accentBg, borderColor: colors.accentBorder }]}>
                <Ionicons name="infinite" size={13} color={colors.accentPrimary} />
                <Text style={[styles.heroBadgeText, { color: colors.accentPrimary }]}>Continuous Bio-Acoustics</Text>
              </View>
              <Text style={[styles.heroStatusText, { color: activeSound ? colors.accentPrimary : colors.textTertiary }]}>
                {activeSound ? 'Streaming now' : 'Ready to play'}
              </Text>
            </View>
          </CardContent>
        </Card>

        {/* Header Cue */}
        <View style={{ marginBottom: 4 }}>
          <Text style={[styles.headline, { color: colors.textPrimary }]}>
            Organic Ambient Audio
          </Text>
          <Text style={[styles.subheadline, { color: colors.textSecondary }]}>
            Select an acoustic landscape for focus, calm, or restful sleep.
          </Text>
        </View>

        {/* Soundscape Tiles */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Nature Soundscape Library
          </Text>
          <View style={styles.tracksList}>
            {TRACKS.map((track) => {
              const isPlaying = activeSound === track.id;
              return (
                <Pressable
                  key={track.id}
                  onPress={() => handleToggleSound(track.id)}
                  style={({ pressed }) => [
                    styles.trackCard,
                    {
                      backgroundColor: isPlaying
                        ? (isDark ? 'rgba(94, 190, 123, 0.16)' : '#EEF6F0')
                        : colors.bgCard,
                      borderColor: isPlaying ? colors.accentPrimary : colors.borderLight,
                      opacity: pressed ? 0.9 : 1,
                      transform: [{ scale: pressed ? 0.98 : 1 }],
                    },
                  ]}
                >
                  <View style={styles.trackCardRow}>
                    <View
                      style={[
                        styles.trackIconOrb,
                        {
                          backgroundColor: isPlaying
                            ? colors.accentPrimary
                            : (isDark ? 'rgba(255,255,255,0.08)' : colors.bgSecondary ?? '#F4EFE6'),
                        },
                      ]}
                    >
                      <Ionicons
                        name={track.icon as any}
                        size={22}
                        color={isPlaying ? '#FFFFFF' : colors.accentPrimary}
                      />
                    </View>
                    <View style={styles.trackInfo}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text
                          style={[
                            styles.trackTitle,
                            { color: isPlaying ? colors.accentPrimary : colors.textPrimary },
                          ]}
                        >
                          {track.title}
                        </Text>
                        <View style={[styles.atmosphereBadge, { backgroundColor: colors.accentBg }]}>
                          <Text style={[styles.atmosphereText, { color: colors.accentPrimary }]}>
                            {track.atmosphere}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.trackSub, { color: colors.textTertiary }]}>
                        {track.subtitle}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.playToggleBtn,
                        {
                          backgroundColor: isPlaying ? colors.accentPrimary : 'transparent',
                          borderColor: isPlaying ? colors.accentPrimary : colors.borderLight,
                        },
                      ]}
                    >
                      <Ionicons
                        name={isPlaying ? 'pause' : 'play'}
                        size={16}
                        color={isPlaying ? '#FFFFFF' : colors.textPrimary}
                      />
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Sleep Timer & Volume Controls */}
        <Card variant="outlined" style={styles.controlsCard}>
          <CardContent style={styles.controlsContent}>
            {/* Sleep Timer */}
            <View style={styles.controlRow}>
              <View style={styles.controlLabelGroup}>
                <Ionicons name="timer-outline" size={18} color={colors.accentPrimary} />
                <Text style={[styles.controlHeading, { color: colors.textPrimary }]}>Sleep Auto-Timer</Text>
              </View>
              <View style={styles.timerPillsRow}>
                {['Off', '15m', '30m', '60m', '90m'].map((timer) => {
                  const isTimerActive = selectedTimer === timer;
                  return (
                    <Pressable
                      key={timer}
                      onPress={() => handleSelectTimer(timer)}
                      style={({ pressed }) => [
                        styles.timerPill,
                        {
                          backgroundColor: isTimerActive ? colors.accentPrimary : colors.bgCard,
                          borderColor: isTimerActive ? colors.accentPrimary : colors.borderLight,
                          transform: [{ scale: pressed ? 0.93 : 1 }],
                          opacity: pressed ? 0.88 : 1,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.timerPillText,
                          { color: isTimerActive ? '#FFFFFF' : colors.textSecondary },
                        ]}
                      >
                        {timer}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Volume Presets */}
            <View style={[styles.controlRow, { marginTop: 12 }]}>
              <View style={styles.controlLabelGroup}>
                <Ionicons name="volume-medium-outline" size={18} color={colors.accentPrimary} />
                <Text style={[styles.controlHeading, { color: colors.textPrimary }]}>Soundscape Volume</Text>
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
                    <Pressable
                      key={vol.label}
                      onPress={() => handleSetVolume(vol.val)}
                      style={({ pressed }) => [
                        styles.volumePill,
                        {
                          backgroundColor: isVolActive ? colors.accentPrimary : colors.bgCard,
                          borderColor: isVolActive ? colors.accentPrimary : colors.borderLight,
                          transform: [{ scale: pressed ? 0.93 : 1 }],
                          opacity: pressed ? 0.88 : 1,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.volumePillText,
                          { color: isVolActive ? '#FFFFFF' : colors.textSecondary },
                        ]}
                      >
                        {vol.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </CardContent>
        </Card>
      </ScrollView>

      {/* Floating Bottom Bar */}
      {activeSound && (
        <View style={[styles.bottomBar, { backgroundColor: colors.bgCard, borderTopColor: colors.borderLight }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.bottomBarTitle, { color: colors.textPrimary }]}>
              Playing: {TRACKS.find((t) => t.id === activeSound)?.title}
            </Text>
            <Text style={[styles.bottomBarSub, { color: colors.textTertiary }]}>
              {selectedTimer !== 'Off' ? `Timer active: ${selectedTimer}` : 'Continuous loop'}
            </Text>
          </View>
          <Pressable
            onPress={() => soundService.stop()}
            style={({ pressed }) => [
              styles.stopBtn,
              {
                backgroundColor: colors.accentBg,
                borderColor: colors.accentBorder,
                transform: [{ scale: pressed ? 0.94 : 1 }],
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Ionicons name="stop" size={16} color={colors.accentPrimary} />
            <Text style={[styles.stopBtnText, { color: colors.accentPrimary }]}>Stop</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitleCol: { alignItems: 'center' },
  navTitle: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  navSubtitle: { fontSize: 12, fontWeight: '500', marginTop: 1 },
  liveIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 120,
    gap: 20,
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
    bottom: 0,
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
