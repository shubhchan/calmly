import React from 'react';
import Svg, { Path, Circle, Rect, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useAppTheme } from '../../theme/ThemeContext';
import { StyleProp, ViewStyle, View } from 'react-native';

interface IllustrationProps {
  width?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

export function MeditationHeroIllustration({ width = 160, height = 140, style }: IllustrationProps) {
  const { colors, isDark } = useAppTheme();

  const primaryAccent = colors.primary.default;
  const secondaryAccent = colors.primary.subtle || (isDark ? '#1C3325' : '#EDF5EF');
  const auraFill = isDark ? 'rgba(94, 190, 123, 0.12)' : 'rgba(62, 123, 82, 0.08)';
  const bodyTone = isDark ? '#D1D5DB' : '#384455';
  const clothTone = primaryAccent;
  const hairTone = isDark ? '#F9FAFB' : '#1A212D';
  const leafTone = isDark ? '#7BD495' : '#3E7B52';
  const stoneTone = isDark ? '#263447' : '#E6E0D4';

  return (
    <View style={[{ alignItems: 'center', justifyContent: 'center' }, style]}>
      <Svg width={width} height={height} viewBox="0 0 200 180" fill="none">
        <Defs>
          <LinearGradient id="medAuraGrad" x1="100" y1="20" x2="100" y2="160" gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopColor={primaryAccent} stopOpacity={isDark ? "0.35" : "0.2"} />
            <Stop offset="100%" stopColor={primaryAccent} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Ambient Serenity Aura Rings */}
        <Circle cx="100" cy="90" r="72" fill="url(#medAuraGrad)" />
        <Circle cx="100" cy="90" r="54" stroke={primaryAccent} strokeWidth="1.2" strokeDasharray="4 4" strokeOpacity={0.4} />
        <Circle cx="100" cy="90" r="38" stroke={primaryAccent} strokeWidth="1" strokeOpacity={0.25} />

        {/* Grounding Base Mat / Stone */}
        <Path
          d="M36 150 C 65 142, 135 142, 164 150 C 145 158, 55 158, 36 150 Z"
          fill={stoneTone}
          opacity={0.8}
        />

        {/* Seated Figure - Legs in Lotus */}
        <Path
          d="M58 142 C 60 130, 85 130, 100 134 C 115 130, 140 130, 142 142 C 135 149, 115 150, 100 148 C 85 150, 65 149, 58 142 Z"
          fill={clothTone}
        />

        {/* Torso & Robe */}
        <Path
          d="M84 135 L 86 96 C 86 86, 114 86, 114 96 L 116 135 Z"
          fill={clothTone}
        />

        {/* Folded Arms / Mudra Hands */}
        <Path
          d="M86 102 C 80 114, 86 128, 98 130 L 102 130 C 114 128, 120 114, 114 102"
          stroke={clothTone}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Circle cx="100" cy="128" r="4.5" fill={bodyTone} />

        {/* Neck */}
        <Rect x="97" y="78" width="6" height="10" rx="3" fill={bodyTone} />

        {/* Head */}
        <Circle cx="100" cy="72" r="13" fill={bodyTone} />

        {/* Serene Hair Bun */}
        <Path
          d="M87 71 C 87 58, 113 58, 113 71 C 110 65, 90 65, 87 71 Z"
          fill={hairTone}
        />
        <Circle cx="100" cy="54" r="5.5" fill={hairTone} />

        {/* Peaceful Closed Eyes (Arc) */}
        <Path d="M94 73 Q 96 76 98 73" stroke={isDark ? '#0F141C' : '#1A212D'} strokeWidth="1.2" strokeLinecap="round" />
        <Path d="M102 73 Q 104 76 106 73" stroke={isDark ? '#0F141C' : '#1A212D'} strokeWidth="1.2" strokeLinecap="round" />

        {/* Floating Botanical Leaves Left */}
        <G>
          <Path d="M38 98 C 42 85, 52 82, 54 94 C 44 98, 40 108, 38 98 Z" fill={leafTone} opacity={0.85} />
          <Path d="M48 76 C 56 68, 64 74, 60 84 C 52 82, 48 84, 48 76 Z" fill={leafTone} opacity={0.65} />
          <Path d="M42 98 Q 50 82 58 72" stroke={primaryAccent} strokeWidth="1" strokeOpacity={0.5} strokeLinecap="round" />
        </G>

        {/* Floating Botanical Leaves Right */}
        <G>
          <Path d="M162 98 C 158 85, 148 82, 146 94 C 156 98, 160 108, 162 98 Z" fill={leafTone} opacity={0.85} />
          <Path d="M152 76 C 144 68, 136 74, 140 84 C 148 82, 152 84, 152 76 Z" fill={leafTone} opacity={0.65} />
          <Path d="M158 98 Q 150 82 142 72" stroke={primaryAccent} strokeWidth="1" strokeOpacity={0.5} strokeLinecap="round" />
        </G>

        {/* Floating Serenity Starlets */}
        <Circle cx="68" cy="46" r="2" fill={primaryAccent} opacity={0.7} />
        <Circle cx="132" cy="46" r="2" fill={primaryAccent} opacity={0.7} />
        <Circle cx="100" cy="34" r="2.5" fill={primaryAccent} opacity={0.85} />
      </Svg>
    </View>
  );
}
