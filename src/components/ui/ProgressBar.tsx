import React, { useEffect } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useAppTheme } from '../../theme/ThemeContext';
import { motion, useAppReducedMotion } from '../../theme/motion';
import { radius, spacing } from '../../theme/tokens';
import { AppText } from './AppText';

export type ProgressBarHeight = 'sm' | 'md';

export interface ProgressBarProps {
  value: number;
  height?: ProgressBarHeight;
  color?: string;
  trackColor?: string;
  label?: string;
  showValue?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const trackHeights: Record<ProgressBarHeight, number> = {
  sm: 4,
  md: 8,
};

/** Animated horizontal progress track with optional label and percent readout. */
export function ProgressBar({
  value,
  height = 'sm',
  color,
  trackColor,
  label,
  showValue = false,
  style,
  testID,
}: ProgressBarProps) {
  const theme = useAppTheme();
  const c = theme.colors;
  const reducedMotion = useAppReducedMotion();
  const clamped = Math.min(1, Math.max(0, value));
  const progress = useSharedValue(clamped);

  useEffect(() => {
    if (reducedMotion) {
      progress.value = clamped;
      return;
    }
    progress.value = withTiming(clamped, {
      duration: motion.duration.normal,
      easing: motion.ease.gentle,
    });
  }, [clamped, reducedMotion, progress]);

  const fillStyle = useAnimatedStyle((): ViewStyle => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
      style={style}
      testID={testID}
    >
      {label || showValue ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: spacing[2],
            marginBottom: spacing[1],
          }}
        >
          {label ? (
            <AppText variant="labelSmall" tone="secondary">
              {label}
            </AppText>
          ) : (
            <View />
          )}
          {showValue ? (
            <AppText variant="labelSmall" tone="tertiary">
              {`${Math.round(clamped * 100)}%`}
            </AppText>
          ) : null}
        </View>
      ) : null}
      <View
        style={{
          height: trackHeights[height],
          borderRadius: radius.full,
          backgroundColor: trackColor ?? c.interactive.hover,
          overflow: 'hidden',
        }}
      >
        <Animated.View
          style={[
            {
              height: '100%',
              borderRadius: radius.full,
              backgroundColor: color ?? c.primary.default,
            },
            fillStyle,
          ]}
        />
      </View>
    </View>
  );
}
