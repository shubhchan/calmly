import React, { useEffect } from 'react';
import { View, Pressable, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
  interpolate,
  Easing,
  useReducedMotion,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { hapticFeedback } from '../../utils/haptics';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const DEFAULT_PARTICLE_COLORS = [
  '#8FBC8F',
  '#B19CD9',
  '#A8D0E6',
  '#F5C6A5',
  '#F5A9A9',
  '#9FD8A8',
  '#D8A8E8',
  '#F5D8A8',
];

const PARTICLE_COUNT = 8;
const CHECK_PATH = 'M5 12.5 L10 17.5 L19 7.5';
const CHECK_LENGTH = 22;

// Deterministic particle field: evenly spaced angles with gentle per-index
// variance so the burst feels organic without Math.random() churn on re-render.
const PARTICLES = Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
  const angle = (i * 2 * Math.PI) / PARTICLE_COUNT - Math.PI / 2;
  return {
    x: Math.cos(angle),
    y: Math.sin(angle),
    size: 3 + (i % 3),
    delay: (i % 4) * 0.04,
    distance: 0.82 + (i % 3) * 0.14,
    colorIndex: i % DEFAULT_PARTICLE_COLORS.length,
  };
});

interface BurstParticleProps {
  particle: (typeof PARTICLES)[number];
  progress: SharedValue<number>;
  distance: number;
  color: string;
}

function BurstParticle({ particle, progress, distance, color }: BurstParticleProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const p = progress.value;
    const start = particle.delay;
    const travel = interpolate(p, [start, start + 0.55, 1], [0, 1, 1], 'clamp');
    const opacity = interpolate(p, [start, start + 0.18, 1], [0, 1, 0], 'clamp');
    const scale = interpolate(p, [start, start + 0.3, 1], [0.2, 1, 0.35], 'clamp');
    const gravity = 14 * travel * travel;
    return {
      opacity,
      transform: [
        { translateX: particle.x * distance * particle.distance * travel },
        { translateY: particle.y * distance * particle.distance * travel + gravity },
        { scale },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          width: particle.size,
          height: particle.size,
          borderRadius: particle.size / 2,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
}

interface CelebratoryCheckboxProps {
  checked: boolean;
  onToggle: () => void;
  size?: number;
  activeColor?: string;
  inactiveColor?: string;
  borderColor?: string;
  particleColors?: string[];
  style?: StyleProp<ViewStyle>;
}

/**
 * Enterprise-grade tactile checkbox with spring morphing, an SVG checkmark
 * that draws itself on with strokeDashoffset, and a pastel particle burst.
 * Runs entirely on the UI thread via Reanimated 4 worklets — instant positive
 * reinforcement on daily habit and task completion with zero JS frame drops.
 */
export function CelebratoryCheckbox({
  checked,
  onToggle,
  size = 28,
  activeColor = '#3E7B52',
  inactiveColor = 'transparent',
  borderColor = '#C2DCBF',
  particleColors,
  style,
}: CelebratoryCheckboxProps) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const burst = useSharedValue(0);
  const checkProgress = useSharedValue(0);

  const palette = particleColors && particleColors.length > 0 ? particleColors : DEFAULT_PARTICLE_COLORS;

  useEffect(() => {
    if (checked && !reducedMotion) {
      scale.value = withSequence(
        withSpring(0.75, { mass: 0.3, damping: 10, stiffness: 350 }),
        withSpring(1.2, { mass: 0.4, damping: 8, stiffness: 280 }),
        withSpring(1, { mass: 0.4, damping: 12, stiffness: 220 })
      );
      burst.value = 0;
      burst.value = withTiming(1, { duration: 560, easing: Easing.out(Easing.quad) });
      checkProgress.value = 0;
      checkProgress.value = withDelay(110, withTiming(1, { duration: 260, easing: Easing.out(Easing.quad) }));
    } else if (checked) {
      scale.value = 1;
      burst.value = 0;
      checkProgress.value = 1;
    } else {
      scale.value = withSpring(1, { mass: 0.3, damping: 12, stiffness: 240 });
      burst.value = 0;
      checkProgress.value = 0;
    }
  }, [checked, reducedMotion]);

  const handlePress = () => {
    if (!checked) {
      hapticFeedback.medium();
    } else {
      hapticFeedback.light();
    }
    onToggle();
  };

  const animatedBoxStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const checkAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CHECK_LENGTH * (1 - checkProgress.value),
  }));

  const particleDistance = size * 0.95;

  return (
    <View style={[{ width: size + 16, height: size + 16, alignItems: 'center', justifyContent: 'center' }, style]}>
      {PARTICLES.map((p, i) => (
        <BurstParticle
          key={i}
          particle={p}
          progress={burst}
          distance={particleDistance}
          color={palette[p.colorIndex % palette.length] ?? activeColor}
        />
      ))}

      <Pressable
        onPress={handlePress}
        hitSlop={12}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        accessibilityLabel={checked ? 'Mark as not done' : 'Mark as done'}
      >
        <Animated.View
          style={[
            {
              width: size,
              height: size,
              borderRadius: size * 0.32,
              borderWidth: checked ? 0 : 2,
              borderColor: borderColor,
              backgroundColor: checked ? activeColor : inactiveColor,
              alignItems: 'center',
              justifyContent: 'center',
            },
            animatedBoxStyle,
          ]}
        >
          {checked && (
            <Svg width={size * 0.7} height={size * 0.7} viewBox="0 0 24 24" fill="none">
              <AnimatedPath
                d={CHECK_PATH}
                stroke="#FFFFFF"
                strokeWidth={3.2}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={CHECK_LENGTH}
                animatedProps={checkAnimatedProps}
              />
            </Svg>
          )}
        </Animated.View>
      </Pressable>
    </View>
  );
}
