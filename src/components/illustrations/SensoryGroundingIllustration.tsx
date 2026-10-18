import React from 'react';
import Svg, { Path, Circle, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useAppTheme } from '../../theme/ThemeContext';
import { StyleProp, ViewStyle, View } from 'react-native';

interface IllustrationProps {
  width?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

export function SensoryGroundingIllustration({ width = 140, height = 120, style }: IllustrationProps) {
  const { colors, isDark } = useAppTheme();

  const primaryAccent = colors.primary.default;
  const leafTone = isDark ? '#7BD495' : '#3E7B52';
  const stoneTone = isDark ? '#263447' : '#E6E0D4';
  const warmAccent = isDark ? '#FB923C' : '#D96547';

  return (
    <View style={[{ alignItems: 'center', justifyContent: 'center' }, style]}>
      <Svg width={width} height={height} viewBox="0 0 160 140" fill="none">
        <Defs>
          <LinearGradient id="groundGrad" x1="80" y1="20" x2="80" y2="130" gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopColor={primaryAccent} stopOpacity={isDark ? "0.3" : "0.15"} />
            <Stop offset="100%" stopColor={primaryAccent} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Ambient Aura Background */}
        <Circle cx="80" cy="70" r="54" fill="url(#groundGrad)" />
        <Circle cx="80" cy="70" r="54" stroke={primaryAccent} strokeWidth="1" strokeDasharray="4 4" strokeOpacity={0.3} />

        {/* Supporting Open Caring Hand */}
        <Path
          d="M48 98 C 50 86, 60 84, 70 88 L 84 92 C 92 94, 104 90, 114 96 C 118 100, 112 108, 98 108 L 68 108 C 54 108, 46 104, 48 98 Z"
          fill={stoneTone}
          opacity={0.85}
        />
        <Path
          d="M58 92 C 58 80, 66 78, 74 84 L 88 88"
          stroke={primaryAccent}
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* 1. SIGHT - Gentle Eye Center */}
        <G transform="translate(80, 48)">
          <Path d="M-14 0 Q 0 -9 14 0 Q 0 9 -14 0 Z" stroke={primaryAccent} strokeWidth="1.8" fill="none" />
          <Circle cx="0" cy="0" r="4" fill={primaryAccent} />
        </G>

        {/* 2. TOUCH - Tactile Sprout Leaf Left */}
        <G transform="translate(42, 60)">
          <Path d="M0 10 C -6 2, -2 -8, 6 -6 C 8 2, 6 8, 0 10 Z" fill={leafTone} opacity={0.9} />
          <Path d="M0 10 L 4 -2" stroke={isDark ? '#F9FAFB' : '#1A212D'} strokeWidth="1" />
        </G>

        {/* 3. SOUND - Acoustic Vibration Arc Right */}
        <G transform="translate(118, 60)">
          <Path d="M-4 -8 A 12 12 0 0 1 -4 8" stroke={primaryAccent} strokeWidth="2" strokeLinecap="round" />
          <Path d="M2 -13 A 18 18 0 0 1 2 13" stroke={primaryAccent} strokeWidth="1.5" strokeLinecap="round" strokeOpacity={0.6} />
        </G>

        {/* 4. SMELL - Botanical Blossom Top */}
        <G transform="translate(80, 24)">
          <Circle cx="0" cy="0" r="3.5" fill={warmAccent} />
          <Circle cx="-5" cy="-2" r="3" fill={leafTone} opacity={0.8} />
          <Circle cx="5" cy="-2" r="3" fill={leafTone} opacity={0.8} />
          <Circle cx="0" cy="-6" r="3" fill={leafTone} opacity={0.8} />
        </G>

        {/* 5. TASTE - Cold Water Refreshment Droplet */}
        <G transform="translate(104, 38)">
          <Path d="M0 -6 C 4 -2, 4 4, 0 6 C -4 4, -4 -2, 0 -6 Z" fill={primaryAccent} opacity={0.85} />
        </G>

        {/* Anchoring Starlets */}
        <Circle cx="54" cy="40" r="2" fill={warmAccent} opacity={0.7} />
        <Circle cx="80" cy="120" r="2.5" fill={primaryAccent} opacity={0.8} />
      </Svg>
    </View>
  );
}
