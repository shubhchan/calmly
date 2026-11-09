import React from 'react';
import { View } from 'react-native';
import Svg, { Defs, Pattern, Path, Circle, Rect, LinearGradient, Stop } from 'react-native-svg';
import type { PaperTextureKind } from '../../features/journal/papers';

/**
 * The texture layer of a paper.
 *
 * It paints under the text and never takes touches. Pattern ids are stable per
 * texture, so repeated textures on one screen share a definition safely.
 */
export function PaperTexture({ texture, isDark }: { texture: PaperTextureKind; isDark: boolean }) {
  if (texture === 'none') return null;

  const line = isDark ? 'rgba(154,198,180,0.10)' : 'rgba(44,79,69,0.08)';
  const gold = isDark ? 'rgba(210,176,120,0.10)' : 'rgba(176,138,79,0.13)';
  const wash = isDark ? 'rgba(154,198,180,0.05)' : 'rgba(44,79,69,0.05)';

  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id="paper-rain" patternUnits="userSpaceOnUse" width={7} height={7}>
            <Path d="M0 7 L7 0" stroke={line} strokeWidth={1} />
          </Pattern>
          <Pattern id="paper-rule" patternUnits="userSpaceOnUse" width={8} height={8}>
            <Path d="M0 7.5 H8" stroke={gold} strokeWidth={1} />
          </Pattern>
          <Pattern id="paper-dots" patternUnits="userSpaceOnUse" width={9} height={9}>
            <Circle cx={1} cy={1} r={1} fill={line} />
          </Pattern>
          <LinearGradient id="paper-wash" x1="0" y1="0" x2="0.7" y2="1">
            <Stop offset="0" stopColor={wash} stopOpacity={1} />
            <Stop offset="1" stopColor={wash} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        {texture === 'rain' ? <Rect width="100%" height="100%" fill="url(#paper-rain)" /> : null}
        {texture === 'rule' ? <Rect width="100%" height="100%" fill="url(#paper-rule)" /> : null}
        {texture === 'dots' ? <Rect width="100%" height="100%" fill="url(#paper-dots)" /> : null}
        {texture === 'wash' ? <Rect width="100%" height="100%" fill="url(#paper-wash)" /> : null}
      </Svg>
    </View>
  );
}
