import React, { useEffect } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, DimensionValue } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  useReducedMotion,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '../../theme/ThemeContext';

interface ShimmerSkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

/**
 * Enterprise-grade hardware-accelerated shimmer skeleton loader.
 * Smoothly translates an organic gradient wave across the placeholder bounds
 * on the UI thread, providing continuous visual continuity during asynchronous data hydration.
 */
export function ShimmerSkeleton({
  width = '100%',
  height = 20,
  borderRadius = 12,
  style,
}: ShimmerSkeletonProps) {
  const reducedMotion = useReducedMotion();
  const colors = useThemeColors();
  const isDark = !!colors.isDark;

  const progress = useSharedValue(0);

  useEffect(() => {
    if (!reducedMotion) {
      progress.value = withRepeat(
        withTiming(1, { duration: 1350, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
        -1,
        false
      );
    }
  }, [reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(progress.value, [0, 1], [-200, 200]);
    return {
      transform: [{ translateX }],
    };
  });

  const baseBg = isDark ? colors.bgTertiary ?? '#1C2536' : colors.borderLight ?? '#E6E0D4';
  const highlightColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.55)';

  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: baseBg,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {!reducedMotion && (
        <AnimatedLinearGradient
          colors={['transparent', highlightColor, 'transparent']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[StyleSheet.absoluteFill, animatedStyle]}
        />
      )}
    </View>
  );
}
