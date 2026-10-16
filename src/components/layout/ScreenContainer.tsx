import React, { useEffect } from 'react';
import { RefreshControlProps, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useThemeColors } from '../../theme/ThemeContext';
import { motion, useAppReducedMotion } from '../../theme/motion';

interface ScreenContainerProps {
  children: React.ReactNode;
  /** Wrap children in a ScrollView (default). Set false for custom scrolling UIs. */
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** Override the themed surface (e.g. immersive calm modes). */
  backgroundColor?: string;
  /** Play the uniform screen entrance (default true). */
  animate?: boolean;
  /** Bottom padding for tab-bar clearance (default 110). */
  bottomPadding?: number;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  keyboardShouldPersistTaps?: 'always' | 'never' | 'handled';
  showsVerticalScrollIndicator?: boolean;
}

/**
 * The one screen scaffold every route uses.
 *
 * Guarantees a uniform entry for all screens: themed surface, a gentle
 * spring rise + settle, honoring OS and in-app reduced-motion settings.
 * Route exits are handled natively by the stack (slide/fade/sheet), so the
 * motion language stays: native route transition + this content entrance.
 */
export function ScreenContainer({
  children,
  scroll = true,
  style,
  contentContainerStyle,
  backgroundColor,
  animate = true,
  bottomPadding = 110,
  refreshControl,
  keyboardShouldPersistTaps,
  showsVerticalScrollIndicator,
}: ScreenContainerProps) {
  let colors: any;
  try {
    colors = useThemeColors();
  } catch {
    colors = { bgPrimary: '#FBF9F5' };
  }

  const reducedMotion = useAppReducedMotion();
  const progress = useSharedValue(animate ? 0 : 1);

  useEffect(() => {
    if (!animate) return;
    if (reducedMotion) {
      progress.value = withTiming(1, { duration: motion.duration.fast });
    } else {
      progress.value = withSpring(1, motion.spring.screen);
    }
    // Mount-only entrance by design.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [motion.rise, 0]) },
      { scale: interpolate(progress.value, [0, 1], [reducedMotion ? 1 : motion.settleScale, 1]) },
    ],
  }));

  const surfaceStyle: StyleProp<ViewStyle> = {
    flex: 1,
    backgroundColor: backgroundColor ?? colors.bgPrimary ?? '#FBF9F5',
  };

  if (!scroll) {
    return <Animated.View style={[surfaceStyle, animatedStyle, style]}>{children}</Animated.View>;
  }

  return (
    <Animated.ScrollView
      style={[surfaceStyle, animatedStyle, style]}
      contentContainerStyle={[{ paddingBottom: bottomPadding }, contentContainerStyle]}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator ?? false}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps ?? 'handled'}
      refreshControl={refreshControl}
    >
      {children}
    </Animated.ScrollView>
  );
}
