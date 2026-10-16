import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, View, Text } from 'react-native';
import { useNavigation, useRoute, NavigationProp, RouteProp } from '@react-navigation/native';
import { PrimaryButton, TactilePressable } from '../../components';
import { RootStackParamList, BreathingPreset } from '../../types/navigation';
import Svg, { Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  useAnimatedReaction,
  withTiming,
  withSpring,
  cancelAnimation,
  runOnJS,
  interpolate,
  Easing,
  useReducedMotion,
} from 'react-native-reanimated';
import { useThemeColors } from '../../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { calmRepository } from '../../database/repositories/calmRepository';
import { hapticFeedback } from '../../utils/haptics';
import { fontFamilies } from '../../theme/typography';
import { ScreenContainer } from '../../components/layout/ScreenContainer';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

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

type PhaseKey = 'inhale' | 'hold' | 'exhale' | 'holdExhale';

const PHASE_LABELS: Record<PhaseKey, string> = {
  inhale: 'Breathe in',
  hold: 'Hold breath',
  exhale: 'Release slowly',
  holdExhale: 'Rest',
};

// Full-lung expansion targets. Holds keep the previous breath level so the
// visual body stays still while awareness rests.
const PHASE_TARGETS: Record<PhaseKey, number> = {
  inhale: 1,
  hold: 1,
  exhale: 0.16,
  holdExhale: 0.16,
};

const REST_LEVEL = 0.16;
const ARC_RADIUS = 118;
const ARC_CIRCUMFERENCE = 2 * Math.PI * ARC_RADIUS;
// easeInOutSine — approximates the natural deceleration of a full lung
const LUNG_EASING = Easing.bezier(0.37, 0, 0.63, 1);

interface ActivePhase {
  key: PhaseKey;
  duration: number;
  target: number;
  isInhale: boolean;
}

export function BreathingSessionScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'BreathingSession'>>();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { preset = 'box', duration = 60 } = (route?.params ?? {}) as { preset?: BreathingPreset; duration?: number };
  const safePreset: BreathingPreset = preset && presetPatterns[preset] ? preset : 'box';
  const pattern = presetPatterns[safePreset] ?? presetPatterns.box;
  const safeDuration = typeof duration === 'number' && Number.isFinite(duration) && duration > 0 ? duration : 60;

  const reducedMotion = useReducedMotion();

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
    accentLavender: '#6C5CE7',
    info: '#2563EB',
    warning: '#D96547',
    isDark: false,
  } as any;

  // Phase table: zero-second stages are dropped so 4-6 breathing flows straight
  // from inhale to exhale with no dead frames.
  const activePhases: ActivePhase[] = useMemo(() => {
    const table: ActivePhase[] = [
      { key: 'inhale', duration: pattern?.inhale ?? 4, target: PHASE_TARGETS.inhale, isInhale: true },
      { key: 'hold', duration: pattern?.hold ?? 0, target: PHASE_TARGETS.hold, isInhale: false },
      { key: 'exhale', duration: pattern?.exhale ?? 4, target: PHASE_TARGETS.exhale, isInhale: false },
      { key: 'holdExhale', duration: pattern?.holdExhale ?? 0, target: PHASE_TARGETS.holdExhale, isInhale: false },
    ];
    const active = table.filter((p) => p.duration > 0);
    return active.length > 0
      ? active
      : [{ key: 'inhale', duration: 4, target: PHASE_TARGETS.inhale, isInhale: true }];
  }, [pattern?.inhale, pattern?.hold, pattern?.exhale, pattern?.holdExhale]);

  const durations = useMemo(() => activePhases.map((p) => p.duration), [activePhases]);
  const targets = useMemo(() => activePhases.map((p) => p.target), [activePhases]);
  const inhaleFlags = useMemo(() => activePhases.map((p) => p.isInhale), [activePhases]);
  const phaseKeys = useMemo(() => activePhases.map((p) => p.key), [activePhases]);
  // Prefix sums let the UI thread compute total elapsed time in O(1) per frame.
  const prefixSums = useMemo(() => {
    let acc = 0;
    return activePhases.map((p) => {
      const start = acc;
      acc += p.duration;
      return start;
    });
  }, [activePhases]);

  const cycleDuration = useMemo(() => durations.reduce((a, b) => a + b, 0), [durations]);
  const phaseCount = activePhases.length;
  const totalCycles = cycleDuration > 0 ? Math.max(1, Math.floor((safeDuration * 60) / cycleDuration)) : 1;

  const phaseColors = useMemo(() => {
    const byKey: Record<PhaseKey, string> = {
      inhale: colors.accentPrimary,
      hold: colors.info ?? '#2563EB',
      exhale: colors.accentLavender ?? '#6C5CE7',
      holdExhale: colors.warning ?? '#D96547',
    };
    return phaseKeys.map((k) => byKey[k]);
  }, [phaseKeys, colors.accentPrimary, colors.info, colors.accentLavender, colors.warning]);

  // --- UI-thread session state -------------------------------------------------
  // The entire breathing clock lives on the UI thread: no JS interval, no
  // setState-driven frame pacing. JS state is only mirrored once per phase
  // transition and once per visible second, purely for text display.
  const clock = useSharedValue(0); // linear 0..1 within the current phase
  const breathLevel = useSharedValue(REST_LEVEL); // 0..1 somatic expansion
  const ripple = useSharedValue(1); // expanding wave echo on inhale crest
  const phaseSV = useSharedValue(0);
  const cycleSV = useSharedValue(0);
  const finishedSV = useSharedValue(0);
  const runningSV = useSharedValue(0);

  const [phaseIdx, setPhaseIdx] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [timeLeft, setTimeLeft] = useState(durations[0] ?? 4);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const lastAnnouncedPhaseRef = useRef(0);
  const isCompleteRef = useRef(false);

  const runPhase = useCallback<(phaseIdx: number, remaining: number) => void>(
    (index: number, remaining: number) => {
      'worklet';
      const durSec = durations[index] ?? 4;
      const durMs = Math.max(160, Math.round(durSec * 1000 * Math.max(0.02, remaining)));
      const target = targets[index] ?? 1;

      if (reducedMotion) {
        breathLevel.value = target;
      } else {
        breathLevel.value = withTiming(target, { duration: durMs, easing: LUNG_EASING });
      }

      if (inhaleFlags[index] && !reducedMotion && remaining >= 0.99) {
        ripple.value = 0;
        ripple.value = withTiming(1, { duration: 1500, easing: Easing.out(Easing.quad) });
      }

      clock.value = 1 - Math.max(0.02, remaining);
      clock.value = withTiming(1, { duration: durMs, easing: Easing.linear }, (finished) => {
        'worklet';
        if (!finished) return;

        const nextIdx = (index + 1) % phaseCount;
        const nextCycle = nextIdx === 0 ? cycleSV.value + 1 : cycleSV.value;

        if (nextCycle >= totalCycles) {
          finishedSV.value = 1;
          runningSV.value = 0;
          if (!reducedMotion) {
            breathLevel.value = withSpring(1, { damping: 14, stiffness: 80 });
          }
          return;
        }

        if (nextIdx === 0) cycleSV.value = nextCycle;
        phaseSV.value = nextIdx;
        runPhase(nextIdx, 1);
      });
    },
    [durations, targets, inhaleFlags, phaseCount, totalCycles, reducedMotion]
  );

  // Mirror the UI-thread state machine into React state (display only).
  const syncMachineState = useCallback(
    (packed: string) => {
      const [rawPhase, rawCycle, rawFinished] = packed.split('|');
      const nextPhase = parseInt(rawPhase, 10) || 0;
      const nextCycle = parseInt(rawCycle, 10) || 0;
      const finished = rawFinished === '1';

      if (finished) {
        if (!isCompleteRef.current) {
          isCompleteRef.current = true;
          setIsComplete(true);
          setIsRunning(false);
          hapticFeedback.success();
          AccessibilityInfo.announceForAccessibility?.('Session complete. Well done.');
          calmRepository
            .logSession({
              type: 'breathing',
              preset: safePreset,
              duration: safeDuration * 60,
              completed: true,
            })
            .catch(() => {});
          calmRepository
            .logBreathing({
              preset: safePreset,
              duration: safeDuration * 60,
              cyclesCompleted: totalCycles,
            })
            .catch(() => {});
        }
        return;
      }

      if (nextPhase !== lastAnnouncedPhaseRef.current) {
        lastAnnouncedPhaseRef.current = nextPhase;
        const key = phaseKeys[nextPhase] ?? 'inhale';
        if (key === 'inhale' || key === 'exhale') {
          hapticFeedback.light();
        } else {
          hapticFeedback.selection();
        }
        const label = PHASE_LABELS[key] ?? 'Breathe';
        AccessibilityInfo.announceForAccessibility?.(label);
      }

      setPhaseIdx(nextPhase);
      setCycle(nextCycle);
    },
    [phaseKeys, safePreset, safeDuration, totalCycles]
  );

  useAnimatedReaction(
    () => `${phaseSV.value}|${cycleSV.value}|${finishedSV.value}`,
    (packed, previous) => {
      if (packed !== previous) {
        runOnJS(syncMachineState)(packed);
      }
    }
  );

  // One React re-render per visible second — everything in between is UI thread.
  useAnimatedReaction(
    () => {
      if (finishedSV.value === 1) return 0;
      const dur = durations[phaseSV.value] ?? 0;
      return Math.max(0, Math.ceil((1 - clock.value) * dur));
    },
    (seconds, previous) => {
      if (seconds !== previous) {
        runOnJS(setTimeLeft)(seconds);
      }
    }
  );

  // Stop any in-flight animation if the screen unmounts mid-session.
  useEffect(() => {
    return () => {
      cancelAnimation(clock);
      cancelAnimation(breathLevel);
      cancelAnimation(ripple);
    };
  }, [clock, breathLevel, ripple]);

  const toggleSession = useCallback(() => {
    if (isComplete) {
      navigation?.goBack?.();
      return;
    }

    if (isRunning) {
      cancelAnimation(clock);
      cancelAnimation(breathLevel);
      runningSV.value = 0;
      setIsRunning(false);
      hapticFeedback.light();
      return;
    }

    const remaining = 1 - Math.min(Math.max(clock.value, 0), 1);
    runningSV.value = 1;
    setIsRunning(true);
    hapticFeedback.medium();
    runPhase(phaseSV.value, remaining <= 0.02 ? 1 : remaining);
  }, [isComplete, isRunning, navigation, runPhase, clock, breathLevel, runningSV, phaseSV]);

  const resetSession = useCallback(() => {
    cancelAnimation(clock);
    cancelAnimation(breathLevel);
    cancelAnimation(ripple);

    clock.value = 0;
    breathLevel.value = REST_LEVEL;
    ripple.value = 1;
    phaseSV.value = 0;
    cycleSV.value = 0;
    finishedSV.value = 0;
    runningSV.value = 0;

    isCompleteRef.current = false;
    setPhaseIdx(0);
    setCycle(0);
    setTimeLeft(durations[0] ?? 4);
    setIsRunning(false);
    setIsComplete(false);
  }, [clock, breathLevel, ripple, phaseSV, cycleSV, finishedSV, runningSV, durations]);

  // --- UI-thread visual mappings ----------------------------------------------
  const innerOrbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(breathLevel.value, [0, 1], [0.82, 1.26]) }],
  }));

  const middleRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(breathLevel.value, [0, 1], [0.88, 1.46]) }],
    opacity: interpolate(breathLevel.value, [0, 1], [0.12, 0.34]),
  }));

  const outerAuraStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(breathLevel.value, [0, 1], [0.92, 1.3]) }],
    opacity: interpolate(breathLevel.value, [0, 1], [0.06, 0.14]),
  }));

  const rippleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(ripple.value, [0, 1], [0.86, 1.55]) }],
    opacity: interpolate(ripple.value, [0, 0.35, 1], [0, 0.22, 0]),
  }));

  // The progress arc updates every frame straight from the shared clock —
  // previously it only moved once per second with the JS interval.
  const arcAnimatedProps = useAnimatedProps(() => {
    const idx = phaseSV.value;
    const phaseDur = durations[idx] ?? 0;
    const elapsedInPhase = (prefixSums[idx] ?? 0) + clock.value * phaseDur;
    const completedCycles = finishedSV.value === 1 ? totalCycles : cycleSV.value;
    const elapsed = completedCycles * cycleDuration + elapsedInPhase;
    const total = Math.max(1, totalCycles * cycleDuration);
    const progress = Math.max(0, Math.min(1, elapsed / total));
    return {
      strokeDashoffset: ARC_CIRCUMFERENCE * (1 - progress),
    };
  });

  const safeTotalCycles = totalCycles > 0 ? totalCycles : 1;
  const currentPhaseKey = phaseKeys[phaseIdx] ?? 'inhale';
  const currentLabel = isComplete ? 'Session complete' : PHASE_LABELS[currentPhaseKey] ?? 'Breathe in';
  const currentColor = isComplete ? colors.accentPrimary : phaseColors[phaseIdx] ?? colors.accentPrimary;

  return (
    <ScreenContainer scroll={false} backgroundColor={colors.bgPrimary}>
      {/* Top Header */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 10,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <TactilePressable
          onPress={() => navigation?.goBack?.()}
          scaleDownTo={0.9}
          hapticStyle="light"
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: colors.bgCard,
            borderWidth: 1,
            borderColor: colors.borderLight,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TactilePressable>

        <Text
          style={{
            fontFamily: fontFamilies.sans.bold,
            fontSize: 17,
            fontWeight: '700',
            color: colors.textPrimary,
          }}
        >
          {presetLabels[safePreset] ?? 'Breathing'}
        </Text>

        <View style={{ width: 42 }} />
      </View>

      {/* Somatic Multi-Layer Breathing Orb */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 }}>
        <View style={{ width: 280, height: 280, alignItems: 'center', justifyContent: 'center' }}>
          {/* Outer Ambient Glow */}
          <Animated.View
            style={[
              {
                position: 'absolute',
                width: 250,
                height: 250,
                borderRadius: 125,
                backgroundColor: currentColor,
              },
              outerAuraStyle,
            ]}
          />

          {/* Expanding wave echo on each inhale crest */}
          <Animated.View
            style={[
              {
                position: 'absolute',
                width: 210,
                height: 210,
                borderRadius: 105,
                borderWidth: 1.5,
                borderColor: currentColor,
              },
              rippleStyle,
            ]}
          />

          {/* Middle Wave Ring */}
          <Animated.View
            style={[
              {
                position: 'absolute',
                width: 210,
                height: 210,
                borderRadius: 105,
                borderWidth: 2,
                borderColor: currentColor,
              },
              middleRingStyle,
            ]}
          />

          {/* Inner Breathing Core with soft gradient depth */}
          <Animated.View
            style={[
              {
                position: 'absolute',
                width: 170,
                height: 170,
                borderRadius: 85,
                borderWidth: 1.5,
                borderColor: currentColor + '40',
                overflow: 'hidden',
                alignItems: 'center',
                justifyContent: 'center',
              },
              innerOrbStyle,
            ]}
          >
            <LinearGradient
              colors={[currentColor + (colors.isDark ? '38' : '22'), currentColor + (colors.isDark ? '14' : '08')]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            />
            <Ionicons name="leaf-outline" size={32} color={currentColor} />
          </Animated.View>

          {/* SVG Progress Arc — animated on the UI thread at display refresh rate */}
          <Svg width={270} height={270} style={{ position: 'absolute' }}>
            <Circle
              cx={135}
              cy={135}
              r={ARC_RADIUS}
              fill="none"
              stroke={colors.borderLight}
              strokeWidth={5}
              opacity={0.6}
            />
            <AnimatedCircle
              cx={135}
              cy={135}
              r={ARC_RADIUS}
              fill="none"
              stroke={currentColor}
              strokeWidth={6}
              strokeDasharray={ARC_CIRCUMFERENCE}
              strokeDashoffset={ARC_CIRCUMFERENCE}
              strokeLinecap="round"
              transform="rotate(-90 135 135)"
              animatedProps={arcAnimatedProps}
            />
          </Svg>
        </View>

        {/* Phase instruction and countdown — refreshed once per second, not per frame */}
        <View style={{ marginTop: 32, alignItems: 'center' }}>
          <Text
            accessibilityLiveRegion="polite"
            style={{
              fontFamily: fontFamilies.serif.bold,
              fontSize: 26,
              fontWeight: '700',
              textAlign: 'center',
              color: currentColor,
            }}
          >
            {currentLabel}
          </Text>
          <Text
            style={{
              fontFamily: fontFamilies.sans.bold,
              fontSize: 48,
              fontWeight: '800',
              marginTop: 6,
              color: colors.textPrimary,
              letterSpacing: -1.5,
              fontVariant: ['tabular-nums'],
            }}
          >
            {isComplete ? '✓' : `${Number.isFinite(timeLeft) ? timeLeft : 0}s`}
          </Text>
          {!isComplete && (
            <Text
              style={{
                fontFamily: fontFamilies.sans.medium,
                fontSize: 14,
                color: colors.textTertiary,
                marginTop: 6,
              }}
            >
              Cycle {Math.min(cycle + 1, safeTotalCycles)} of {safeTotalCycles}
            </Text>
          )}
        </View>
      </View>

      {/* Bottom Controls */}
      <View style={{ paddingHorizontal: 24, paddingBottom: 44, alignItems: 'center' }}>
        <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 12 }}>
          <PrimaryButton
            title={isComplete ? 'Complete' : isRunning ? 'Pause' : 'Start'}
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
          {safeDuration} min session · Mindful presence
        </Text>
      </View>
    </ScreenContainer>
  );
}
