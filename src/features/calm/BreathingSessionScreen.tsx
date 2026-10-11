import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useNavigation, useRoute, NavigationProp, RouteProp } from '@react-navigation/native';
import { PrimaryButton, ProgressRing } from '../../components';
import { RootStackParamList, BreathingPreset } from '../../types/navigation';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { useThemeColors } from '../../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const presetPatterns: Record<BreathingPreset, { inhale: number; hold: number; exhale: number; holdExhale: number }> = {
  box: { inhale: 4, hold: 4, exhale: 4, holdExhale: 4 },
  '4-6': { inhale: 4, hold: 0, exhale: 6, holdExhale: 0 },
  '4-7-8': { inhale: 4, hold: 7, exhale: 8, holdExhale: 0 },
  deep: { inhale: 6, hold: 2, exhale: 8, holdExhale: 0 },
  slow: { inhale: 5, hold: 0, exhale: 5, holdExhale: 0 },
  relaxation: { inhale: 4, hold: 6, exhale: 8, holdExhale: 0 },
};

const presetLabels: Record<BreathingPreset, string> = {
  box: 'Box Breathing',
  '4-6': '4-6 Breathing',
  '4-7-8': '4-7-8 Technique',
  deep: 'Deep Breathing',
  slow: 'Slow Breathing',
  relaxation: 'Relaxation Flow',
};

type Phase = 'inhale' | 'hold' | 'exhale' | 'holdExhale' | 'complete';

export function BreathingSessionScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'BreathingSession'>>();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { preset = 'box', duration = 60 } = (route?.params ?? {}) as { preset?: BreathingPreset; duration?: number };
  const safePreset: BreathingPreset = (preset && presetPatterns[preset] ? preset : 'box');
  const pattern = presetPatterns[safePreset] ?? presetPatterns.box;
  const safeDuration = typeof duration === 'number' && Number.isFinite(duration) && duration > 0 ? duration : 60;
  const safeInhale = pattern?.inhale ?? 0;
  const safeHold = pattern?.hold ?? 0;
  const safeExhale = pattern?.exhale ?? 0;
  const safeHoldExhale = pattern?.holdExhale ?? 0;
  const totalCycleTime = safeInhale + safeHold + safeExhale + safeHoldExhale;
  const totalCycles = totalCycleTime > 0 ? Math.max(1, Math.floor((safeDuration * 60) / totalCycleTime)) : 1;

  let themeColors: ReturnType<typeof useThemeColors> | undefined;
  try {
    themeColors = useThemeColors();
  } catch {
    themeColors = undefined;
  }
  const colors = themeColors ?? {
    bgPrimary: '#FBF9F5',
    bgCard: '#FFFFFF',
    borderLight: '#E6E0D4',
    textPrimary: '#1A212D',
    textSecondary: '#384455',
    textTertiary: '#607085',
    accentPrimary: '#3E7B52',
    accentBg: '#EDF5EF',
    accentBorder: '#C2DCBF',
    isDark: false,
  } as any;

  const [phase, setPhase] = useState<Phase>('inhale');
  const [cycle, setCycle] = useState(0);
  const [timeLeft, setTimeLeft] = useState(safeInhale > 0 ? safeInhale : 4);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedCircleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const phaseConfig = {
    inhale: { label: 'Breathe in', color: colors.accentPrimary, duration: safeInhale, scale: 1.18 },
    hold: { label: 'Hold breath', color: '#2563EB', duration: safeHold, scale: 1.18 },
    exhale: { label: 'Release slowly', color: '#6C5CE7', duration: safeExhale, scale: 0.84 },
    holdExhale: { label: 'Rest', color: '#D96547', duration: safeHoldExhale, scale: 0.84 },
    complete: { label: 'Session complete', color: colors.accentPrimary, duration: 0, scale: 1 },
  };

  const currentConfig = phaseConfig[phase] ?? phaseConfig.inhale;

  useEffect(() => {
    if (!isRunning || isComplete) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          nextPhase();
          return getNextPhaseDuration();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, isComplete, phase]);

  const getNextPhaseDuration = () => {
    const phases: Phase[] = ['inhale', 'hold', 'exhale', 'holdExhale'];
    const currentIndex = phases.indexOf(phase);
    const safeIndex = currentIndex >= 0 ? currentIndex : 0;
    const nextIndex = (safeIndex + 1) % phases.length;
    const nextPhase = phases[nextIndex] ?? 'inhale';
    return phaseConfig[nextPhase]?.duration ?? 0;
  };

  const nextPhase = () => {
    const phases: Phase[] = ['inhale', 'hold', 'exhale', 'holdExhale'];
    const currentIndex = phases.indexOf(phase);
    const safeIndex = currentIndex >= 0 ? currentIndex : 0;
    const nextIndex = (safeIndex + 1) % phases.length;
    const next = phases[nextIndex] ?? 'inhale';

    if (nextIndex === 0) {
      setCycle((prev) => {
        const next = prev + 1;
        if (next >= totalCycles) {
          setIsComplete(true);
          setIsRunning(false);
          return prev;
        }
        return next;
      });
    }

    if (!isComplete) {
      setPhase(next);
      animatePhaseTransition(next);
    }
  };

  const animatePhaseTransition = (nextPhase: Phase) => {
    const nextConfig = phaseConfig[nextPhase] ?? phaseConfig.inhale;
    const safeScale = nextConfig?.scale ?? 1;
    scale.value = withTiming(safeScale, { duration: 600, easing: Easing.out(Easing.quad) });
    opacity.value = withTiming(0.4, { duration: 200 }, () => {
      opacity.value = withTiming(1, { duration: 400 });
    });
  };

  const toggleSession = () => {
    if (isComplete) {
      navigation.goBack();
      return;
    }
    setIsRunning(!isRunning);
    if (!isRunning) {
      animatePhaseTransition(phase);
    }
  };

  const resetSession = () => {
    setPhase('inhale');
    setCycle(0);
    setTimeLeft(safeInhale > 0 ? safeInhale : 4);
    setIsRunning(false);
    setIsComplete(false);
    scale.value = 1;
    opacity.value = 1;
  };

  const safeTotalCycles = totalCycles > 0 ? totalCycles : 1;
  const safeCurrentDuration = currentConfig?.duration && currentConfig.duration > 0 ? currentConfig.duration : 1;
  const safeProgress = isComplete ? 1 : (cycle + (1 - timeLeft / safeCurrentDuration)) / safeTotalCycles;
  const progress = Number.isFinite(safeProgress) ? Math.max(0, Math.min(1, safeProgress)) : 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      {/* Top Bar */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable
          onPress={() => navigation?.goBack?.()}
          style={({ pressed }) => [
            {
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.bgCard,
              borderWidth: 1,
              borderColor: colors.borderLight,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary }}>
          {presetLabels[safePreset] ?? 'Breathing'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Breathing Circle Area */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 }}>
        <Animated.View style={animatedCircleStyle}>
          <Svg width={260} height={260}>
            <Circle
              cx={130}
              cy={130}
              r={110}
              fill="none"
              stroke={colors.borderLight}
              strokeWidth={8}
            />
            <Circle
              cx={130}
              cy={130}
              r={110}
              fill="none"
              stroke={currentConfig?.color ?? colors.accentPrimary}
              strokeWidth={8}
              strokeDasharray={2 * Math.PI * 110}
              strokeDashoffset={2 * Math.PI * 110 * (1 - Math.min(1, progress ?? 0))}
              strokeLinecap="round"
              transform="rotate(-90 130 130)"
            />
          </Svg>
        </Animated.View>

        <View style={{ marginTop: 28, alignItems: 'center' }}>
          <Text style={{ fontSize: 22, fontWeight: '800', textAlign: 'center', color: currentConfig?.color ?? colors.accentPrimary }}>
            {currentConfig?.label ?? 'Breathe'}
          </Text>
          <Text style={{ fontSize: 44, fontWeight: '800', marginTop: 4, color: colors.textPrimary, letterSpacing: -1 }}>
            {(Number.isFinite(timeLeft) ? timeLeft : 0)}s
          </Text>
          {!isComplete && (
            <Text style={{ fontSize: 14, color: colors.textTertiary, marginTop: 4 }}>
              Cycle {Math.min(cycle + 1, safeTotalCycles)} of {safeTotalCycles}
            </Text>
          )}
        </View>
      </View>

      {/* Bottom Controls */}
      <View style={{ paddingHorizontal: 24, paddingBottom: 40, alignItems: 'center' }}>
        <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 12 }}>
          <PrimaryButton
            title={isRunning ? 'Pause' : isComplete ? 'Complete' : 'Start'}
            variant="primary"
            size="lg"
            onPress={toggleSession}
            style={{ flex: 1, maxWidth: 170 }}
            fullWidth={false}
          />
          {!isComplete && (
            <PrimaryButton
              title="Reset"
              variant="outline"
              size="lg"
              onPress={resetSession}
              style={{ flex: 1, maxWidth: 170 }}
              fullWidth={false}
            />
          )}
        </View>

        <Text style={{ fontSize: 13, color: colors.textTertiary, textAlign: 'center' }}>
          {safeDuration} min session · Stay gentle with yourself
        </Text>
      </View>
    </View>
  );
}