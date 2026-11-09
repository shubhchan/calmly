import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Pattern, Rect, Line, Circle, Path, RadialGradient, Stop } from 'react-native-svg';
import type { PaperTextureKind } from '../../features/journal/papers';
import { PAPER_LINE_HEIGHT } from '../../features/journal/papers';

interface PaperTextureProps {
  texture: PaperTextureKind;
  isDark: boolean;
  accentColor?: string;
  /** Optional: multiply the texture strength for thumbnails in PaperStyleModal (0.6 recommended). */
  intensity?: number;
}

function hexToRgb(hex: string) {
  let c = (hex || '#2C4F45').replace('#', '');
  if (c.length === 3) c = c.split('').map((ch) => ch + ch).join('');
  return {
    r: parseInt(c.slice(0, 2), 16) || 44,
    g: parseInt(c.slice(2, 4), 16) || 79,
    b: parseInt(c.slice(4, 6), 16) || 69,
  };
}

/**
 * Paper texture layer. Patterns use fixed pixel tiles, so spacing does not depend on
 * screen size. Rendered as the first child of the paper container so text sits above it.
 */
export function PaperTexture({
  texture,
  isDark,
  accentColor = '#2C4F45',
  intensity = 1,
}: PaperTextureProps) {
  const { r, g, b } = hexToRgb(accentColor);
  const rgba = (a: number) => `rgba(${r}, ${g}, ${b}, ${Math.min(1, a * intensity)})`;
  const clear = `rgba(${r}, ${g}, ${b}, 0)`;

  // Tuned so the mark is visible but never competes with the words.
  const alpha = useMemo(
    () => ({
      rule: isDark ? 0.14 : 0.12, // ruled lines are the strongest, since they guide the eye
      dots: isDark ? 0.14 : 0.12,
      rain: isDark ? 0.08 : 0.07, // sparse hatch, not streaks
      wash: isDark ? 0.10 : 0.08,
    }),
    [isDark],
  );

  if (texture === 'none') return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%">
        <Defs>
          {/* Ruled notebook lines, spaced to match the text line height */}
          <Pattern id="p-rule" patternUnits="userSpaceOnUse" width={24} height={PAPER_LINE_HEIGHT}>
            <Line
              x1={0}
              x2={24}
              y1={PAPER_LINE_HEIGHT - 0.5}
              y2={PAPER_LINE_HEIGHT - 0.5}
              stroke={rgba(alpha.rule)}
              strokeWidth={1}
            />
          </Pattern>

          {/* Dot grid, 24px spacing, like a dotted notebook */}
          <Pattern id="p-dots" patternUnits="userSpaceOnUse" width={24} height={24}>
            <Circle cx={1.5} cy={1.5} r={1.2} fill={rgba(alpha.dots)} />
          </Pattern>

          {/* Sparse diagonal hatch: a calm rain, not noise under handwriting */}
          <Pattern id="p-rain" patternUnits="userSpaceOnUse" width={28} height={28}>
            <Path
              d="M0 28 L28 0"
              stroke={rgba(alpha.rain)}
              strokeWidth={0.8}
              strokeLinecap="round"
            />
          </Pattern>

          {/* Soft wash from the top corner, fading out before the text area */}
          <RadialGradient id="p-wash" cx="0%" cy="0%" rx="90%" ry="70%" fx="0%" fy="0%">
            <Stop offset="0" stopColor={rgba(alpha.wash)} stopOpacity={1} />
            <Stop offset="1" stopColor={clear} stopOpacity={0} />
          </RadialGradient>
        </Defs>

        {texture === 'rule' && <Rect width="100%" height="100%" fill="url(#p-rule)" />}
        {texture === 'dots' && <Rect width="100%" height="100%" fill="url(#p-dots)" />}
        {texture === 'rain' && <Rect width="100%" height="100%" fill="url(#p-rain)" />}
        {texture === 'wash' && <Rect width="100%" height="100%" fill="url(#p-wash)" />}
      </Svg>
    </View>
  );
}
