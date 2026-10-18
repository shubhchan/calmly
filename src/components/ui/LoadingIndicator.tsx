import React, { useEffect } from 'react';
import { ActivityIndicator, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useAppTheme } from '../../theme/ThemeContext';
import { motion, useAppReducedMotion } from '../../theme/motion';
import { resolveShadow, shape, spacing } from '../../theme/tokens';
import { AppText } from './AppText';

export type LoadingIndicatorSize = 'sm' | 'md' | 'lg';

export interface LoadingIndicatorProps {
  size?: LoadingIndicatorSize;
  label?: string;
  color?: string;
  centered?: boolean;
  style?: StyleProp<ViewStyle>;
}

const activitySizes: Record<LoadingIndicatorSize, 'small' | 'large'> = {
  sm: 'small',
  md: 'small',
  lg: 'large',
};

/** Themed spinner with optional label; announces itself as a progressbar. */
export function LoadingIndicator({
  size = 'md',
  label,
  color,
  centered = false,
  style,
}: LoadingIndicatorProps) {
  const theme = useAppTheme();
  const c = theme.colors;

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label ?? 'Loading'}
      style={[
        {
          alignItems: 'center',
          justifyContent: 'center',
          flex: centered ? 1 : undefined,
        },
        style,
      ]}
    >
      <ActivityIndicator size={activitySizes[size]} color={color ?? c.primary.default} />
      {label ? (
        <AppText variant="bodySmall" tone="tertiary" style={{ marginTop: spacing[2] }}>
          {label}
        </AppText>
      ) : null}
    </View>
  );
}

export interface LoadingOverlayProps {
  visible: boolean;
  label?: string;
  children?: React.ReactNode;
}

/** Modal scrim with a floating loader card; fades in and respects reduced motion. */
export function LoadingOverlay({ visible, label, children }: LoadingOverlayProps) {
  const theme = useAppTheme();
  const c = theme.colors;
  const reducedMotion = useAppReducedMotion();
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;
    if (reducedMotion) {
      opacity.value = 1;
      return;
    }
    opacity.value = 0;
    opacity.value = withTiming(1, {
      duration: motion.duration.fast,
      easing: motion.ease.gentle,
    });
  }, [visible, reducedMotion, opacity]);

  const fadeStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  if (!visible) return null;

  return (
    <Animated.View
      accessibilityViewIsModal
      style={[
        StyleSheet.absoluteFill,
        {
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: c.overlay.backdrop,
        },
        fadeStyle,
      ]}
    >
      <View
        style={[
          {
            alignItems: 'center',
            backgroundColor: c.surface.elevated,
            borderRadius: shape.dialog,
            padding: spacing[5],
          },
          resolveShadow('lg', theme.isDark, c.text.primary),
        ]}
      >
        {children ?? <LoadingIndicator label={label} />}
      </View>
    </Animated.View>
  );
}
