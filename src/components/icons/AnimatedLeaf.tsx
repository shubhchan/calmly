import React, { forwardRef, useImperativeHandle } from 'react';
import { Pressable } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import type { IconHandle, AnimatedIconProps } from './types';
import { useThemeColors } from '../../theme/ThemeContext';

// Path data is Lucide's actual "leaf" icon (ISC licensed) — verified against
// lucide.dev, not reconstructed from a screenshot. This is the pattern to
// repeat for any icon on lucide-animated.com or animateicons.in: open
// https://lucide-animated.com/icons/<name>.md for the source, copy its <path>
// `d` values in here, and keep the reanimated wiring below.
const LEAF_PATH_1 = 'M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z';
const LEAF_PATH_2 = 'M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12';

export const AnimatedLeaf = forwardRef<IconHandle, AnimatedIconProps>(
  ({ size = 24, color, className, animateOnPress = true, onPress }, ref) => {
    const colors = useThemeColors();
    const resolvedColor = color ?? colors.accentPrimary;

    const sway = useSharedValue(0);
    const scale = useSharedValue(1);

    const play = () => {
      // A gentle sway + pop — the web version rotates and nudges the leaf on
      // hover; on a touch screen the equivalent cue is a press-triggered wiggle.
      sway.value = withSequence(
        withTiming(-12, { duration: 100 }),
        withTiming(10, { duration: 140 }),
        withTiming(0, { duration: 140 })
      );
      scale.value = withSequence(
        withTiming(1.12, { duration: 100 }),
        withSpring(1, { damping: 7, stiffness: 160 })
      );
    };

    const reset = () => {
      sway.value = withTiming(0, { duration: 150 });
      scale.value = withTiming(1, { duration: 150 });
    };

    useImperativeHandle(ref, () => ({ startAnimation: play, stopAnimation: reset }));

    // Must go through useAnimatedStyle (not a plain object reading `.value`)
    // so Reanimated can update it on the UI thread each frame.
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }, { rotate: `${sway.value}deg` }],
    }));

    return (
      <Pressable onPressIn={animateOnPress ? play : undefined} onPress={onPress} hitSlop={8} className={className}>
        <Animated.View style={animatedStyle}>
          <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={resolvedColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d={LEAF_PATH_1} />
            <Path d={LEAF_PATH_2} />
          </Svg>
        </Animated.View>
      </Pressable>
    );
  }
);

AnimatedLeaf.displayName = 'AnimatedLeaf';
