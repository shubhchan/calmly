import React, { useEffect } from 'react';
import { StyleProp, ViewStyle, View, LayoutChangeEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '../../theme/ThemeContext';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  shimmer?: boolean;
}

const BAND_WIDTH = 120;
const BAND_TRAVEL_PADDING = 160;

/**
 * Shimmering placeholder block. Preserves page layout geometry while async
 * data (WatermelonDB) resolves, so content never pops in from a blank screen.
 * Purely decorative: hidden from assistive technology.
 */
export function Skeleton({ width, height = 16, radius = 10, style, shimmer = true }: SkeletonProps) {
  const colors = useThemeColors();
  const containerWidth = useSharedValue(0);
  const sweep = useSharedValue(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (!shimmer) return;
    sweep.value = 0;
    sweep.value = withRepeat(withTiming(1, { duration: 1500, easing: Easing.linear }), -1, false);
    pulse.value = withRepeat(withTiming(1, { duration: 950, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [shimmer, sweep, pulse]);

  const handleLayout = (event: LayoutChangeEvent) => {
    containerWidth.value = event.nativeEvent?.layout?.width ?? 0;
  };

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: shimmer ? interpolate(pulse.value, [0, 1], [0.55, 0.85]) : 0.6,
  }));

  const bandStyle = useAnimatedStyle(() => {
    const travel = containerWidth.value + BAND_TRAVEL_PADDING * 2;
    return {
      transform: [
        { translateX: interpolate(sweep.value, [0, 1], [-BAND_TRAVEL_PADDING, travel - BAND_TRAVEL_PADDING]) },
      ],
    };
  });

  const baseColor = colors.isDark ? colors.bgCardHover : colors.bgTertiary;
  const highlight = colors.isDark ? 'rgba(148, 163, 184, 0.16)' : 'rgba(255, 255, 255, 0.75)';

  return (
    <Animated.View
      onLayout={handleLayout}
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          width: width as any,
          height,
          borderRadius: radius,
          backgroundColor: baseColor,
          overflow: 'hidden',
        },
        pulseStyle,
        style,
      ]}
    >
      {shimmer && (
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              top: 0,
              bottom: 0,
              width: BAND_WIDTH,
              transform: [{ rotate: '18deg' }],
            },
            bandStyle,
          ]}
        >
          <LinearGradient
            colors={['transparent', highlight, 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1 }}
          />
        </Animated.View>
      )}
    </Animated.View>
  );
}

interface SkeletonTextProps {
  lines?: number;
  lineHeight?: number;
  gap?: number;
  lastLineWidth?: number | `${number}%`;
  style?: StyleProp<ViewStyle>;
}

export function SkeletonText({ lines = 2, lineHeight = 14, gap = 8, lastLineWidth = '62%', style }: SkeletonTextProps) {
  const safeLines = Math.max(1, lines);
  return (
    <View style={[{ gap }, style]}>
      {Array.from({ length: safeLines }).map((_, i) => (
        <Skeleton
          key={i}
          height={lineHeight}
          radius={lineHeight / 2}
          width={i === safeLines - 1 && safeLines > 1 ? (lastLineWidth as any) : '100%'}
        />
      ))}
    </View>
  );
}

interface SkeletonCardProps {
  rows?: number;
  showAvatar?: boolean;
  showTrailing?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Card-shaped placeholder mirroring the app's rounded 20pt card geometry.
 */
export function SkeletonCard({ rows = 2, showAvatar = true, showTrailing = true, style }: SkeletonCardProps) {
  const colors = useThemeColors();
  return (
    <View
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          paddingHorizontal: 18,
          paddingVertical: 15,
          borderRadius: 20,
          borderWidth: 1,
          backgroundColor: colors.bgCard,
          borderColor: colors.isDark ? '#2E3D52' : colors.borderLight,
        },
        style,
      ]}
    >
      {showAvatar && <Skeleton width={44} height={44} radius={14} />}
      <SkeletonText lines={rows} style={{ flex: 1 }} lineHeight={rows > 1 ? 14 : 16} lastLineWidth="48%" />
      {showTrailing && <Skeleton width={38} height={38} radius={19} />}
    </View>
  );
}
