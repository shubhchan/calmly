import React from 'react';
import Svg, { Path, Circle, Rect, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useAppTheme } from '../../theme/ThemeContext';
import { StyleProp, ViewStyle, View } from 'react-native';

interface IllustrationProps {
  width?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

export function NatureSoundscapeIllustration({ width = 160, height = 135, style }: IllustrationProps) {
  const { colors, isDark } = useAppTheme();

  const primaryAccent = colors.primary.default;
  const skyAccent = colors.accents.sky || '#6B9BCD';
  const peachAccent = colors.accents.peach || '#EB876D';
  const leafTone = isDark ? '#7BD495' : '#3E7B52';
  const stoneTone = isDark ? '#263447' : '#E6E0D4';
  const waterTone = isDark ? '#1F3A52' : '#DCEAF5';

  return (
    <View style={[{ alignItems: 'center', justifyContent: 'center' }, style]}>
      <Svg width={width} height={height} viewBox="0 0 180 150" fill="none">
        <Defs>
          <LinearGradient id="soundSkyGrad" x1="90" y1="10" x2="90" y2="130" gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopColor={skyAccent} stopOpacity={isDark ? '0.3' : '0.18'} />
            <Stop offset="50%" stopColor={primaryAccent} stopOpacity={isDark ? '0.15' : '0.08'} />
            <Stop offset="100%" stopColor={peachAccent} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Ethereal Sky Aura */}
        <Circle cx="90" cy="70" r="62" fill="url(#soundSkyGrad)" />
        <Circle cx="90" cy="70" r="62" stroke={primaryAccent} strokeWidth="1" strokeDasharray="3 4" strokeOpacity={0.3} />

        {/* Ambient Moon / Sun Halo */}
        <Circle cx="90" cy="46" r="18" fill={peachAccent} opacity={isDark ? 0.4 : 0.25} />
        <Circle cx="90" cy="46" r="11" fill={isDark ? '#FDE68A' : '#FBBF24'} opacity={0.7} />

        {/* Distant Rolling Hills / Mountain Ridge */}
        <Path
          d="M20 115 Q 60 75 100 102 T 160 115 L 160 135 L 20 135 Z"
          fill={stoneTone}
          opacity={0.8}
        />

        {/* Closer Green Ridge */}
        <Path
          d="M20 122 Q 70 94 120 116 T 160 124 L 160 140 L 20 140 Z"
          fill={leafTone}
          opacity={0.65}
        />

        {/* Calming Water Stream Base */}
        <Path
          d="M24 134 C 64 126, 116 126, 156 134 C 136 144, 44 144, 24 134 Z"
          fill={waterTone}
        />

        {/* Sound Acoustic Wave Ripples */}
        <Path d="M48 132 C 70 128, 110 128, 132 132" stroke={skyAccent} strokeWidth="1.2" strokeLinecap="round" strokeOpacity={0.8} />
        <Path d="M60 137 C 78 134, 102 134, 120 137" stroke={skyAccent} strokeWidth="1" strokeLinecap="round" strokeOpacity={0.6} />

        {/* Gentle Zen Pine / Bamboo Foliage */}
        <G>
          {/* Left Tree */}
          <Path d="M46 112 L 46 82 L 41 88 M 46 82 L 51 88" stroke={leafTone} strokeWidth="1.8" strokeLinecap="round" />
          <Circle cx="46" cy="80" r="6" fill={leafTone} opacity={0.85} />
          {/* Right Tree */}
          <Path d="M136 114 L 136 86 L 132 91 M 136 86 L 140 91" stroke={leafTone} strokeWidth="1.8" strokeLinecap="round" />
          <Circle cx="136" cy="84" r="5" fill={leafTone} opacity={0.85} />
        </G>

        {/* Gentle Rainfall / Mist Droplets */}
        <Path d="M68 34 L 66 42" stroke={skyAccent} strokeWidth="1.2" strokeLinecap="round" strokeOpacity={0.7} />
        <Path d="M112 36 L 110 44" stroke={skyAccent} strokeWidth="1.2" strokeLinecap="round" strokeOpacity={0.7} />
        <Path d="M78 54 L 76 62" stroke={skyAccent} strokeWidth="1.2" strokeLinecap="round" strokeOpacity={0.7} />
        <Path d="M122 56 L 120 64" stroke={skyAccent} strokeWidth="1.2" strokeLinecap="round" strokeOpacity={0.7} />

        {/* Peaceful Bird Silhouettes */}
        <Path d="M52 48 Q 56 44 60 48 Q 64 44 68 48" stroke={primaryAccent} strokeWidth="1" strokeLinecap="round" strokeOpacity={0.7} fill="none" />
        <Path d="M124 42 Q 127 39 130 42 Q 133 39 136 42" stroke={primaryAccent} strokeWidth="0.9" strokeLinecap="round" strokeOpacity={0.6} fill="none" />
      </Svg>
    </View>
  );
}
