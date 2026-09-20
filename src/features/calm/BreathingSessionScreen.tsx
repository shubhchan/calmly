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
  const { preset = 'box', duration = 60 } = route.params ?? {};
  const pattern = presetPatterns[preset] ?? presetPatterns.box;
  const totalCycleTime = pattern.inhale + pattern.hold + pattern.exhale + pattern.holdExhale;
  const totalCycles = Math.floor((duration * 60) / totalCycleTime);

  const [phase, setPhase] = useState<Phase>('inhale');
  const [cycle, setCycle] = useState(0);
  const [timeLeft, setTimeLeft] = useState(pattern.inhale);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedCircleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const phaseConfig = {
    inhale: { label: 'Breathe in', color: '#5A955A', duration: pattern.inhale, scale: 1.2 },
    hold: { label: 'Hold', color: '#6B9BCD', duration: pattern.hold, scale: 1.2 },
    exhale: { label: 'Breathe out', color: '#877FC5', duration: pattern.exhale, scale: 0.8 },
    holdExhale: { label: 'Hold', color: '#EB876D', duration: pattern.holdExhale, scale: 0.8 },
    complete: { label: 'Session complete', color: '#5A955A', duration: 0, scale: 1 },
  };

  const currentConfig = phaseConfig[phase];

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
    const nextIndex = (currentIndex + 1) % phases.length;
    const nextPhase = phases[nextIndex];
    return phaseConfig[nextPhase].duration;
  };

  const nextPhase = () => {
    const phases: Phase[] = ['inhale', 'hold', 'exhale', 'holdExhale'];
    const currentIndex = phases.indexOf(phase);
    const nextIndex = (currentIndex + 1) % phases.length;

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
      setPhase(phases[nextIndex]);
      animatePhaseTransition(phases[nextIndex]);
    }
  };

  const animatePhaseTransition = (nextPhase: Phase) => {
    const nextConfig = phaseConfig[nextPhase];
    scale.value = withTiming(nextConfig.scale, { duration: 500, easing: Easing.out(Easing.quad) });
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
    setTimeLeft(pattern.inhale);
    setIsRunning(false);
    setIsComplete(false);
    scale.value = 1;
    opacity.value = 1;
  };

  const progress = isComplete ? 1 : (cycle + (1 - timeLeft / currentConfig.duration)) / totalCycles;

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
              stroke={currentConfig.color}
              strokeWidth={8}
              strokeDasharray={2 * Math.PI * 120}
              strokeDashoffset={2 * Math.PI * 120 * (1 - Math.min(1, progress))}
              strokeLinecap="round"
              transform="rotate(-90 140 140)"
            />
          </Svg>
        </Animated.View>

        <View className="mt-8 flex items-center">
          <Text className="text-display-md font-bold text-center" style={{ color: currentConfig.color }}>
            {currentConfig.label}
          </Text>
          <Text className="text-display-xl font-bold mt-2" style={{ color: '#1E232E' }}>
            {timeLeft}s
          </Text>
          {!isComplete && (
            <Text className="text-body-md mt-2 text-center" style={{ color: '#425474' }}>
              Cycle {Math.min(cycle + 1, totalCycles)} of {totalCycles}
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
          progress={progress}
          size={60}
          strokeWidth={4}
          showPercentage={true}
          className="mt-4"
        />

        <Text className="text-body-sm text-center mt-2" style={{ color: '#425474' }}>
          {presetLabels[preset]} · {duration} min
        </Text>
      </View>
    </View>
  );
}