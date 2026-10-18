import React from 'react';
import Svg, { Path, Circle, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useAppTheme } from '../../theme/ThemeContext';
import { StyleProp, ViewStyle, View } from 'react-native';

interface IllustrationProps {
  width?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

export function GratitudeBloomIllustration({ width = 150, height = 130, style }: IllustrationProps) {
  const { colors, isDark } = useAppTheme();

  const primaryAccent = colors.primary.default;
  const peachAccent = colors.accents.peach || '#EB876D';
  const leafTone = isDark ? '#7BD495' : '#3E7B52';
  const petalTone = isDark ? '#EB876D' : '#D96547';
  const petalLight = isDark ? '#F5B09E' : '#F6A896';
  const handsTone = isDark ? '#2D3E56' : '#E6DDD0';

  return (
    <View style={[{ alignItems: 'center', justifyContent: 'center' }, style]}>
      <Svg width={width} height={height} viewBox="0 0 180 160" fill="none">
        <Defs>
          <LinearGradient id="gratBloomGrad" x1="90" y1="16" x2="90" y2="140" gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopColor={peachAccent} stopOpacity={isDark ? '0.3' : '0.18'} />
            <Stop offset="100%" stopColor={primaryAccent} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Radiating Warmth Halo */}
        <Circle cx="90" cy="74" r="64" fill="url(#gratBloomGrad)" />
        <Circle cx="90" cy="74" r="64" stroke={peachAccent} strokeWidth="1" strokeDasharray="3 4" strokeOpacity={0.3} />
        <Circle cx="90" cy="74" r="48" stroke={primaryAccent} strokeWidth="0.9" strokeOpacity={0.2} />

        {/* Gentle Cupped Hands at Base */}
        {/* Left Palm / Wrist */}
        <Path
          d="M48 136 C 54 116, 68 108, 86 116 C 76 126, 64 136, 48 136 Z"
          fill={handsTone}
        />
        {/* Right Palm / Wrist */}
        <Path
          d="M132 136 C 126 116, 112 108, 94 116 C 104 126, 116 136, 132 136 Z"
          fill={handsTone}
        />

        {/* Blooming Calyx / Leaf Base */}
        <G>
          <Path
            d="M90 106 C 74 114, 62 102, 68 94 C 78 96, 86 100, 90 106 Z"
            fill={leafTone}
            opacity={0.9}
          />
          <Path
            d="M90 106 C 106 114, 118 102, 112 94 C 102 96, 94 100, 90 106 Z"
            fill={leafTone}
            opacity={0.9}
          />
        </G>

        {/* Outer Lotus Petals */}
        <Path
          d="M90 100 C 66 90, 58 64, 72 52 C 84 66, 88 88, 90 100 Z"
          fill={petalTone}
          opacity={0.8}
        />
        <Path
          d="M90 100 C 114 90, 122 64, 108 52 C 96 66, 92 88, 90 100 Z"
          fill={petalTone}
          opacity={0.8}
        />

        {/* Inner Gentle Petals */}
        <Path
          d="M90 100 C 76 86, 74 58, 86 42 C 92 56, 92 80, 90 100 Z"
          fill={petalLight}
        />
        <Path
          d="M90 100 C 104 86, 106 58, 94 42 C 88 56, 88 80, 90 100 Z"
          fill={petalLight}
        />

        {/* Central Crown Petal */}
        <Path
          d="M90 98 C 84 76, 84 50, 90 32 C 96 50, 96 76, 90 98 Z"
          fill={petalTone}
        />

        {/* Glowing Heart of the Blossom */}
        <Circle cx="90" cy="74" r="5" fill="#FFE5A3" />
        <Circle cx="90" cy="74" r="2.5" fill="#FFFFFF" />

        {/* Floating Sparks of Gratitude */}
        <Circle cx="90" cy="22" r="3" fill={peachAccent} />
        <Circle cx="64" cy="38" r="2.2" fill={primaryAccent} opacity={0.8} />
        <Circle cx="116" cy="38" r="2.2" fill={primaryAccent} opacity={0.8} />
        <Circle cx="44" cy="68" r="1.8" fill={peachAccent} opacity={0.7} />
        <Circle cx="136" cy="68" r="1.8" fill={peachAccent} opacity={0.7} />

        {/* Gentle Serenity Stars */}
        <Path d="M90 12 L 91.5 16 L 95.5 17.5 L 91.5 19 L 90 23 L 88.5 19 L 84.5 17.5 L 88.5 16 Z" fill={peachAccent} opacity={0.9} />
      </Svg>
    </View>
  );
}
