import React from 'react';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useThemeColors } from '../../theme/ThemeContext';
import { StyleProp, ViewStyle, View } from 'react-native';

interface IllustrationProps {
  width?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

export function BodyScanIllustration({ width = 140, height = 120, style }: IllustrationProps) {
  const colors = useThemeColors();
  const isDark = colors.isDark;

  const primaryAccent = colors.accentPrimary;
  const bodyTone = isDark ? '#D1D5DB' : '#384455';
  const stoneTone = isDark ? '#263447' : '#E6E0D4';
  const nodeTone = isDark ? '#7BD495' : '#3E7B52';

  return (
    <View style={[{ alignItems: 'center', justifyContent: 'center' }, style]}>
      <Svg width={width} height={height} viewBox="0 0 160 140" fill="none">
        <Defs>
          <LinearGradient id="bodyScanGrad" x1="80" y1="10" x2="80" y2="130" gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopColor={primaryAccent} stopOpacity={isDark ? "0.25" : "0.15"} />
            <Stop offset="100%" stopColor={primaryAccent} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Outer Somatic Scan Halo */}
        <Circle cx="80" cy="70" r="56" fill="url(#bodyScanGrad)" />
        <Circle cx="80" cy="70" r="56" stroke={primaryAccent} strokeWidth="1" strokeDasharray="3 4" strokeOpacity={0.3} />

        {/* Head */}
        <Circle cx="80" cy="30" r="11" fill={stoneTone} opacity={0.9} />
        {/* Crown Node */}
        <Circle cx="80" cy="30" r="4" fill={nodeTone} />

        {/* Neck & Shoulders Flow */}
        <Path
          d="M78 41 L 82 41 L 82 48 L 78 48 Z"
          fill={stoneTone}
        />
        <Path
          d="M54 58 C 62 50, 98 50, 106 58 L 102 78 C 96 74, 64 74, 58 78 Z"
          fill={stoneTone}
          opacity={0.85}
        />

        {/* Shoulder Nodes */}
        <Circle cx="58" cy="56" r="3.5" fill={primaryAccent} />
        <Circle cx="102" cy="56" r="3.5" fill={primaryAccent} />
        {/* Heart / Chest Center Node */}
        <Circle cx="80" cy="64" r="5" fill={nodeTone} />
        <Circle cx="80" cy="64" r="8" stroke={primaryAccent} strokeWidth="1" strokeOpacity={0.5} />

        {/* Torso & Core */}
        <Path
          d="M66 78 C 66 94, 94 94, 94 78 Z"
          fill={stoneTone}
          opacity={0.7}
        />
        {/* Solar Plexus Node */}
        <Circle cx="80" cy="84" r="4" fill={primaryAccent} />

        {/* Grounded Base */}
        <Circle cx="80" cy="100" r="3.5" fill={nodeTone} />
        <Path
          d="M48 114 C 64 108, 96 108, 112 114"
          stroke={primaryAccent}
          strokeWidth="2"
          strokeLinecap="round"
          strokeOpacity={0.5}
        />

        {/* Horizontal Scan Rays */}
        <Path d="M34 56 L 46 56" stroke={primaryAccent} strokeWidth="1.5" strokeLinecap="round" strokeOpacity={0.6} />
        <Path d="M114 56 L 126 56" stroke={primaryAccent} strokeWidth="1.5" strokeLinecap="round" strokeOpacity={0.6} />
        <Path d="M38 64 L 50 64" stroke={nodeTone} strokeWidth="1.5" strokeLinecap="round" strokeOpacity={0.6} />
        <Path d="M110 64 L 122 64" stroke={nodeTone} strokeWidth="1.5" strokeLinecap="round" strokeOpacity={0.6} />
        <Path d="M42 84 L 54 84" stroke={primaryAccent} strokeWidth="1.5" strokeLinecap="round" strokeOpacity={0.6} />
        <Path d="M106 84 L 118 84" stroke={primaryAccent} strokeWidth="1.5" strokeLinecap="round" strokeOpacity={0.6} />
      </Svg>
    </View>
  );
}
