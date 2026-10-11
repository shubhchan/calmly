import React from 'react';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useThemeColors } from '../../theme/ThemeContext';
import { StyleProp, ViewStyle, View } from 'react-native';

interface IllustrationProps {
  width?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

export function PanicAnchorIllustration({ width = 140, height = 120, style }: IllustrationProps) {
  const colors = useThemeColors();
  const isDark = colors.isDark;

  const roseAccent = colors.accentRose || (isDark ? '#F47293' : '#DB3A60');
  const primaryAccent = colors.accentPrimary;
  const stoneTone = isDark ? '#263447' : '#E6E0D4';

  return (
    <View style={[{ alignItems: 'center', justifyContent: 'center' }, style]}>
      <Svg width={width} height={height} viewBox="0 0 160 140" fill="none">
        <Defs>
          <LinearGradient id="panicAuraGrad" x1="80" y1="15" x2="80" y2="135" gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopColor={roseAccent} stopOpacity={isDark ? "0.3" : "0.15"} />
            <Stop offset="100%" stopColor={primaryAccent} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Outer Protective Shield Halo */}
        <Circle cx="80" cy="70" r="56" fill="url(#panicAuraGrad)" />
        <Circle cx="80" cy="70" r="56" stroke={roseAccent} strokeWidth="1" strokeDasharray="4 4" strokeOpacity={0.35} />

        {/* Solid Grounding Horizon Base Stones */}
        <Path
          d="M28 116 C 54 104, 106 104, 132 116 L 124 122 C 100 114, 60 114, 36 122 Z"
          fill={stoneTone}
          opacity={0.9}
        />

        {/* Central Anchor / Protective Shield Crest */}
        <Path
          d="M80 34 C 98 34, 112 44, 112 66 C 112 90, 80 110, 80 110 C 80 110, 48 90, 48 66 C 48 44, 62 34, 80 34 Z"
          stroke={roseAccent}
          strokeWidth="2.5"
          fill={isDark ? 'rgba(244, 114, 147, 0.12)' : 'rgba(219, 58, 96, 0.08)'}
        />

        {/* Anchor Ring Top */}
        <Circle cx="80" cy="48" r="7" stroke={roseAccent} strokeWidth="2.2" fill="none" />
        {/* Anchor Vertical Shaft */}
        <Path d="M80 55 L 80 94" stroke={roseAccent} strokeWidth="2.5" strokeLinecap="round" />
        {/* Anchor Crossbar */}
        <Path d="M68 66 L 92 66" stroke={roseAccent} strokeWidth="2.5" strokeLinecap="round" />
        {/* Anchor Bottom Fluke Arc */}
        <Path
          d="M62 82 C 64 96, 96 96, 98 82"
          stroke={roseAccent}
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Calming Harbor Steadying Waves */}
        <Path
          d="M44 102 C 60 98, 70 106, 80 102 C 90 98, 100 106, 116 102"
          stroke={primaryAccent}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeOpacity={0.7}
        />

        {/* Serenity Guiding Starlet */}
        <Circle cx="80" cy="24" r="3" fill={primaryAccent} />
        <Circle cx="50" cy="40" r="2" fill={primaryAccent} opacity={0.6} />
        <Circle cx="110" cy="40" r="2" fill={primaryAccent} opacity={0.6} />
      </Svg>
    </View>
  );
}
