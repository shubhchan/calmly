import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, View } from 'react-native';
import { useNavigation, useRoute, NavigationProp, RouteProp } from '@react-navigation/native';
import { AppText, Button, TactilePressable } from '../../components';
import { RootStackParamList, BreathingPreset } from '../../types/navigation';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedReaction,
  withTiming,
  cancelAnimation,
  runOnJS,
  Easing,
  useReducedMotion,
} from 'react-native-reanimated';
import { useAppTheme } from '../../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { calmRepository } from '../../database/repositories/calmRepository';
import { hapticFeedback } from '../../utils/haptics';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  box: 'Box breathing',
  '4-6': '4-6 breathing',
  '4-7-8': '4-7-8 breathing',
  deep: 'Deep breathing',
  slow: 'Slow breathing',
  relaxation: 'Relaxation flow',
};

type PhaseKey = 'inhale' | 'hold' | 'exhale' | 'holdExhale';

const PHASE_LABELS: Record<PhaseKey, string> = {
  inhale: 'Breathe in',
  hold: 'Hold',
  exhale: 'Breathe out',
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
const RING_SIZE = 286;
const RING_CENTER = RING_SIZE / 2;
const ARC_RADIUS = 126;
const ARC_CIRCUMFERENCE = 2 * Math.PI * ARC_RADIUS;
// easeInOutSine — approximates the natural deceleration of a full lung
const LUNG_EASING = Easing.bezier(0.37, 0, 0.63, 1);

interface ActivePhase {
  key: PhaseKey;
  duration: number;
  target: number;
  isInhale: boolean;
}

function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.ceil(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Breathing — direction B, "Guided arc".
 *
 * One thin ring, one word, one number. The arc closes as the session
 * progresses and a single marker sits at its head. Nothing else moves.
 */
export function BreathingSessionScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'BreathingSession'>>();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { preset = 'box', duration = 60 } = (route?.params ?? {}) as { preset?: BreathingPreset; duration?: number };
  const safePreset: BreathingPreset = preset && presetPatterns[preset] ? preset : 'box';
  const pattern = presetPatterns[safePreset] ?? presetPatterns.box;
  const safeDuration = typeof duration === 'number' && Number.isFinite(duration) && duration > 0 ? duration : 60;

  const reducedMotion = useReducedMotion();

  const { colors } = useAppTheme();

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

  // --- UI-thread session state -------------------------------------------------
  const clock = useSharedValue(0); // linear 0..1 within the current phase
  const breathLevel = useSharedValue(REST_LEVEL); // 0..1 somatic expansion
  const phaseSV = useSharedValue(0);
  const cycleSV = useSharedValue(0);
  const finishedSV = useSharedValue(0);
  const runningSV = useSharedValue(0);
  const stepTrigger = useSharedValue(0);
  const remainingSV = useSharedValue(1);

  const [phaseIdx, setPhaseIdx] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [timeLeft, setTimeLeft] = useState(durations[0] ?? 4);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const lastAnnouncedPhaseRef = useRef(0);
  const isCompleteRef = useRef(false);

  // Reactive UI-thread phase driver: triggered by stepTrigger to avoid recursive worklet TDZ
  useAnimatedReaction(
    () => stepTrigger.value,
    (trigger, previous) => {
      'worklet';
      if (trigger === previous || trigger === 0 || runningSV.value !== 1) {
        return;
      }

      const index = phaseSV.value;
      const remaining = remainingSV.value;
      remainingSV.value = 1;

      const durSec = durations[index] ?? 4;
      const durMs = Math.max(160, Math.round(durSec * 1000 * Math.max(0.02, remaining)));
      const target = targets[index] ?? 1;

      if (reducedMotion) {
        breathLevel.value = target;
      } else {
        breathLevel.value = withTiming(target, { duration: durMs, easing: LUNG_EASING });
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
          return;
        }

        if (nextIdx === 0) cycleSV.value = nextCycle;
        phaseSV.value = nextIdx;
        stepTrigger.value = stepTrigger.value + 1;
      });
    },
    [durations, targets, phaseCount, totalCycles, reducedMotion]
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
    };
  }, [clock, breathLevel]);

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
    remainingSV.value = remaining <= 0.02 ? 1 : remaining;
    runningSV.value = 1;
    setIsRunning(true);
    hapticFeedback.medium();
    stepTrigger.value = stepTrigger.value + 1;
  }, [isComplete, isRunning, navigation, clock, breathLevel, runningSV, remainingSV, stepTrigger]);

  // --- UI-thread visual mappings ----------------------------------------------
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

  const headAnimatedProps = useAnimatedProps(() => {
    const idx = phaseSV.value;
    const phaseDur = durations[idx] ?? 0;
    const elapsedInPhase = (prefixSums[idx] ?? 0) + clock.value * phaseDur;
    const completedCycles = finishedSV.value === 1 ? totalCycles : cycleSV.value;
    const elapsed = completedCycles * cycleDuration + elapsedInPhase;
    const total = Math.max(1, totalCycles * cycleDuration);
    const progress = Math.max(0, Math.min(1, elapsed / total));
    const angle = progress * 2 * Math.PI - Math.PI / 2;
    return {
      cx: RING_CENTER + ARC_RADIUS * Math.cos(angle),
      cy: RING_CENTER + ARC_RADIUS * Math.sin(angle),
    };
  });

  const safeTotalCycles = totalCycles > 0 ? totalCycles : 1;
  const currentPhaseKey = phaseKeys[phaseIdx] ?? 'inhale';
  const currentLabel = isComplete ? 'Complete' : PHASE_LABELS[currentPhaseKey] ?? 'Breathe in';
  const phaseSeconds = isComplete ? 0 : timeLeft;

  const elapsedSeconds =
    cycle * cycleDuration + (prefixSums[phaseIdx] ?? 0) + (durations[phaseIdx] ?? 0) - timeLeft;
  const remainingSeconds = isComplete ? 0 : Math.max(0, totalCycles * cycleDuration - elapsedSeconds);

  const patternLine = activePhases
    .map((phase) =>
      phase.key === 'inhale'
        ? `in for ${phase.duration}`
        : phase.key === 'exhale'
          ? `out for ${phase.duration}`
          : `hold for ${phase.duration}`
    )
    .join(' · ');

  const markerCount = Math.min(safeTotalCycles, 6);

  return (
    <ScreenContainer scroll={false} animate={false} backgroundColor={colors.background.default}>
      <View style={{ flex: 1, paddingHorizontal: 24 }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 8,
            height: 44,
          }}
        >
          <TactilePressable
            onPress={() => navigation?.goBack?.()}
            scaleDownTo={0.92}
            accessibilityRole="button"
            accessibilityLabel="Close session"
            style={{
              width: 38,
              height: 38,
              borderRadius: 13,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.surface.default,
            }}
          >
            <Ionicons name="close" size={18} color={colors.primary.default} />
          </TactilePressable>
          <AppText variant="caption" tone="tertiary">
            {presetLabels[safePreset] ?? 'Breathing'}
          </AppText>
          <AppText variant="label" tone="link" style={{ width: 38, textAlign: 'right' }}>
            {formatClock(remainingSeconds)}
          </AppText>
        </View>

        {/* Ring */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: -20 }}>
          <View style={{ width: RING_SIZE, height: RING_SIZE }}>
            <Svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
              <Circle
                cx={RING_CENTER}
                cy={RING_CENTER}
                r={ARC_RADIUS}
                fill="none"
                stroke={colors.border.default}
                strokeWidth={2}
              />
              <AnimatedCircle
                cx={RING_CENTER}
                cy={RING_CENTER}
                r={ARC_RADIUS}
                fill="none"
                stroke={colors.primary.default}
                strokeWidth={4}
                strokeDasharray={ARC_CIRCUMFERENCE}
                strokeDashoffset={ARC_CIRCUMFERENCE}
                strokeLinecap="round"
                transform={`rotate(-90 ${RING_CENTER} ${RING_CENTER})`}
                animatedProps={arcAnimatedProps}
              />
              <AnimatedCircle
                cx={RING_CENTER}
                cy={RING_CENTER - ARC_RADIUS}
                r={6}
                fill={colors.primary.default}
                animatedProps={headAnimatedProps}
              />
            </Svg>

            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AppText variant="overline" tone="tertiary" accessibilityLiveRegion="polite">
                {currentLabel}
              </AppText>
              <AppText
                variant="display"
                style={{ fontSize: 64, lineHeight: 68, marginTop: 4, fontVariant: ['tabular-nums'] }}
              >
                {isComplete ? '·' : phaseSeconds}
              </AppText>
              <AppText variant="caption" tone="tertiary" style={{ marginTop: 2 }}>
                {isComplete ? 'well done' : 'seconds'}
              </AppText>
            </View>
          </View>

          {/* Round markers */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 34 }}>
            {Array.from({ length: markerCount }).map((_, index) => (
              <View
                key={index}
                style={{
                  height: 6,
                  width: 26,
                  borderRadius: 3,
                  backgroundColor:
                    index <= Math.min(cycle, markerCount - 1)
                      ? colors.primary.default
                      : colors.surface.muted,
                }}
              />
            ))}
            <AppText variant="caption" tone="tertiary" style={{ marginLeft: 6 }}>
              Round {Math.min(cycle + 1, safeTotalCycles)} of {safeTotalCycles}
            </AppText>
          </View>

          <AppText variant="caption" tone="secondary" style={{ marginTop: 14 }}>
            {patternLine}
          </AppText>
        </View>

        {/* Controls */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingBottom: Math.max(insets.bottom, 24) + 10,
          }}
        >
          <View style={{ flex: 1 }}>
            <Button
              title={isComplete ? 'Done' : isRunning ? 'Pause' : 'Begin'}
              variant={isRunning || isComplete ? 'primary' : 'outline'}
              onPress={toggleSession}
              fullWidth
              leftIcon={(color, size) =>
                isComplete ? null : (
                  <Ionicons name={isRunning ? 'pause' : 'play'} size={size} color={color} />
                )
              }
            />
          </View>
          <TactilePressable
            onPress={() => navigation?.goBack?.()}
            scaleDownTo={0.92}
            accessibilityRole="button"
            accessibilityLabel="End session"
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.surface.muted,
            }}
          >
            <Ionicons name="close" size={18} color={colors.text.secondary} />
          </TactilePressable>
        </View>
      </View>
    </ScreenContainer>
  );
}
