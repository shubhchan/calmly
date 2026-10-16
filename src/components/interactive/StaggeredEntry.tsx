import React from 'react';
import { StyleProp, ViewStyle, View } from 'react-native';
import Animated, {
  FadeInDown,
  FadeIn,
  useReducedMotion,
} from 'react-native-reanimated';

interface StaggeredEntryProps {
  index?: number;
  delayStep?: number;
  baseDelay?: number;
  damping?: number;
  stiffness?: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

/**
 * Hardware-accelerated staggered entrance animation wrapper.
 * Staggers child cards and list items into view smoothly using Reanimated 4 physics,
 * automatically falling back to an instant fade if reduced motion is requested.
 */
export function StaggeredEntry({
  index = 0,
  delayStep = 32,
  baseDelay = 0,
  damping = 14,
  stiffness = 180,
  style,
  children,
}: StaggeredEntryProps) {
  const reducedMotion = useReducedMotion();
  const delay = baseDelay + index * delayStep;

  if (reducedMotion) {
    return (
      <Animated.View entering={FadeIn.duration(150)} style={style}>
        {children}
      </Animated.View>
    );
  }

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify().damping(damping).stiffness(stiffness)}
      style={style}
    >
      {children}
    </Animated.View>
  );
}
