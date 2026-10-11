import React from 'react';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useThemeColors } from '../../theme/ThemeContext';
import { StyleProp, ViewStyle, View } from 'react-native';

interface IllustrationProps {
  width?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

export function JournalReflectionIllustration({ width = 140, height = 120, style }: IllustrationProps) {
  const colors = useThemeColors();
  const isDark = colors.isDark;

  const primaryAccent = colors.accentPrimary;
  const leafTone = isDark ? '#7BD495' : '#3E7B52';
  const stoneTone = isDark ? '#263447' : '#E6E0D4';
  const paperTone = isDark ? '#1E2838' : '#FAF6EE';
  const lineTone = isDark ? '#374761' : '#D5CCC0';

  return (
    <View style={[{ alignItems: 'center', justifyContent: 'center' }, style]}>
      <Svg width={width} height={height} viewBox="0 0 160 140" fill="none">
        <Defs>
          <LinearGradient id="journalAuraGrad" x1="80" y1="20" x2="80" y2="130" gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopColor={primaryAccent} stopOpacity={isDark ? "0.25" : "0.15"} />
            <Stop offset="100%" stopColor={primaryAccent} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Ambient Halo */}
        <Circle cx="80" cy="70" r="54" fill="url(#journalAuraGrad)" />
        <Circle cx="80" cy="70" r="54" stroke={primaryAccent} strokeWidth="1" strokeDasharray="3 4" strokeOpacity={0.3} />

        {/* Book Base Cover */}
        <Path
          d="M32 94 C 54 86, 78 88, 80 94 C 82 88, 106 86, 128 94 L 126 100 C 104 92, 82 94, 80 100 C 78 94, 56 92, 34 100 Z"
          fill={stoneTone}
        />

        {/* Left Open Page */}
        <Path
          d="M36 50 C 56 44, 76 48, 78 54 L 78 92 C 76 86, 56 82, 36 88 Z"
          fill={paperTone}
          stroke={lineTone}
          strokeWidth="1"
        />
        {/* Left Page Writing Lines */}
        <Path d="M44 60 C 54 58, 66 60, 70 62" stroke={lineTone} strokeWidth="1.2" strokeLinecap="round" />
        <Path d="M44 68 C 54 66, 66 68, 70 70" stroke={lineTone} strokeWidth="1.2" strokeLinecap="round" />
        <Path d="M44 76 C 54 74, 66 76, 70 78" stroke={lineTone} strokeWidth="1.2" strokeLinecap="round" />

        {/* Right Open Page */}
        <Path
          d="M124 50 C 104 44, 84 48, 82 54 L 82 92 C 84 86, 104 82, 124 88 Z"
          fill={paperTone}
          stroke={lineTone}
          strokeWidth="1"
        />
        {/* Right Page Writing Lines */}
        <Path d="M90 62 C 94 60, 106 58, 116 60" stroke={lineTone} strokeWidth="1.2" strokeLinecap="round" />
        <Path d="M90 70 C 94 68, 106 66, 116 68" stroke={lineTone} strokeWidth="1.2" strokeLinecap="round" />
        <Path d="M90 78 C 94 76, 106 74, 116 76" stroke={lineTone} strokeWidth="1.2" strokeLinecap="round" />

        {/* Spine Growth Sprout Flowing Outward */}
        <Path
          d="M80 54 C 80 38, 86 30, 96 26"
          stroke={primaryAccent}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <Path
          d="M96 26 C 94 34, 88 34, 86 36 C 90 32, 94 30, 96 26 Z"
          fill={leafTone}
        />
        <Path
          d="M84 40 C 78 36, 76 42, 80 44 C 84 44, 84 42, 84 40 Z"
          fill={leafTone}
          opacity={0.85}
        />

        {/* Floating Mindful Sparkles */}
        <Circle cx="64" cy="34" r="2.5" fill={primaryAccent} />
        <Circle cx="112" cy="38" r="2" fill={primaryAccent} opacity={0.7} />
        <Circle cx="80" cy="116" r="2.5" fill={primaryAccent} opacity={0.8} />
      </Svg>
    </View>
  );
}
