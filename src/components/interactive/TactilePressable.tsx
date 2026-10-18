import React, { forwardRef } from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle, View, GestureResponderEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useReducedMotion,
} from 'react-native-reanimated';
import { hapticFeedback } from '../../utils/haptics';
import { motion } from '../../theme/motion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface TactilePressableProps extends Omit<PressableProps, 'style'> {
  scaleDownTo?: number;
  hapticStyle?: 'light' | 'medium' | 'selection' | 'none';
  style?: StyleProp<ViewStyle>;
  className?: string;
  children?: React.ReactNode | ((state: { pressed: boolean }) => React.ReactNode);
}

/**
 * Enterprise-grade tactile pressable component.
 * Executes smooth spring transformations directly on the UI thread via Reanimated 4,
 * bypassing React component re-renders and preventing frame drops.
 */
export const TactilePressable = forwardRef<View, TactilePressableProps>(
  (
    {
      scaleDownTo = 0.965,
      hapticStyle = 'light',
      onPressIn,
      onPressOut,
      disabled,
      style,
      children,
      ...props
    },
    ref
  ) => {
    const reducedMotion = useReducedMotion();
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    }));

    const handlePressIn = (e: GestureResponderEvent) => {
      if (disabled) return;
      if (!reducedMotion) {
        scale.value = withSpring(scaleDownTo, motion.spring.snappy);
        opacity.value = withSpring(0.92, motion.spring.snappy);
      }
      if (hapticStyle === 'light') hapticFeedback.light();
      else if (hapticStyle === 'medium') hapticFeedback.medium();
      else if (hapticStyle === 'selection') hapticFeedback.selection();

      onPressIn?.(e);
    };

    const handlePressOut = (e: GestureResponderEvent) => {
      if (disabled) return;
      if (!reducedMotion) {
        scale.value = withSpring(1, motion.spring.snappy);
        opacity.value = withSpring(1, motion.spring.snappy);
      }
      onPressOut?.(e);
    };

    return (
      <AnimatedPressable
        ref={ref}
        disabled={disabled}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[style, animatedStyle]}
        {...props}
      >
        {children}
      </AnimatedPressable>
    );
  }
);

TactilePressable.displayName = 'TactilePressable';
