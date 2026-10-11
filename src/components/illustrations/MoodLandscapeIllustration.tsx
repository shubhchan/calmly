import React from 'react';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useThemeColors } from '../../theme/ThemeContext';
import { StyleProp, ViewStyle, View } from 'react-native';

interface IllustrationProps {
  width?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

export function MoodLandscapeIllustration({ width = 140, height = 120, style }: IllustrationProps) {
  const colors = useThemeColors();
  const isDark = colors.isDark;

  const primaryAccent = colors.accentPrimary;
  const secondaryAccent = colors.accentLavender || (isDark ? '#A78BFA' : '#6C5CE7');
  const leafTone = isDark ? '#7BD495' : '#3E7B52';
  const stoneTone = isDark ? '#263447' : '#E6E0D4';
  const sunTone = isDark ? '#FB923C' : '#D96547';

  return (
    <View style={[{ alignItems: 'center', justifyContent: 'center' }, style]}>
      <Svg width={width} height={height} viewBox="0 0 160 140" fill="none">
        <Defs>
          <LinearGradient id="moodSkyGrad" x1="80" y1="20" x2="80" y2="130" gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopColor={sunTone} stopOpacity={isDark ? "0.3" : "0.15"} />
            <Stop offset="60%" stopColor={primaryAccent} stopOpacity={isDark ? "0.2" : "0.1"} />
            <Stop offset="100%" stopColor={primaryAccent} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Skyline Halo Circle */}
        <Circle cx="80" cy="70" r="54" fill="url(#moodSkyGrad)" />
        <Circle cx="80" cy="70" r="54" stroke={primaryAccent} strokeWidth="1" strokeDasharray="3 4" strokeOpacity={0.3} />

        {/* Gentle Zen Sun / Moon */}
        <Circle cx="80" cy="46" r="14" fill={sunTone} opacity={0.85} />
        {/* Soft Sun Ray Ring */}
        <Circle cx="80" cy="46" r="22" stroke={sunTone} strokeWidth="1" strokeDasharray="2 3" strokeOpacity={0.4} />

        {/* Background Zen Rolling Hill */}
        <Path
          d="M32 104 C 54 82, 90 86, 128 104 L 128 116 L 32 116 Z"
          fill={stoneTone}
          opacity={0.8}
        />

        {/* Foreground Zen Hill */}
        <Path
          d="M26 112 C 58 92, 102 96, 134 112 L 134 118 L 26 118 Z"
          fill={leafTone}
          opacity={0.75}
        />

        {/* Harmony Wave Base */}
        <Path
          d="M36 114 C 54 110, 70 118, 88 114 C 104 110, 118 118, 124 114"
          stroke={primaryAccent}
          strokeWidth="1.8"
          strokeLinecap="round"
        />

        {/* Emotional Reflection Starlets */}
        <Circle cx="44" cy="38" r="2" fill={primaryAccent} opacity={0.7} />
        <Circle cx="118" cy="36" r="2.5" fill={primaryAccent} opacity={0.8} />
        <Circle cx="106" cy="54" r="1.8" fill={primaryAccent} opacity={0.6} />
      </Svg>
    </View>
  );
}
