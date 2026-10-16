import React, { useEffect } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { motion, useAppReducedMotion } from '../../theme/motion';

interface PopInProps {
  /** Position in a staggered group — multiplied by `delayStep`. */
  index?: number;
  delayStep?: number;
  baseDelay?: number;
  /** Rise distance in px (defaults to the motion token). */
  rise?: number;
  /** Initial scale (defaults to the playful pop scale). */
  scaleFrom?: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

/**
 * Playful spring entrance for colorful cards and tiles.
 *
 * Every card in the app pops in with the same physics — a soft scale-up from
 * 0.92 with a gentle rise — so a wall of multi-colored cards still reads as one
 * choreographed, calm motion. Honors both the OS reduced-motion setting and the
 * in-app "Reduce Animations" toggle (falls back to a quiet fade).
 */
export function PopIn({
  index = 0,
  delayStep = motion.stagger,
  baseDelay = 0,
  rise = motion.rise,
  scaleFrom = motion.popScale,
  style,
  children,
}: PopInProps) {
  const reducedMotion = useAppReducedMotion();
  const progress = useSharedValue(0);
  const delay = baseDelay + index * delayStep;

  useEffect(() => {
    if (reducedMotion) {
      progress.value = withTiming(1, { duration: motion.duration.fast });
      return;
    }
    progress.value = withDelay(delay, withSpring(1, motion.spring.pop));
    // Mount-only entrance by design.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [rise, 0]) },
      { scale: interpolate(progress.value, [0, 1], [reducedMotion ? 1 : scaleFrom, 1]) },
    ],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}
