import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleProp, ViewStyle } from 'react-native';
import { useNavigation, useRoute, NavigationProp, RouteProp } from '@react-navigation/native';
import { PrimaryButton, ProgressRing } from '../../components';
import { RootStackParamList, BreathingPreset } from '../../types/navigation';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing } from 'react-native-reanimated';

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
  relaxation: 'Relaxation',
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
    inhale: { label: 'Breathe in', color: '#5A955A', duration: safeInhale, scale: 1.2 },
    hold: { label: 'Hold', color: '#6B9BCD', duration: safeHold, scale: 1.2 },
    exhale: { label: 'Breathe out', color: '#877FC5', duration: safeExhale, scale: 0.8 },
    holdExhale: { label: 'Hold', color: '#EB876D', duration: safeHoldExhale, scale: 0.8 },
    complete: { label: 'Session complete', color: '#5A955A', duration: 0, scale: 1 },
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
    scale.value = withTiming(safeScale, { duration: 500, easing: Easing.out(Easing.quad) });
    opacity.value = withTiming(0.3, { duration: 200 }, () => {
      opacity.value = withTiming(1, { duration: 300 });
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
    <View className="flex-1 bg-[var(--color-bg-primary)] flex flex-col">
      <View className="flex-1 flex items-center justify-center px-20">
        <Animated.View style={animatedCircleStyle}>
          <Svg width={280} height={280}>
            <Circle
              cx={140}
              cy={140}
              r={120}
              fill="none"
              stroke="#E4DEBC"
              strokeWidth={8}
            />
            <Circle
              cx={140}
              cy={140}
              r={120}
              fill="none"
              stroke={currentConfig?.color ?? '#5A955A'}
              strokeWidth={8}
              strokeDasharray={2 * Math.PI * 120}
              strokeDashoffset={2 * Math.PI * 120 * (1 - Math.min(1, progress ?? 0))}
              strokeLinecap="round"
              transform="rotate(-90 140 140)"
            />
          </Svg>
        </Animated.View>

        <View className="mt-8 flex items-center">
          <Text className="text-display-md font-bold text-center" style={{ color: currentConfig?.color ?? '#5A955A' }}>
            {currentConfig?.label ?? 'Breathe'}
          </Text>
          <Text className="text-display-xl font-bold mt-2" style={{ color: '#1E232E' }}>
            {(Number.isFinite(timeLeft) ? timeLeft : 0)}s
          </Text>
          {!isComplete && (
            <Text className="text-body-md mt-2 text-center" style={{ color: '#425474' }}>
              Cycle {Math.min(cycle + 1, safeTotalCycles)} of {safeTotalCycles}
            </Text>
          )}
        </View>
      </View>

      <View className="px-20 pb-10 flex items-center">
        <View className="w-full flex-row justify-center gap-4 mb-4">
          <PrimaryButton
            title={isRunning ? 'Pause' : isComplete ? 'Done' : 'Start'}
            variant="primary"
            size="lg"
            onPress={toggleSession}
            className="flex-1 max-w-[160px]"
            fullWidth
            disabled={false}
          />
          {!isComplete && (
            <PrimaryButton
              title="Reset"
              variant="outline"
              size="lg"
              onPress={resetSession}
              className="flex-1 max-w-[160px]"
              fullWidth
            />
          )}
        </View>

        <ProgressRing
          progress={Number.isFinite(progress) ? progress : 0}
          size={60}
          strokeWidth={4}
          showPercentage={true}
          className="mt-4"
        />

        <Text className="text-body-sm text-center mt-2" style={{ color: '#425474' }}>
          {(presetLabels[safePreset] ?? presetLabels.box ?? 'Breathing')} · {safeDuration} min
        </Text>
      </View>
    </View>
  );
}