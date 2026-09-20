import React, { forwardRef, useImperativeHandle } from 'react';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import type { IconHandle, AnimatedIconProps } from './types';
import { useThemeColors } from '../../theme/ThemeContext';

const AnimatedIoniconsBase = Animated.createAnimatedComponent(Ionicons);

interface AnimatedGlyphIconProps extends AnimatedIconProps {
  // Any glyph name from @expo/vector-icons/Ionicons — already installed, so this
  // is the fastest path to "animated icon" without pulling in a web-only library.
  name: React.ComponentProps<typeof Ionicons>['name'];
}

/**
 * Neither lucide-animated.com nor animateicons.in ship anything React Native can
 * import directly: both are built on `motion` (Framer Motion) targeting DOM <svg>
 * elements, distributed via the shadcn CLI, and animate on CSS `:hover` — none of
 * which exist on a phone. This component reproduces the same *feel* (a small,
 * springy motion cue tied to user interaction) using react-native-reanimated,
 * which is already a dependency of this project.
 *
 * Trigger model on native: press (onPressIn), not hover — there's no cursor.
 * For a pixel-exact copy of one of their icons, grab the raw SVG path from
 * https://lucide-animated.com/icons/<name>.md and swap the <Ionicons> below for
 * a <Path d="..."/> inside <Svg> from react-native-svg, keeping this same
 * reanimated wiring. See AnimatedLeaf.tsx for a worked example of that pattern.
 */
export const AnimatedIcon = forwardRef<IconHandle, AnimatedGlyphIconProps>(
  ({ name, size = 24, color, strokeWidth, className, animateOnPress = true, onPress }, ref) => {
    const colors = useThemeColors();
    const resolvedColor = color ?? colors.textPrimary;

    const scale = useSharedValue(1);
    const rotate = useSharedValue(0);

    const play = () => {
      scale.value = withSequence(
        withTiming(0.85, { duration: 90, easing: Easing.out(Easing.quad) }),
        withSpring(1, { damping: 6, stiffness: 180 })
      );
      rotate.value = withSequence(
        withTiming(-8, { duration: 90 }),
        withTiming(8, { duration: 120 }),
        withTiming(0, { duration: 120 })
      );
    };

    const reset = () => {
      scale.value = withTiming(1, { duration: 150 });
      rotate.value = withTiming(0, { duration: 150 });
    };

    // Mirrors animateicons' IconHandle (startAnimation/stopAnimation) so the icon
    // can also be triggered imperatively from a parent (e.g. after a successful
    // habit completion), not only by a press.
    useImperativeHandle(ref, () => ({
      startAnimation: play,
      stopAnimation: reset,
    }));

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
    }));

    return (
      <Pressable
        onPressIn={animateOnPress ? play : undefined}
        onPress={onPress}
        hitSlop={8}
        className={className}
      >
        <AnimatedIoniconsBase name={name} size={size} color={resolvedColor} style={animatedStyle} />
      </Pressable>
    );
  }
);

AnimatedIcon.displayName = 'AnimatedIcon';
