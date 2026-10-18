import React, { useEffect } from 'react';
import { RefreshControlProps, StyleProp, View, ViewStyle } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useAppTheme } from '../../theme/ThemeContext';
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
 * The themed surface is painted opaque from the very first frame so native
 * route transitions (stack slide, modal sheet, tab swap) never reveal the
 * screen underneath through a half-transparent page. Only the content plays
 * the gentle rise + settle entrance; loading bodies show their shimmering
 * skeletons immediately and crossfade to real content when data resolves.
 *
 * Route exits are handled natively by the stack, and reduced motion is honored
 * from both the OS setting and the in-app toggle.
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
  const { colors } = useAppTheme();

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
    backgroundColor: backgroundColor ?? colors.background.default,
  };

  if (!scroll) {
    return (
      <View style={surfaceStyle}>
        <Animated.View style={[{ flex: 1 }, style, animatedStyle]}>{children}</Animated.View>
      </View>
    );
  }

  return (
    <View style={surfaceStyle}>
      <Animated.ScrollView
        style={[{ flex: 1 }, style, animatedStyle]}
        contentContainerStyle={[{ paddingBottom: bottomPadding }, contentContainerStyle]}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator ?? false}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps ?? 'handled'}
        refreshControl={refreshControl}
      >
        {children}
      </Animated.ScrollView>
    </View>
  );
}
