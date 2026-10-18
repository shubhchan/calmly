import React from 'react';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useAppTheme } from '../../theme/ThemeContext';
import { StyleProp, ViewStyle, View } from 'react-native';

interface IllustrationProps {
  width?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

export function BreathworkIllustration({ width = 140, height = 120, style }: IllustrationProps) {
  const { colors, isDark } = useAppTheme();

  const primaryAccent = colors.primary.default;
  const leafTone = isDark ? '#7BD495' : '#3E7B52';
  const stoneTone = isDark ? '#263447' : '#E6E0D4';
  const airTone = isDark ? '#93C5FD' : '#60A5FA';

  return (
    <View style={[{ alignItems: 'center', justifyContent: 'center' }, style]}>
      <Svg width={width} height={height} viewBox="0 0 160 140" fill="none">
        <Defs>
          <LinearGradient id="breathFlowGrad" x1="20" y1="70" x2="140" y2="70" gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopColor={airTone} stopOpacity="0.1" />
            <Stop offset="50%" stopColor={primaryAccent} stopOpacity={isDark ? "0.4" : "0.3"} />
            <Stop offset="100%" stopColor={leafTone} stopOpacity="0.1" />
          </LinearGradient>
        </Defs>

        {/* Outer Expanding Breath Wave Ring */}
        <Circle cx="80" cy="70" r="56" stroke={primaryAccent} strokeWidth="1.2" strokeDasharray="3 4" strokeOpacity={0.35} />
        <Circle cx="80" cy="70" r="44" stroke={primaryAccent} strokeWidth="1.5" strokeOpacity={0.5} />
        <Circle cx="80" cy="70" r="32" fill="url(#breathFlowGrad)" />

        {/* Flowing Inhale/Exhale Sine Wave Stream */}
        <Path
          d="M24 70 C 44 48, 60 92, 80 70 C 100 48, 116 92, 136 70"
          stroke={primaryAccent}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <Path
          d="M32 76 C 50 58, 64 88, 80 76 C 96 64, 110 94, 128 76"
          stroke={airTone}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeOpacity={0.65}
        />

        {/* Central Lungs / Life Leaf Symbol */}
        <Path
          d="M74 54 C 62 60, 60 76, 72 82 C 78 74, 76 60, 74 54 Z"
          fill={primaryAccent}
          opacity={0.88}
        />
        <Path
          d="M86 54 C 98 60, 100 76, 88 82 C 82 74, 84 60, 86 54 Z"
          fill={leafTone}
          opacity={0.88}
        />

        {/* Central Stem */}
        <Path d="M80 50 L 80 90" stroke={isDark ? '#F9FAFB' : '#1A212D'} strokeWidth="1.8" strokeLinecap="round" />

        {/* Pulse Floating Nodes */}
        <Circle cx="80" cy="46" r="3" fill={primaryAccent} />
        <Circle cx="44" cy="46" r="2" fill={leafTone} opacity={0.7} />
        <Circle cx="116" cy="46" r="2" fill={leafTone} opacity={0.7} />
        <Circle cx="50" cy="98" r="2.5" fill={primaryAccent} opacity={0.6} />
        <Circle cx="110" cy="98" r="2.5" fill={primaryAccent} opacity={0.6} />
      </Svg>
    </View>
  );
}
