import React from 'react';
import Svg, { Path, Circle, Rect, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useAppTheme } from '../../theme/ThemeContext';
import { StyleProp, ViewStyle, View } from 'react-native';

interface IllustrationProps {
  width?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

export function SelfCompassionIllustration({ width = 150, height = 130, style }: IllustrationProps) {
  const { colors, isDark } = useAppTheme();

  const primaryAccent = colors.primary.default;
  const roseAccent = colors.accents.rose || '#EB697F';
  const peachAccent = colors.accents.peach || '#EB876D';
  const bodyTone = isDark ? '#D1D5DB' : '#384455';
  const clothTone = isDark ? '#2D3E56' : '#E6DDD0';
  const stoneTone = isDark ? '#263447' : '#E6E0D4';

  return (
    <View style={[{ alignItems: 'center', justifyContent: 'center' }, style]}>
      <Svg width={width} height={height} viewBox="0 0 180 160" fill="none">
        <Defs>
          <LinearGradient id="compassionGrad" x1="90" y1="16" x2="90" y2="140" gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopColor={roseAccent} stopOpacity={isDark ? '0.3' : '0.18'} />
            <Stop offset="100%" stopColor={primaryAccent} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Ambient Protective Halo */}
        <Circle cx="90" cy="74" r="62" fill="url(#compassionGrad)" />
        <Circle cx="90" cy="74" r="62" stroke={roseAccent} strokeWidth="1" strokeDasharray="3 4" strokeOpacity={0.3} />
        <Circle cx="90" cy="74" r="46" stroke={primaryAccent} strokeWidth="0.8" strokeOpacity={0.2} />

        {/* Grounding Base Line */}
        <Path
          d="M40 144 C 64 138, 116 138, 140 144 C 126 148, 54 148, 40 144 Z"
          fill={stoneTone}
          opacity={0.7}
        />

        {/* Torso in Gentle Fold / Seated Self-Embrace */}
        <Path
          d="M72 138 C 72 108, 108 108, 108 138 Z"
          fill={clothTone}
        />

        {/* Arms Crossed Over Heart (Self-Embrace) */}
        <Path
          d="M70 114 C 76 98, 98 94, 108 104 C 98 108, 88 114, 76 122"
          stroke={primaryAccent}
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <Path
          d="M110 114 C 104 98, 82 94, 72 104 C 82 108, 92 114, 104 122"
          stroke={primaryAccent}
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Heart Light Glowing on Chest */}
        <Path
          d="M90 98 C 87 93, 80 93, 80 98 C 80 104, 90 109, 90 109 C 90 109, 100 104, 100 98 C 100 93, 93 93, 90 98 Z"
          fill={roseAccent}
          opacity={0.9}
        />

        {/* Neck */}
        <Rect x="87" y="70" width="6" height="8" rx="3" fill={bodyTone} />

        {/* Head tilted slightly in peaceful rest */}
        <Circle cx="90" cy="62" r="12" fill={bodyTone} />

        {/* Soft Serene Hairline */}
        <Path
          d="M78 60 C 78 48, 102 48, 102 60 C 98 55, 82 55, 78 60 Z"
          fill={isDark ? '#F9FAFB' : '#1A212D'}
        />

        {/* Peaceful Closed Eyes Arc */}
        <Path d="M85 64 Q 87 66.5 89 64" stroke={isDark ? '#0F141C' : '#1A212D'} strokeWidth="1" strokeLinecap="round" />
        <Path d="M91 64 Q 93 66.5 95 64" stroke={isDark ? '#0F141C' : '#1A212D'} strokeWidth="1" strokeLinecap="round" />

        {/* Floating Gentle Petals / Leaves */}
        <G>
          <Path d="M46 72 C 52 66, 58 70, 56 78 C 50 78, 46 76, 46 72 Z" fill={primaryAccent} opacity={0.7} />
          <Path d="M134 72 C 128 66, 122 70, 124 78 C 130 78, 134 76, 134 72 Z" fill={roseAccent} opacity={0.7} />
        </G>

        {/* Radiance Dots */}
        <Circle cx="90" cy="24" r="2.5" fill={roseAccent} />
        <Circle cx="64" cy="40" r="2" fill={primaryAccent} opacity={0.75} />
        <Circle cx="116" cy="40" r="2" fill={peachAccent} opacity={0.75} />
      </Svg>
    </View>
  );
}
