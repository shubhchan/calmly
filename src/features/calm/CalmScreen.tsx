import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import {
  Card,
  CardContent,
  PrimaryButton,
  AppIcon,
  BreathworkIllustration,
  SensoryGroundingIllustration,
  BodyScanIllustration,
  PanicAnchorIllustration,
} from '../../components';
import { RootStackParamList, BreathingPreset, GroundingType } from '../../types/navigation';
import { useThemeColors } from '../../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';

type CalmTab = 'breathwork' | 'grounding' | 'bodyscan' | 'panic';

interface PresetInfo {
  id: BreathingPreset;
  title: string;
  tag: string;
  duration: string;
  formula: string;
  desc: string;
  icon: string;
  inhale: number;
  hold: number;
  exhale: number;
  holdExhale: number;
}

const PRESETS: Record<string, PresetInfo> = {
  box: {
    id: 'box',
    title: 'Box Breathing',
    tag: 'Focus & Reset',
    duration: '4 min',
    formula: '4s · 4s · 4s · 4s',
    desc: 'Equalizes autonomic nervous system and sharpens executive clarity.',
    icon: 'l-pulse',
    inhale: 4,
    hold: 4,
    exhale: 4,
    holdExhale: 4,
  },
  '4-7-8': {
    id: '4-7-8',
    title: '4-7-8 Technique',
    tag: 'Sleep & Anxiety',
    duration: '7 min',
    formula: '4s · 7s · 8s',
    desc: 'Dr. Weil’s tranquil reset; triggers deep parasympathetic rest for sleep.',
    icon: 'l-expand',
    inhale: 4,
    hold: 7,
    exhale: 8,
    holdExhale: 0,
  },
  '4-6': {
    id: '4-6',
    title: '4-6 Heart Rhythm',
    tag: 'Vagus Nerve',
    duration: '5 min',
    formula: '4s · 6s',
    desc: 'Extended exhalation stimulates the vagal nerve to lower acute pulse rate.',
    icon: 'l-heart',
    inhale: 4,
    hold: 0,
    exhale: 6,
    holdExhale: 0,
  },
  deep: {
    id: 'deep',
    title: 'Deep Relaxation',
    tag: 'Tension Release',
    duration: '8 min',
    formula: '6s · 2s · 8s',
    desc: 'Somatic full-capacity breathing for easing accumulated muscle armor.',
    icon: 'l-calm',
    inhale: 6,
    hold: 2,
    exhale: 8,
    holdExhale: 0,
  },
};

import { soundService, SOUND_TRACKS } from '../../services/soundService';

const BODY_ZONES = [
  {
    id: 'jaw',
    name: 'Jaw & Face',
    icon: 'l-calm',
    cue: 'Unclench your jaw. Part your teeth slightly and let your tongue rest flat on the floor of your mouth.',
  },
  {
    id: 'shoulders',
    name: 'Shoulders & Neck',
    icon: 'l-hands',
    cue: 'Drop your shoulders 2 full inches away from your ears. Let the weight of your arms pull tension downward.',
  },
  {
    id: 'chest',
    name: 'Chest & Ribs',
    icon: 'l-heart',
    cue: 'Soften your breastbone. Notice the rise and fall without forcing depth. Allow the ribs to expand sideways.',
  },
  {
    id: 'belly',
    name: 'Belly & Core',
    icon: 'l-expand',
    cue: 'Release any unconscious tightening in your stomach. Allow your abdominal wall to soften on each out-breath.',
  },
  {
    id: 'hands',
    name: 'Hands & Fingers',
    icon: 'l-pulse',
    cue: 'Uncurl your fingers. Place palms facing upward. Feel the subtle pulse in your fingertips.',
  },
];

export function CalmScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const colors = useThemeColors();

  // Active Tab
  const [activeTab, setActiveTab] = useState<CalmTab>('breathwork');

  // Interactive Breath Pacer State
  const [selectedPresetId, setSelectedPresetId] = useState<string>('box');
  const [isPacingActive, setIsPacingActive] = useState(false);
  const [pacingPhase, setPacingPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Rest'>('Inhale');
  const [secondsRemaining, setSecondsRemaining] = useState(4);

  // Soundscape State & Playback
  const [activeSound, setActiveSound] = useState<string | null>(null);
  const [soundTimer, setSoundTimer] = useState<string>('15m');

  const handleToggleSound = async (soundId: string) => {
    if (activeSound === soundId) {
      setActiveSound(null);
      await soundService.stop();
    } else {
      setActiveSound(soundId);
      await soundService.playTrack(soundId);
    }
  };

  const handleSelectTimer = (timer: string) => {
    setSoundTimer(timer === 'Off' ? '' : timer);
    const minutes = timer === '15m' ? 15 : timer === '30m' ? 30 : timer === '60m' ? 60 : 0;
    soundService.setSleepTimer(minutes, () => {
      setActiveSound(null);
    });
  };

  useEffect(() => {
    return () => {
      soundService.stop();
    };
  }, []);

  // Body Zone State
  const [selectedZone, setSelectedZone] = useState<string>('jaw');

  const preset = PRESETS[selectedPresetId] || PRESETS.box;

  // Animation values for the Breathing Orb
  const orbScale = useSharedValue(1);
  const haloScale = useSharedValue(1);
  const haloOpacity = useSharedValue(0.2);

  // Sound wave equalizer bars animation
  const eq1 = useSharedValue(12);
  const eq2 = useSharedValue(20);
  const eq3 = useSharedValue(16);
  const eq4 = useSharedValue(24);

  // Start/Stop Live Breathing Loop
  useEffect(() => {
    if (!isPacingActive) {
      cancelAnimation(orbScale);
      cancelAnimation(haloScale);
      cancelAnimation(haloOpacity);
      orbScale.value = withTiming(1, { duration: 600 });
      haloScale.value = withTiming(1, { duration: 600 });
      haloOpacity.value = withTiming(0.2, { duration: 600 });
      return;
    }

    const inhaleTime = preset.inhale * 1000;
    const holdTime = (preset.hold || 1) * 1000;
    const exhaleTime = preset.exhale * 1000;
    const restTime = (preset.holdExhale || 1) * 1000;

    let mounted = true;
    let timer: any;

    const runSequence = async () => {
      if (!mounted) return;

      // 1. Inhale
      setPacingPhase('Inhale');
      setSecondsRemaining(preset.inhale);
      orbScale.value = withTiming(1.35, { duration: inhaleTime, easing: Easing.inOut(Easing.ease) });
      haloScale.value = withTiming(1.55, { duration: inhaleTime, easing: Easing.inOut(Easing.ease) });
      haloOpacity.value = withTiming(0.65, { duration: inhaleTime, easing: Easing.inOut(Easing.ease) });

      await new Promise((r) => { timer = setTimeout(r, inhaleTime); });
      if (!mounted) return;

      // 2. Hold (if applicable)
      if (preset.hold > 0) {
        setPacingPhase('Hold');
        setSecondsRemaining(preset.hold);
        await new Promise((r) => { timer = setTimeout(r, holdTime); });
        if (!mounted) return;
      }

      // 3. Exhale
      setPacingPhase('Exhale');
      setSecondsRemaining(preset.exhale);
      orbScale.value = withTiming(1.0, { duration: exhaleTime, easing: Easing.inOut(Easing.ease) });
      haloScale.value = withTiming(1.0, { duration: exhaleTime, easing: Easing.inOut(Easing.ease) });
      haloOpacity.value = withTiming(0.2, { duration: exhaleTime, easing: Easing.inOut(Easing.ease) });

      await new Promise((r) => { timer = setTimeout(r, exhaleTime); });
      if (!mounted) return;

      // 4. Rest (if applicable)
      if (preset.holdExhale > 0) {
        setPacingPhase('Rest');
        setSecondsRemaining(preset.holdExhale);
        await new Promise((r) => { timer = setTimeout(r, restTime); });
        if (!mounted) return;
      }

      runSequence();
    };

    runSequence();

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [isPacingActive, selectedPresetId]);

  // Sound Equalizer animation loop when sound is active
  useEffect(() => {
    if (activeSound) {
      eq1.value = withRepeat(withSequence(withTiming(26, { duration: 320 }), withTiming(8, { duration: 320 })), -1, true);
      eq2.value = withRepeat(withSequence(withTiming(32, { duration: 420 }), withTiming(10, { duration: 420 })), -1, true);
      eq3.value = withRepeat(withSequence(withTiming(22, { duration: 280 }), withTiming(6, { duration: 280 })), -1, true);
      eq4.value = withRepeat(withSequence(withTiming(28, { duration: 360 }), withTiming(12, { duration: 360 })), -1, true);
    } else {
      eq1.value = withTiming(10);
      eq2.value = withTiming(14);
      eq3.value = withTiming(10);
      eq4.value = withTiming(16);
    }
  }, [activeSound]);

  const animatedOrb = useAnimatedStyle(() => ({
    transform: [{ scale: orbScale.value }],
  }));

  const animatedHalo = useAnimatedStyle(() => ({
    transform: [{ scale: haloScale.value }],
    opacity: haloOpacity.value,
  }));

  const animatedEq1 = useAnimatedStyle(() => ({ height: eq1.value }));
  const animatedEq2 = useAnimatedStyle(() => ({ height: eq2.value }));
  const animatedEq3 = useAnimatedStyle(() => ({ height: eq3.value }));
  const animatedEq4 = useAnimatedStyle(() => ({ height: eq4.value }));

  const activeZoneData = BODY_ZONES.find((z) => z.id === selectedZone) || BODY_ZONES[0];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bgPrimary }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Header with Serenity Aura */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerTextCol}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Calm Sanctuary</Text>
            <Text style={[styles.subtitle, { color: colors.textTertiary }]}>
              Regulate your nervous system through conscious presence
            </Text>
          </View>
          <View style={[styles.liveAuraBadge, { backgroundColor: colors.accentBg, borderColor: colors.accentBorder }]}>
            <View style={[styles.liveDot, { backgroundColor: colors.accentPrimary }]} />
            <Text style={[styles.liveText, { color: colors.accentPrimary }]}>Present</Text>
          </View>
        </View>
      </View>

      {/* 2. Interactive Living Breathing Orb (Hero) */}
      <Card variant="elevated" style={styles.orbCard}>
        <CardContent style={styles.orbCardContent}>
          <View style={styles.orbHeroHeader}>
            <View style={[styles.patternBadge, { backgroundColor: colors.accentBg }]}>
              <Text style={[styles.patternBadgeText, { color: colors.accentPrimary }]}>
                {preset.title} · {preset.formula}
              </Text>
            </View>
            <Pressable
              onPress={() => navigation.navigate('BreathingSession', { preset: preset.id })}
              style={({ pressed }) => [
                styles.expandButton,
                { backgroundColor: colors.bgPrimary, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Ionicons name="expand" size={15} color={colors.textSecondary} />
              <Text style={[styles.expandButtonText, { color: colors.textSecondary }]}>Fullscreen</Text>
            </Pressable>
          </View>

          {/* Concentric Living Mandala Rings */}
          <View style={styles.mandalaContainer}>
            {/* Outer Diffuse Halo */}
            <Animated.View
              style={[
                styles.haloRing,
                {
                  backgroundColor: colors.accentPrimary,
                },
                animatedHalo,
              ]}
            />

            {/* Mid Resonant Glow Ring */}
            <View
              style={[
                styles.resonanceRing,
                {
                  borderColor: colors.accentPrimary + '40',
                  backgroundColor: colors.accentPrimary + '0E',
                },
              ]}
            />

            {/* Central Interactive Breathing Orb */}
            <Animated.View
              style={[
                styles.centralOrb,
                {
                  backgroundColor: colors.bgCard,
                  borderColor: colors.accentPrimary + '60',
                },
                animatedOrb,
              ]}
            >
              <Pressable
                onPress={() => setIsPacingActive(!isPacingActive)}
                style={styles.orbTouchable}
              >
                <AppIcon name={preset.icon} size={36} loop />
                <Text style={[styles.phaseLabel, { color: colors.accentPrimary }]}>
                  {isPacingActive ? pacingPhase : 'Tap to Breathe'}
                </Text>
                <Text style={[styles.phaseTimer, { color: colors.textTertiary }]}>
                  {isPacingActive ? `${preset.tag}` : 'Begin Rhythm'}
                </Text>
              </Pressable>
            </Animated.View>
          </View>

          {/* Quick Preset Selector Buttons */}
          <View style={styles.presetButtonsRow}>
            {Object.values(PRESETS).map((p) => {
              const isSelected = selectedPresetId === p.id;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => setSelectedPresetId(p.id)}
                  style={({ pressed }) => [
                    styles.presetChip,
                    {
                      backgroundColor: isSelected ? colors.accentPrimary : colors.bgPrimary,
                      borderColor: isSelected ? colors.accentPrimary : colors.borderLight,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.presetChipText,
                      { color: isSelected ? '#FFFFFF' : colors.textSecondary },
                    ]}
                  >
                    {p.title.split(' ')[0]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Action Trigger */}
          <PrimaryButton
            title={isPacingActive ? 'Pause Breath Guidance' : 'Start 1-Minute Centering'}
            variant={isPacingActive ? 'outline' : 'primary'}
            size="md"
            onPress={() => setIsPacingActive(!isPacingActive)}
            leftIcon={
              <Ionicons
                name={isPacingActive ? 'pause-circle' : 'play-circle'}
                size={20}
                color={isPacingActive ? colors.accentPrimary : '#FFFFFF'}
              />
            }
          />
        </CardContent>
      </Card>

      {/* 3. Ambient Nature Soundscapes Audio Player */}
      <Card variant="outlined" style={styles.soundCard}>
        <CardContent style={styles.soundCardContent}>
          <View style={styles.soundHeaderRow}>
            <View style={styles.soundTitleContainer}>
              <Text style={[styles.soundSectionTitle, { color: colors.textPrimary }]}>
                Nature Soundscapes
              </Text>
              <Text style={[styles.soundSectionSubtitle, { color: colors.textTertiary }]}>
                {activeSound ? `Now Playing · ${SOUND_TRACKS.find(s => s.id === activeSound)?.title}` : 'Ambient acoustic immersion for restoration'}
              </Text>
            </View>

            {/* Equalizer Visualizer */}
            <View style={styles.equalizerContainer}>
              <Animated.View style={[styles.eqBar, { backgroundColor: colors.accentPrimary }, animatedEq1]} />
              <Animated.View style={[styles.eqBar, { backgroundColor: colors.accentPrimary }, animatedEq2]} />
              <Animated.View style={[styles.eqBar, { backgroundColor: colors.accentPrimary }, animatedEq3]} />
              <Animated.View style={[styles.eqBar, { backgroundColor: colors.accentPrimary }, animatedEq4]} />
            </View>
          </View>

          {/* Symmetrical 2x2 Soundscape Grid */}
          <View style={styles.soundGrid}>
            <View style={styles.soundGridRow}>
              {SOUND_TRACKS.slice(0, 2).map((sound) => {
                const isPlaying = activeSound === sound.id;
                const tileBg = isPlaying
                  ? (colors.isDark ? 'rgba(94, 190, 123, 0.16)' : '#EEF6F0')
                  : (colors.isDark ? '#202B3E' : '#F6F2EA');
                const tileBorder = isPlaying
                  ? colors.accentPrimary
                  : (colors.isDark ? '#2D3E56' : '#E5DED2');
                const orbBg = isPlaying
                  ? colors.accentPrimary
                  : (colors.isDark ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF');
                const iconColor = isPlaying
                  ? '#FFFFFF'
                  : (colors.isDark ? '#F9FAFB' : colors.textPrimary);

                return (
                  <Pressable
                    key={sound.id}
                    onPress={() => handleToggleSound(sound.id)}
                    style={({ pressed }) => [
                      styles.soundTile,
                      {
                        backgroundColor: tileBg,
                        borderColor: tileBorder,
                        opacity: pressed ? 0.85 : 1,
                        transform: [{ scale: pressed ? 0.98 : 1 }],
                      },
                    ]}
                  >
                    <View style={styles.soundTileTopRow}>
                      <View style={[styles.soundIconOrb, { backgroundColor: orbBg }]}>
                        <AppIcon
                          name={sound.icon}
                          size={20}
                          color={iconColor}
                          animated={!isPlaying}
                        />
                      </View>
                      {isPlaying ? (
                        <View style={[styles.soundLiveBadge, { backgroundColor: colors.accentPrimary + '20' }]}>
                          <Ionicons name="volume-medium" size={16} color={colors.accentPrimary} />
                        </View>
                      ) : (
                        <Ionicons name="play-circle-outline" size={22} color={colors.textTertiary} />
                      )}
                    </View>

                    <View style={styles.soundTileBottomCol}>
                      <Text
                        style={[
                          styles.soundItemTitle,
                          { color: isPlaying ? colors.accentPrimary : colors.textPrimary },
                        ]}
                        numberOfLines={1}
                      >
                        {sound.title}
                      </Text>
                      <Text
                        style={[
                          styles.soundItemSubtitle,
                          { color: colors.textTertiary },
                        ]}
                        numberOfLines={1}
                      >
                        {sound.subtitle}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.soundGridRow}>
              {SOUND_TRACKS.slice(2, 4).map((sound) => {
                const isPlaying = activeSound === sound.id;
                const tileBg = isPlaying
                  ? (colors.isDark ? 'rgba(94, 190, 123, 0.16)' : '#EEF6F0')
                  : (colors.isDark ? '#202B3E' : '#F6F2EA');
                const tileBorder = isPlaying
                  ? colors.accentPrimary
                  : (colors.isDark ? '#2D3E56' : '#E5DED2');
                const orbBg = isPlaying
                  ? colors.accentPrimary
                  : (colors.isDark ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF');
                const iconColor = isPlaying
                  ? '#FFFFFF'
                  : (colors.isDark ? '#F9FAFB' : colors.textPrimary);

                return (
                  <Pressable
                    key={sound.id}
                    onPress={() => handleToggleSound(sound.id)}
                    style={({ pressed }) => [
                      styles.soundTile,
                      {
                        backgroundColor: tileBg,
                        borderColor: tileBorder,
                        opacity: pressed ? 0.85 : 1,
                        transform: [{ scale: pressed ? 0.98 : 1 }],
                      },
                    ]}
                  >
                    <View style={styles.soundTileTopRow}>
                      <View style={[styles.soundIconOrb, { backgroundColor: orbBg }]}>
                        <AppIcon
                          name={sound.icon}
                          size={20}
                          color={iconColor}
                          animated={!isPlaying}
                        />
                      </View>
                      {isPlaying ? (
                        <View style={[styles.soundLiveBadge, { backgroundColor: colors.accentPrimary + '20' }]}>
                          <Ionicons name="volume-medium" size={16} color={colors.accentPrimary} />
                        </View>
                      ) : (
                        <Ionicons name="play-circle-outline" size={22} color={colors.textTertiary} />
                      )}
                    </View>

                    <View style={styles.soundTileBottomCol}>
                      <Text
                        style={[
                          styles.soundItemTitle,
                          { color: isPlaying ? colors.accentPrimary : colors.textPrimary },
                        ]}
                        numberOfLines={1}
                      >
                        {sound.title}
                      </Text>
                      <Text
                        style={[
                          styles.soundItemSubtitle,
                          { color: colors.textTertiary },
                        ]}
                        numberOfLines={1}
                      >
                        {sound.subtitle}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Sleep Timer & Ambient Controls Footer */}
          <View style={[styles.soundFooterRow, { borderTopColor: colors.isDark ? '#2D3E56' : colors.borderLight }]}>
            <View style={styles.timerLabelGroup}>
              <Ionicons name="timer-outline" size={15} color={colors.textTertiary} />
              <Text style={[styles.timerLabel, { color: colors.textSecondary }]}>
                Sleep Timer:
              </Text>
            </View>
            <View style={styles.timerPills}>
              {['Off', '15m', '30m', '60m'].map((timer) => {
                const isTimerActive = (timer === 'Off' && !soundTimer) || soundTimer === timer;
                return (
                  <Pressable
                    key={timer}
                    onPress={() => handleSelectTimer(timer)}
                    style={[
                      styles.timerChip,
                      {
                        backgroundColor: isTimerActive
                          ? colors.accentPrimary
                          : (colors.isDark ? '#202B3E' : (colors.bgSecondary ?? '#F4EFE6')),
                        borderColor: isTimerActive
                          ? colors.accentPrimary
                          : (colors.isDark ? '#2D3E56' : colors.borderLight),
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.timerText,
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
        </CardContent>
      </Card>

      {/* 4. Sanctuary Segmented Category Tabs */}
      <View style={[styles.categoryTabs, { backgroundColor: colors.bgCard, borderColor: colors.borderLight }]}>
        {(['breathwork', 'grounding', 'bodyscan', 'panic'] as CalmTab[]).map((tab) => {
          const isSelected = activeTab === tab;
          const label =
            tab === 'breathwork' ? 'Breathwork' :
            tab === 'grounding' ? '5-4-3-2-1' :
            tab === 'bodyscan' ? 'Body Scan' : 'Panic Aid';
          return (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[
                styles.categoryTabButton,
                isSelected && [styles.categoryTabActive, { backgroundColor: colors.accentPrimary }],
              ]}
            >
              <Text
                style={[
                  styles.categoryTabText,
                  { color: isSelected ? '#FFFFFF' : colors.textSecondary },
                  isSelected && styles.categoryTabTextActive,
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* 5. TAB VIEW: Breathwork Library */}
      {activeTab === 'breathwork' && (
        <View style={styles.tabContentContainer}>
          <View style={[styles.sectionTitleRow, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
                Respiratory Techniques
              </Text>
              <Text style={[styles.sectionSubheading, { color: colors.textTertiary }]}>
                Clinically formulated breath patterns
              </Text>
            </View>
            <BreathworkIllustration width={76} height={62} />
          </View>

          <View style={styles.techniquesList}>
            {Object.values(PRESETS).map((item) => (
              <Pressable
                key={item.id}
                onPress={() => navigation.navigate('BreathingSession', { preset: item.id })}
                style={({ pressed }) => [
                  styles.techniqueCard,
                  {
                    backgroundColor: colors.bgCard,
                    borderColor: colors.borderLight,
                    opacity: pressed ? 0.88 : 1,
                    transform: [{ scale: pressed ? 0.99 : 1 }],
                  },
                ]}
              >
                <View style={styles.techniqueRow}>
                  {/* Left Icon Orb */}
                  <View style={[styles.techniqueIconOrb, { backgroundColor: colors.accentBg }]}>
                    <AppIcon name={item.icon} size={26} loop />
                  </View>

                  {/* Main Content Column */}
                  <View style={styles.techniqueInfo}>
                    <View style={styles.techniqueHeader}>
                      <Text style={[styles.techniqueTitle, { color: colors.textPrimary }]}>
                        {item.title}
                      </Text>
                      <View style={[styles.timeBadge, { backgroundColor: colors.accentPrimary + '15' }]}>
                        <Ionicons name="time-outline" size={12} color={colors.accentPrimary} />
                        <Text style={[styles.timeBadgeText, { color: colors.accentPrimary }]}>
                          {item.duration}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.techniquePillsRow}>
                      <View style={[styles.formulaPill, { backgroundColor: colors.bgSecondary ?? '#F4EFE6', borderColor: colors.borderLight }]}>
                        <Text style={[styles.formulaText, { color: colors.accentPrimary }]}>
                          {item.formula}
                        </Text>
                      </View>
                      <View style={[styles.tagPill, { backgroundColor: colors.accentPrimary + '10' }]}>
                        <Text style={[styles.tagText, { color: colors.accentPrimary }]}>
                          {item.tag}
                        </Text>
                      </View>
                    </View>

                    <Text style={[styles.techniqueDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                      {item.desc}
                    </Text>

                    <View style={styles.cardFooterRow}>
                      <Text style={[styles.cardActionLabel, { color: colors.accentPrimary }]}>
                        Start breath session
                      </Text>
                      <Ionicons name="arrow-forward" size={14} color={colors.accentPrimary} />
                    </View>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* 6. TAB VIEW: 5-4-3-2-1 Sensory Grounding */}
      {activeTab === 'grounding' && (
        <View style={styles.tabContentContainer}>
          <Card variant="elevated" style={styles.groundingHeroCard}>
            <CardContent style={styles.groundingHeroContent}>
              <View style={styles.groundingHeroTop}>
                <SensoryGroundingIllustration width={88} height={78} />
                <View style={styles.groundingHeroMeta}>
                  <Text style={[styles.groundingHeroTitle, { color: colors.textPrimary }]}>
                    5-4-3-2-1 Senses Deck
                  </Text>
                  <Text style={[styles.groundingHeroSubtitle, { color: colors.textTertiary }]}>
                    Pull attention out of spirals back into your immediate environment
                  </Text>
                </View>
              </View>

              <View style={styles.sensesStepsList}>
                {[
                  { count: '5', label: 'Things you can see', example: 'A shadow on the wall, a book spine, a leaf outside', icon: 'l-eye' },
                  { count: '4', label: 'Things you can feel', example: 'The fabric on your lap, feet against floor, cool air', icon: 'l-hands' },
                  { count: '3', label: 'Things you can hear', example: 'Distant hum of traffic, a clock ticking, your breath', icon: 'l-sound' },
                  { count: '2', label: 'Things you can smell', example: 'Fresh laundry, coffee aroma, fresh rain air', icon: 'l-calm' },
                  { count: '1', label: 'Thing you can taste', example: 'A sip of cold water, lingering mint, or gratitude', icon: 'l-heart' },
                ].map((step) => (
                  <View
                    key={step.count}
                    style={[styles.senseStepRow, { backgroundColor: colors.bgSecondary ?? '#F4EFE6', borderColor: colors.borderLight }]}
                  >
                    <View style={[styles.stepNumberBadge, { backgroundColor: colors.accentPrimary, marginTop: 2 }]}>
                      <Text style={styles.stepNumberText}>{step.count}</Text>
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={[styles.stepLabel, { color: colors.textPrimary }]}>{step.label}</Text>
                      <Text style={[styles.stepExample, { color: colors.textTertiary }]}>{step.example}</Text>
                    </View>
                    <AppIcon name={step.icon} size={22} loop style={{ marginTop: 2 }} />
                  </View>
                ))}
              </View>

              <PrimaryButton
                title="Start Guided 5-4-3-2-1 Session"
                variant="primary"
                size="md"
                onPress={() => navigation.navigate('GroundingExercise', { type: '5-4-3-2-1' })}
                leftIcon={<Ionicons name="compass" size={20} color="#FFFFFF" />}
              />
            </CardContent>
          </Card>
        </View>
      )}

      {/* 7. TAB VIEW: Somatic Body Scan & Tension Release */}
      {activeTab === 'bodyscan' && (
        <View style={styles.tabContentContainer}>
          <Card variant="elevated" style={styles.bodyScanCard}>
            <CardContent style={styles.bodyScanContent}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={[styles.bodyScanTitle, { color: colors.textPrimary }]}>
                    Muscle Tension Reliever
                  </Text>
                  <Text style={[styles.bodyScanSubtitle, { color: colors.textTertiary, marginTop: 4 }]}>
                    Tap any anatomy zone to release held stress
                  </Text>
                </View>
                <BodyScanIllustration width={88} height={78} />
              </View>

              {/* Anatomy Zones Row */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.zonesScroll}>
                {BODY_ZONES.map((zone) => {
                  const isZoneActive = selectedZone === zone.id;
                  return (
                    <Pressable
                      key={zone.id}
                      onPress={() => setSelectedZone(zone.id)}
                      style={[
                        styles.zonePill,
                        {
                          backgroundColor: isZoneActive ? colors.accentPrimary : colors.bgPrimary,
                          borderColor: isZoneActive ? colors.accentPrimary : colors.borderLight,
                        },
                      ]}
                    >
                      <AppIcon
                        name={zone.icon}
                        size={18}
                        color={isZoneActive ? '#FFFFFF' : colors.accentPrimary}
                      />
                      <Text
                        style={[
                          styles.zonePillText,
                          { color: isZoneActive ? '#FFFFFF' : colors.textPrimary },
                        ]}
                      >
                        {zone.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Selected Zone Focus Box */}
              <View style={[styles.zoneGuidanceBox, { backgroundColor: colors.accentBg, borderColor: colors.accentBorder }]}>
                <View style={styles.zoneGuidanceHeader}>
                  <View style={[styles.zoneIconOrb, { backgroundColor: colors.bgCard }]}>
                    <AppIcon name={activeZoneData.icon} size={26} loop />
                  </View>
                  <Text style={[styles.zoneGuidanceTitle, { color: colors.accentPrimary }]}>
                    {activeZoneData.name} Release
                  </Text>
                </View>
                <Text style={[styles.zoneGuidanceCue, { color: colors.textPrimary }]}>
                  {activeZoneData.cue}
                </Text>
              </View>

              <PrimaryButton
                title="Start Full 8-Minute Body Scan"
                variant="primary"
                size="md"
                onPress={() => navigation.navigate('GroundingExercise', { type: 'body-scan' })}
                leftIcon={<Ionicons name="body" size={20} color="#FFFFFF" />}
              />
            </CardContent>
          </Card>
        </View>
      )}

      {/* 8. TAB VIEW: Panic & Acute Anxiety SOS Aid */}
      {activeTab === 'panic' && (
        <View style={styles.tabContentContainer}>
          <Card variant="elevated" style={[styles.panicCard, { borderColor: (colors.accentRose || '#EB697F') + '60' }]}>
            <CardContent style={styles.panicContent}>
              <View style={styles.panicHeaderRow}>
                <PanicAnchorIllustration width={88} height={78} />
                <View style={styles.panicTitleContainer}>
                  <Text style={[styles.panicTitle, { color: colors.textPrimary }]}>
                    Acute Stress & Panic Anchor
                  </Text>
                  <Text style={[styles.panicSub, { color: colors.textTertiary }]}>
                    You are biologically safe. This surge will pass.
                  </Text>
                </View>
              </View>

              <View style={styles.panicPointsList}>
                <View style={[styles.panicPointCard, { backgroundColor: colors.bgSecondary ?? '#F4EFE6', borderColor: colors.borderLight }]}>
                  <Text style={[styles.panicPointNum, { color: colors.accentRose || '#EB697F', marginTop: 1 }]}>1</Text>
                  <View style={styles.panicPointTextWrapper}>
                    <Text style={[styles.panicPointTitle, { color: colors.textPrimary }]}>
                      Double Inhale Physiological Sigh
                    </Text>
                    <Text style={[styles.panicPointDesc, { color: colors.textTertiary }]}>
                      Take two deep inhales through your nose back-to-back, then one long slow audible exhale through mouth.
                    </Text>
                  </View>
                </View>

                <View style={[styles.panicPointCard, { backgroundColor: colors.bgSecondary ?? '#F4EFE6', borderColor: colors.borderLight }]}>
                  <Text style={[styles.panicPointNum, { color: colors.accentRose || '#EB697F', marginTop: 1 }]}>2</Text>
                  <View style={styles.panicPointTextWrapper}>
                    <Text style={[styles.panicPointTitle, { color: colors.textPrimary }]}>
                      Cold Temperature Shock
                    </Text>
                    <Text style={[styles.panicPointDesc, { color: colors.textTertiary }]}>
                      Splash cold water on your forehead and cheeks or hold an ice cube to activate the mammalian dive reflex.
                    </Text>
                  </View>
                </View>

                <View style={[styles.panicPointCard, { backgroundColor: colors.bgSecondary ?? '#F4EFE6', borderColor: colors.borderLight }]}>
                  <Text style={[styles.panicPointNum, { color: colors.accentRose || '#EB697F', marginTop: 1 }]}>3</Text>
                  <View style={styles.panicPointTextWrapper}>
                    <Text style={[styles.panicPointTitle, { color: colors.textPrimary }]}>
                      Feet on Floor Gravity Anchor
                    </Text>
                    <Text style={[styles.panicPointDesc, { color: colors.textTertiary }]}>
                      Press both bare soles firmly into the ground. Feel the solid mass holding you up without tipping.
                    </Text>
                  </View>
                </View>
              </View>

              <PrimaryButton
                title="Begin Emergency 60s Breath Reset"
                variant="primary"
                size="md"
                onPress={() => navigation.navigate('BreathingSession', { preset: '4-7-8', duration: 60 })}
                leftIcon={<Ionicons name="heart" size={20} color="#FFFFFF" />}
              />
            </CardContent>
          </Card>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 110,
    gap: 18,
  },
  header: {
    marginBottom: 2,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTextCol: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  liveAuraBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  liveText: {
    fontSize: 12,
    fontWeight: '700',
  },
  orbCard: {
    borderRadius: 28,
  },
  orbCardContent: {
    padding: 22,
    alignItems: 'center',
    gap: 18,
  },
  orbHeroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  patternBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 9999,
  },
  patternBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
  },
  expandButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  mandalaContainer: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  haloRing: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
  },
  resonanceRing: {
    position: 'absolute',
    width: 195,
    height: 195,
    borderRadius: 98,
    borderWidth: 1,
  },
  centralOrb: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  orbTouchable: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  phaseLabel: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 6,
    letterSpacing: -0.2,
  },
  phaseTimer: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  presetButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  presetChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  soundCard: {
    borderRadius: 22,
  },
  soundCardContent: {
    padding: 18,
    gap: 14,
  },
  soundHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  soundTitleContainer: {
    flex: 1,
  },
  soundSectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  soundSectionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  equalizerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 28,
  },
  eqBar: {
    width: 3.5,
    borderRadius: 2,
  },
  soundGrid: {
    width: '100%',
    gap: 12,
  },
  soundGridRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
  },
  soundTile: {
    flex: 1,
    minHeight: 110,
    padding: 13,
    borderRadius: 18,
    borderWidth: 1.5,
    justifyContent: 'space-between',
  },
  soundTileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  soundIconOrb: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soundLiveBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soundTileBottomCol: {
    width: '100%',
    gap: 3,
    marginTop: 10,
  },
  soundItemTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  soundItemSubtitle: {
    fontSize: 11,
    fontWeight: '500',
  },
  soundFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 4,
    borderTopWidth: 1,
  },
  timerLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timerLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  timerPills: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  timerChip: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 11,
    fontWeight: '700',
  },
  categoryTabs: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    padding: 4,
    gap: 6,
  },
  categoryTabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTabActive: {
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  categoryTabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  categoryTabTextActive: {
    fontWeight: '700',
  },
  tabContentContainer: {
    gap: 14,
  },
  sectionTitleRow: {
    marginBottom: 2,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sectionSubheading: {
    fontSize: 12,
    marginTop: 2,
  },
  techniquesList: {
    gap: 12,
  },
  techniqueCard: {
    width: '100%',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  techniqueRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  techniqueIconOrb: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  techniqueInfo: {
    flex: 1,
    gap: 8,
  },
  techniqueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  techniqueTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
    flex: 1,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  timeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  techniquePillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  formulaPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  formulaText: {
    fontSize: 11,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  tagPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  techniqueDesc: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  cardActionLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  groundingHeroCard: {
    borderRadius: 24,
  },
  groundingHeroContent: {
    padding: 20,
    gap: 16,
  },
  groundingHeroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  heroGroundingIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groundingHeroMeta: {
    flex: 1,
    gap: 4,
  },
  groundingHeroTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  groundingHeroSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  sensesStepsList: {
    gap: 10,
  },
  senseStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  stepNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  stepContent: {
    flex: 1,
  },
  stepLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  stepExample: {
    fontSize: 11,
    marginTop: 2,
  },
  bodyScanCard: {
    borderRadius: 24,
  },
  bodyScanContent: {
    padding: 20,
    gap: 16,
  },
  bodyScanTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  bodyScanSubtitle: {
    fontSize: 12,
  },
  zonesScroll: {
    gap: 8,
  },
  zonePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  zonePillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  zoneGuidanceBox: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
  },
  zoneGuidanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  zoneIconOrb: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoneGuidanceTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  zoneGuidanceCue: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },
  panicCard: {
    borderRadius: 24,
    borderWidth: 1.5,
  },
  panicContent: {
    padding: 20,
    gap: 16,
  },
  panicHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  panicIconOrb: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panicTitleContainer: {
    flex: 1,
    gap: 4,
  },
  panicTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  panicSub: {
    fontSize: 12,
    lineHeight: 16,
  },
  panicPointsList: {
    gap: 10,
  },
  panicPointCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  panicPointNum: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
  },
  panicPointTextWrapper: {
    flex: 1,
    gap: 2,
  },
  panicPointTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  panicPointDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
});