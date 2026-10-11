import React from 'react';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useThemeColors } from '../../theme/ThemeContext';
import { StyleProp, ViewStyle, View } from 'react-native';

interface IllustrationProps {
  width?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

export function MoodAuraIllustration({ width = 140, height = 120, style }: IllustrationProps) {
  const colors = useThemeColors();
  const isDark = colors.isDark;

  const primaryAccent = colors.accentPrimary;
  const skyAccent = colors.accentSky || '#6B9BCD';
  const peachAccent = colors.accentPeach || '#EB876D';
  const stoneTone = isDark ? '#263447' : '#E6E0D4';

  return (
    <View style={[{ alignItems: 'center', justifyContent: 'center' }, style]}>
      <Svg width={width} height={height} viewBox="0 0 160 140" fill="none">
        <Defs>
          <LinearGradient id="moodAuraGrad" x1="80" y1="16" x2="80" y2="124" gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopColor={skyAccent} stopOpacity={isDark ? '0.3' : '0.18'} />
            <Stop offset="50%" stopColor={primaryAccent} stopOpacity={isDark ? '0.2' : '0.1'} />
            <Stop offset="100%" stopColor={peachAccent} stopOpacity={isDark ? '0.25' : '0.12'} />
          </LinearGradient>
        </Defs>

        {/* Outer Aura Halo */}
        <Circle cx="80" cy="70" r="58" fill="url(#moodAuraGrad)" />
        <Circle cx="80" cy="70" r="58" stroke={primaryAccent} strokeWidth="1" strokeDasharray="4 4" strokeOpacity={0.3} />
        <Circle cx="80" cy="70" r="44" stroke={skyAccent} strokeWidth="0.8" strokeOpacity={0.25} />

        {/* Horizon Harmony Line */}
        <Path d="M26 70 C 46 64, 114 64, 134 70" stroke={stoneTone} strokeWidth="1.2" strokeOpacity={0.7} />

        {/* Upper Serenity Wave (Calm / Peace) */}
        <Path
          d="M80 70 C 58 70, 50 44, 66 32 C 82 20, 96 36, 80 70 Z"
          fill={primaryAccent}
          opacity={0.85}
        />
        {/* Upper Zen Eye / Light */}
        <Circle cx="68" cy="42" r="3" fill="#FFFFFF" opacity={0.9} />

        {/* Lower Warmth Wave (Vitality / Emotion) */}
        <Path
          d="M80 70 C 102 70, 110 96, 94 108 C 78 120, 64 104, 80 70 Z"
          fill={peachAccent}
          opacity={0.85}
        />
        {/* Lower Zen Eye / Warmth */}
        <Circle cx="92" cy="98" r="3" fill="#FFFFFF" opacity={0.9} />

        {/* Central Equilibrium Node */}
        <Circle cx="80" cy="70" r="4.5" fill={skyAccent} />
        <Circle cx="80" cy="70" r="2" fill="#FFFFFF" />

        {/* Surrounding Emotional Resonance Radii */}
        <Circle cx="44" cy="46" r="2.2" fill={primaryAccent} opacity={0.75} />
        <Circle cx="116" cy="94" r="2.2" fill={peachAccent} opacity={0.75} />
        <Circle cx="120" cy="46" r="1.8" fill={skyAccent} opacity={0.7} />
        <Circle cx="40" cy="94" r="1.8" fill={skyAccent} opacity={0.7} />
        <Circle cx="80" cy="20" r="2.5" fill={primaryAccent} opacity={0.85} />
        <Circle cx="80" cy="120" r="2.5" fill={peachAccent} opacity={0.85} />
      </Svg>
    </View>
  );
}
