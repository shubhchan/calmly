import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import {
  avatarSizes,
  inputSizes,
  radius,
  shape,
  spacing,
  type AvatarSize,
  type RadiusToken,
} from '../../theme/tokens';
import { Skeleton } from '../interactive/Skeleton';

export { ListSkeleton, DetailSkeleton, GridSkeleton, FormSkeleton } from '../interactive/LoadingState';

export interface SkeletonLineProps {
  width?: number | string;
  height?: number;
  radiusToken?: RadiusToken;
  style?: StyleProp<ViewStyle>;
}

/** Single shimmering line, the atom every text placeholder is built from. */
export function SkeletonLine({
  width = '100%',
  height = 14,
  radiusToken = 'sm',
  style,
}: SkeletonLineProps) {
  return <Skeleton width={width as any} height={height} radius={radius[radiusToken]} style={style} />;
}

export interface SkeletonTextProps {
  lines?: number;
  lastLineWidth?: number | string;
  style?: StyleProp<ViewStyle>;
}

/** Paragraph placeholder; the final line is shortened for a natural look. */
export function SkeletonText({ lines = 3, lastLineWidth = '60%', style }: SkeletonTextProps) {
  const safeLines = Math.max(1, lines);
  return (
    <View style={[{ gap: spacing[2] }, style]}>
      {Array.from({ length: safeLines }).map((_, i) => (
        <SkeletonLine
          key={i}
          width={i === safeLines - 1 && safeLines > 1 ? lastLineWidth : '100%'}
        />
      ))}
    </View>
  );
}

export interface SkeletonAvatarProps {
  sizeToken?: AvatarSize;
  style?: StyleProp<ViewStyle>;
}

/** Circular avatar placeholder sized from the avatar scale. */
export function SkeletonAvatar({ sizeToken = 'md', style }: SkeletonAvatarProps) {
  const size = avatarSizes[sizeToken];
  return <Skeleton width={size} height={size} radius={radius.full} style={style} />;
}

export interface SkeletonCardProps {
  height?: number;
  radiusToken?: RadiusToken;
  style?: StyleProp<ViewStyle>;
}

/** Large rounded block standing in for a card or media surface. */
export function SkeletonCard({ height = 96, radiusToken = '2xl', style }: SkeletonCardProps) {
  return <Skeleton width="100%" height={height} radius={radius[radiusToken]} style={style} />;
}

export interface SkeletonListProps {
  rows?: number;
  avatar?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** List placeholder mirroring avatar + two-line rows. */
export function SkeletonList({ rows = 4, avatar = true, style }: SkeletonListProps) {
  return (
    <View style={[{ gap: spacing[3] }, style]}>
      {Array.from({ length: Math.max(1, rows) }).map((_, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
          {avatar ? <SkeletonAvatar /> : null}
          <View style={{ flex: 1, gap: spacing[2] }}>
            <SkeletonLine width="70%" />
            <SkeletonLine width="45%" />
          </View>
        </View>
      ))}
    </View>
  );
}

export interface SkeletonFormProps {
  fields?: number;
  style?: StyleProp<ViewStyle>;
}

/** Form placeholder: label line plus input-height block per field. */
export function SkeletonForm({ fields = 3, style }: SkeletonFormProps) {
  return (
    <View style={[{ gap: spacing[4] }, style]}>
      {Array.from({ length: Math.max(1, fields) }).map((_, i) => (
        <View key={i} style={{ gap: spacing[2] }}>
          <SkeletonLine width="40%" />
          <Skeleton width="100%" height={inputSizes.md.height} radius={shape.input} />
        </View>
      ))}
    </View>
  );
}
