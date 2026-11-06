import React, { useEffect } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { AppIcon } from '../AppIcon';
import { useAppTheme } from '../../theme/ThemeContext';
import { useAppReducedMotion, motion } from '../../theme/motion';
import { Skeleton, SkeletonCard, SkeletonText } from './Skeleton';

/**
 * Uniform loading language for every route.
 *
 * One branded loader (pulsing 悟 leaf), one set of layout-matching skeleton
 * presets, and one crossfade wrapper — so no screen ever shows a bare spinner
 * or the words "Loading..." again.
 */

export function BrandedLoader({ label, compact = false }: { label?: string; compact?: boolean }) {
  const { colors } = useAppTheme();
  const reducedMotion = useAppReducedMotion();
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) return;
    pulse.value = withRepeat(
      withTiming(1, { duration: 1300, easing: motion.ease.gentle }),
      -1,
      true,
    );
  }, [reducedMotion, pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.5, 1]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.92, 1.08]) }],
  }));

  return (
    <View
      style={[
        styles.brandedLoader,
        compact && { paddingVertical: 12, paddingHorizontal: 20, flexDirection: 'row', gap: 10 },
      ]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label ?? 'Loading'}
    >
      <Animated.View style={pulseStyle}>
        <AppIcon name="i-leaf" size={compact ? 20 : 40} color={colors.primary.default} />
      </Animated.View>
      {label ? (
        <Animated.Text
          style={[
            styles.brandedLabel,
            compact && { marginTop: 0, fontSize: 13 },
            { color: colors.text.tertiary },
          ]}
        >
          {label}
        </Animated.Text>
      ) : null}
    </View>
  );
}

/**
 * Shared frame for every skeleton preset. Renders statically: the route
 * transition already animates the screen, and the shimmer signals activity.
 */
function LoadingShell({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.shell, style]}
    >
      {children}
    </View>
  );
}

export function ListSkeleton({
  rows = 4,
  showHeader = true,
  style,
}: {
  rows?: number;
  showHeader?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const reducedMotion = useAppReducedMotion();
  return (
    <LoadingShell style={style}>
      {showHeader && (
        <View style={styles.listHeader}>
          <Skeleton width="52%" height={24} radius={12} shimmer={!reducedMotion} />
          <Skeleton width="34%" height={14} radius={7} shimmer={!reducedMotion} />
        </View>
      )}
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonCard key={i} rows={2} shimmer={!reducedMotion} />
      ))}
    </LoadingShell>
  );
}

export function DetailSkeleton({ style }: { style?: StyleProp<ViewStyle> }) {
  const reducedMotion = useAppReducedMotion();
  return (
    <LoadingShell style={style}>
      <Skeleton width="100%" height={148} radius={24} shimmer={!reducedMotion} />
      <Skeleton width="62%" height={24} radius={12} shimmer={!reducedMotion} />
      <SkeletonText lines={3} lineHeight={14} gap={9} />
      <SkeletonCard rows={1} shimmer={!reducedMotion} />
      <SkeletonCard rows={1} shimmer={!reducedMotion} />
    </LoadingShell>
  );
}

export function GridSkeleton({ cells = 4, columns = 2, style }: { cells?: number; columns?: number; style?: StyleProp<ViewStyle> }) {
  const reducedMotion = useAppReducedMotion();
  const width = columns === 2 ? '48%' : columns === 3 ? '31%' : '22%';
  return (
    <LoadingShell style={style}>
      <Skeleton width="42%" height={24} radius={12} shimmer={!reducedMotion} />
      <View style={styles.grid}>
        {Array.from({ length: cells }).map((_, i) => (
          <Skeleton key={i} width={width as any} height={124} radius={24} shimmer={!reducedMotion} />
        ))}
      </View>
    </LoadingShell>
  );
}

export function FormSkeleton({ fields = 3, style }: { fields?: number; style?: StyleProp<ViewStyle> }) {
  const reducedMotion = useAppReducedMotion();
  return (
    <LoadingShell style={style}>
      <Skeleton width="56%" height={26} radius={13} shimmer={!reducedMotion} />
      {Array.from({ length: fields }).map((_, i) => (
        <View key={i} style={styles.formField}>
          <Skeleton width="30%" height={13} radius={7} shimmer={!reducedMotion} />
          <Skeleton width="100%" height={52} radius={16} shimmer={!reducedMotion} />
        </View>
      ))}
      <Skeleton width="100%" height={52} radius={26} style={{ marginTop: 8 }} shimmer={!reducedMotion} />
    </LoadingShell>
  );
}

/**
 * Uniform skeleton -> content swap. Renders statically so content does not
 * double-animate against the native route transition.
 */
export function ContentReveal({
  loading,
  skeleton,
  children,
  style,
}: {
  loading: boolean;
  skeleton: React.ReactNode;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  if (loading) {
    return <View style={[styles.shell, style]}>{skeleton}</View>;
  }
  return <View style={style}>{children}</View>;
}

const styles = StyleSheet.create({
  brandedLoader: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  brandedLabel: {
    marginTop: 12,
    fontSize: 14,
    letterSpacing: 0.2,
  },
  shell: {
    gap: 14,
  },
  listHeader: {
    gap: 10,
    marginBottom: 6,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
  },
  formField: {
    gap: 8,
  },
});
