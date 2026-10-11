import React from 'react';
import Svg, { Path, Circle, Rect, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useThemeColors } from '../../theme/ThemeContext';
import { StyleProp, ViewStyle, View } from 'react-native';

interface IllustrationProps {
  width?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

export function HabitPlantingIllustration({ width = 150, height = 130, style }: IllustrationProps) {
  const colors = useThemeColors();
  const isDark = colors.isDark;

  const primaryAccent = colors.accentPrimary;
  const leafTone = isDark ? '#7BD495' : '#3E7B52';
  const leafHighlight = isDark ? '#9AE6B4' : '#5A955A';
  const potTone = isDark ? '#2D3E56' : '#E8DED1';
  const potRimTone = isDark ? '#3D5270' : '#D9CCC0';
  const soilTone = isDark ? '#202B3E' : '#C4B5A5';
  const ringDash = isDark ? 'rgba(123, 212, 149, 0.35)' : 'rgba(62, 123, 82, 0.25)';

  return (
    <View style={[{ alignItems: 'center', justifyContent: 'center' }, style]}>
      <Svg width={width} height={height} viewBox="0 0 180 160" fill="none">
        <Defs>
          <LinearGradient id="habitAuraGrad" x1="90" y1="20" x2="90" y2="140" gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopColor={primaryAccent} stopOpacity={isDark ? '0.28' : '0.16'} />
            <Stop offset="100%" stopColor={primaryAccent} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Ambient Growth Energy Halo */}
        <Circle cx="90" cy="76" r="62" fill="url(#habitAuraGrad)" />
        <Circle cx="90" cy="76" r="62" stroke={primaryAccent} strokeWidth="1" strokeDasharray="4 4" strokeOpacity={0.35} />
        <Circle cx="90" cy="76" r="46" stroke={primaryAccent} strokeWidth="1" strokeOpacity={0.15} />

        {/* Gentle Zen Base Platform */}
        <Path
          d="M34 142 C 58 136, 122 136, 146 142 C 132 148, 48 148, 34 142 Z"
          fill={potRimTone}
          opacity={0.6}
        />

        {/* Ceramic Planter Pot */}
        <Path
          d="M62 108 L 68 136 C 68 140, 112 140, 112 136 L 118 108 Z"
          fill={potTone}
        />
        {/* Pot Rim */}
        <Rect x="58" y="103" width="64" height="7" rx="3.5" fill={potRimTone} />
        {/* Soil Base */}
        <Path d="M62 107 C 74 104, 106 104, 118 107" stroke={soilTone} strokeWidth="3" strokeLinecap="round" />

        {/* Central Sprouting Stem */}
        <Path
          d="M90 106 C 90 84, 88 66, 90 48"
          stroke={leafTone}
          strokeWidth="2.8"
          strokeLinecap="round"
        />

        {/* Sprouting First Leaf Pair - Left */}
        <G>
          <Path
            d="M89 82 C 70 78, 62 88, 68 96 C 76 96, 84 90, 89 82 Z"
            fill={leafTone}
          />
          <Path
            d="M89 82 C 78 84, 72 88, 70 93"
            stroke={leafHighlight}
            strokeWidth="0.9"
            strokeLinecap="round"
          />
        </G>

        {/* Sprouting First Leaf Pair - Right */}
        <G>
          <Path
            d="M91 74 C 110 70, 118 80, 112 88 C 104 88, 96 82, 91 74 Z"
            fill={leafTone}
          />
          <Path
            d="M91 74 C 102 76, 108 80, 110 85"
            stroke={leafHighlight}
            strokeWidth="0.9"
            strokeLinecap="round"
          />
        </G>

        {/* Top Fresh Budding Leaves */}
        <G>
          <Path
            d="M90 48 C 80 34, 90 24, 90 24 C 90 24, 100 34, 90 48 Z"
            fill={leafHighlight}
          />
          <Path
            d="M90 48 C 76 42, 74 54, 82 58 C 86 56, 88 52, 90 48 Z"
            fill={leafTone}
          />
          <Path
            d="M90 44 C 104 38, 106 50, 98 54 C 94 52, 92 48, 90 44 Z"
            fill={leafTone}
          />
        </G>

        {/* Nourishing Dew Drops / Mindful Ripples */}
        <Circle cx="90" cy="18" r="3" fill={primaryAccent} />
        <Circle cx="64" cy="46" r="2" fill={primaryAccent} opacity={0.7} />
        <Circle cx="122" cy="48" r="2.2" fill={primaryAccent} opacity={0.75} />
        <Circle cx="132" cy="80" r="1.8" fill={primaryAccent} opacity={0.6} />
        <Circle cx="48" cy="78" r="1.8" fill={primaryAccent} opacity={0.6} />

        {/* Daily Sunlight Radiance Arcs */}
        <Path d="M82 12 Q 90 8 98 12" stroke={primaryAccent} strokeWidth="1.2" strokeLinecap="round" strokeOpacity={0.6} />
      </Svg>
    </View>
  );
}
