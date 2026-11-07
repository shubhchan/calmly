import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { useAppTheme } from '../../theme/ThemeContext';
import { withAlpha } from '../../theme/tokens';

/**
 * Shared illustration scene used by every illustration in the app.
 *
 * Follows the Calmly illustration language:
 * - two fills and one tint: pine (primary), reed (gold), mist (primary.subtle)
 * - no outlines around shapes, no gradients, no texture
 * - heads are solid shapes; expression comes from posture
 * - one subject with clear space reserved for copy above
 *
 * Every variant is the same seated figure by water. The variant changes the
 * reed accent and one small prop so the set reads as one family.
 */
export type ZenVariant =
  | 'meditation'
  | 'breath'
  | 'soundscape'
  | 'senses'
  | 'bodyScan'
  | 'panic'
  | 'journal'
  | 'landscape'
  | 'planting'
  | 'bloom'
  | 'aura'
  | 'compassion'
  | 'affirmation'
  | 'privacy'
  | 'reframe'
  | 'control'
  | 'rest';

type ArmPose = 'mudra' | 'heart' | 'book' | 'flower' | 'plant' | 'reach' | 'ground';

const VARIANT_ARMS: Record<ZenVariant, ArmPose> = {
  meditation: 'mudra',
  breath: 'mudra',
  soundscape: 'mudra',
  senses: 'reach',
  bodyScan: 'ground',
  panic: 'heart',
  journal: 'book',
  landscape: 'mudra',
  planting: 'plant',
  bloom: 'flower',
  aura: 'mudra',
  compassion: 'heart',
  affirmation: 'reach',
  privacy: 'mudra',
  reframe: 'mudra',
  control: 'mudra',
  rest: 'mudra',
};

export interface ZenIllustrationProps {
  width?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

interface ZenNatureSceneProps extends ZenIllustrationProps {
  variant: ZenVariant;
}

const GROUND = 148;

function Reed({ x, y, scale = 1, rotate = 0, color }: { x: number; y: number; scale?: number; rotate?: number; color: string }) {
  return (
    <G transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      <Path d="M0 0 C 2 -10 3 -18 3 -26" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" opacity={0.75} />
      <Path d="M3 -18 C -2 -24 -2 -30 3 -34 C 8 -28 8 -22 3 -18 Z" fill={color} opacity={0.85} />
      <Path d="M3 -10 C 9 -15 14 -13 15 -9 C 10 -6 5 -7 3 -10 Z" fill={color} opacity={0.55} />
    </G>
  );
}

function Lotus({ x, y, scale = 1, color, core }: { x: number; y: number; scale?: number; color: string; core: string }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${scale})`}>
      <Path d="M0 0 C -10 -3 -13 -8 -12 -13 C -6 -14 -2 -7 0 0 Z" fill={color} opacity={0.7} />
      <Path d="M0 0 C 10 -3 13 -8 12 -13 C 6 -14 2 -7 0 0 Z" fill={color} opacity={0.7} />
      <Path d="M0 0 C -5 -5 -6 -12 0 -18 C 6 -12 5 -5 0 0 Z" fill={color} />
      <Circle cx="0" cy="-2" r="2.2" fill={core} />
    </G>
  );
}

function Figure({ pine, mist, reed, arms }: { pine: string; mist: string; reed: string; arms: ArmPose }) {
  return (
    <G>
      {/* seated shadow */}
      <Ellipse cx="100" cy="152" rx="44" ry="6" fill={mist} />

      {/* crossed legs */}
      <Path
        d="M62 148 C 72 137 88 134 100 138 C 112 134 128 137 138 148 C 126 153 112 154 100 152 C 88 154 74 153 62 148 Z"
        fill={pine}
      />

      {/* torso */}
      <Path d="M87 143 C 84 127 85 114 89 106 C 93 99 107 99 111 106 C 115 114 116 127 113 143 Z" fill={pine} />

      {/* arms */}
      {arms === 'mudra' && (
        <G>
          <Path d="M90 110 C 83 119 83 130 92 136" stroke={pine} strokeWidth="6.5" strokeLinecap="round" fill="none" />
          <Path d="M110 110 C 117 119 117 130 108 136" stroke={pine} strokeWidth="6.5" strokeLinecap="round" fill="none" />
        </G>
      )}
      {arms === 'heart' && (
        <G>
          <Path d="M111 110 C 118 119 118 130 109 136" stroke={pine} strokeWidth="6.5" strokeLinecap="round" fill="none" />
          <Path d="M89 110 C 80 116 85 126 97 123" stroke={pine} strokeWidth="6.5" strokeLinecap="round" fill="none" />
        </G>
      )}
      {arms === 'book' && (
        <G>
          <Path d="M90 112 C 85 121 88 130 95 133" stroke={pine} strokeWidth="6.5" strokeLinecap="round" fill="none" />
          <Path d="M110 112 C 115 121 112 130 105 133" stroke={pine} strokeWidth="6.5" strokeLinecap="round" fill="none" />
          <Rect x="86" y="127" width="28" height="11" rx="2.5" fill={mist} />
          <Path d="M100 128 L100 138" stroke={pine} strokeWidth="1" opacity={0.45} />
        </G>
      )}
      {arms === 'flower' && (
        <G>
          <Path d="M90 110 C 83 119 83 130 92 136" stroke={pine} strokeWidth="6.5" strokeLinecap="round" fill="none" />
          <Path d="M110 110 C 117 119 117 130 108 136" stroke={pine} strokeWidth="6.5" strokeLinecap="round" fill="none" />
          <Lotus x={100} y={132} scale={0.68} color={pine} core={reed} />
        </G>
      )}
      {arms === 'plant' && (
        <G>
          <Path d="M90 110 C 83 119 83 130 92 136" stroke={pine} strokeWidth="6.5" strokeLinecap="round" fill="none" />
          <Path d="M110 112 C 117 120 121 130 123 139" stroke={pine} strokeWidth="6.5" strokeLinecap="round" fill="none" />
          <Path d="M123 139 C 124 130 126 124 128 120" stroke={pine} strokeWidth="1.6" strokeLinecap="round" fill="none" opacity={0.7} />
          <Path d="M128 126 C 122 125 120 120 123 117 C 128 119 130 123 128 126 Z" fill={pine} opacity={0.8} />
        </G>
      )}
      {arms === 'reach' && (
        <G>
          <Path d="M90 109 C 80 103 70 99 62 100" stroke={pine} strokeWidth="6.5" strokeLinecap="round" fill="none" />
          <Path d="M110 109 C 120 103 130 99 138 100" stroke={pine} strokeWidth="6.5" strokeLinecap="round" fill="none" />
        </G>
      )}
      {arms === 'ground' && (
        <G>
          <Path d="M90 112 C 82 120 76 130 72 138" stroke={pine} strokeWidth="6.5" strokeLinecap="round" fill="none" />
          <Path d="M110 112 C 118 120 124 130 128 138" stroke={pine} strokeWidth="6.5" strokeLinecap="round" fill="none" />
        </G>
      )}

      {/* neck and head */}
      <Rect x="97" y="96" width="6" height="9" rx="3" fill={pine} />
      <Circle cx="100" cy="88" r="12" fill={pine} />
    </G>
  );
}

export function ZenNatureScene({ variant, width = 150, height = 130, style }: ZenNatureSceneProps) {
  const { colors } = useAppTheme();

  const pine = colors.primary.default;
  const mist = colors.primary.subtle;
  const reed = colors.status.warning.default;
  const softMist = withAlpha(pine, 0.12);
  const midMist = withAlpha(pine, 0.22);

  return (
    <View style={[{ alignItems: 'center', justifyContent: 'center' }, style]}>
      <Svg width={width} height={height} viewBox="0 0 200 180" fill="none">
        {/* sun in the copy-free corner */}
        {variant !== 'rest' && (
          <G>
            <Circle cx="158" cy="38" r="20" fill={reed} opacity={0.18} />
            <Circle cx="158" cy="38" r="9" fill={reed} opacity={0.55} />
          </G>
        )}

        {/* distant hills and water */}
        <Path d="M0 132 Q 42 112 78 126 Q 100 134 124 124 Q 162 110 200 132 L 200 150 L 0 150 Z" fill={mist} />
        <Rect x="0" y="150" width="200" height="30" fill={mist} opacity={0.75} />
        <Path d="M0 150 H 200" stroke={midMist} strokeWidth="1.5" strokeLinecap="round" />

        {/* variant back prop */}
        {variant === 'landscape' && (
          <G>
            <Path d="M14 138 Q 44 116 74 132 Q 100 142 126 128 Q 156 112 186 138" stroke={midMist} strokeWidth="1.6" strokeLinecap="round" fill="none" />
          </G>
        )}
        {variant === 'breath' && (
          <G>
            <Path d="M18 142 C 30 132 42 152 54 142" stroke={midMist} strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <Path d="M146 142 C 158 132 170 152 182 142" stroke={midMist} strokeWidth="1.8" strokeLinecap="round" fill="none" />
          </G>
        )}
        {variant === 'soundscape' && (
          <G>
            <Path d="M152 72 A 26 26 0 0 1 152 118" stroke={midMist} strokeWidth="2" strokeLinecap="round" fill="none" />
            <Path d="M161 62 A 38 38 0 0 1 161 130" stroke={softMist} strokeWidth="2" strokeLinecap="round" fill="none" />
          </G>
        )}
        {variant === 'senses' && (
          <G>
            {[-2, -1, 0, 1, 2].map((step) => {
              const angle = -Math.PI / 2 + step * 0.45;
              return (
                <Circle
                  key={step}
                  cx={100 + Math.cos(angle) * 54}
                  cy={84 + Math.sin(angle) * 40}
                  r={step === 0 ? 3.4 : 2.4}
                  fill={step === 0 ? pine : reed}
                  opacity={0.55}
                />
              );
            })}
          </G>
        )}
        {variant === 'control' && (
          <G>
            <Ellipse cx="100" cy="104" rx="68" ry="26" fill={softMist} />
            <Ellipse cx="100" cy="104" rx="52" ry="18" fill={mist} />
          </G>
        )}
        {variant === 'aura' && (
          <G>
            <Circle cx="100" cy="92" r="46" fill={softMist} />
            <Circle cx="100" cy="92" r="30" fill={mist} opacity={0.7} />
          </G>
        )}
        {variant === 'affirmation' && (
          <G>
            {[-2, -1, 0, 1, 2].map((step) => (
              <Path
                key={step}
                d={`M${100 + step * 18} 66 L${100 + step * 22} 54`}
                stroke={reed}
                strokeWidth="2"
                strokeLinecap="round"
                opacity={0.45}
              />
            ))}
          </G>
        )}
        {variant === 'rest' && (
          <G>
            <Path d="M152 30 C 138 38 130 49 130 61 C 130 73 138 84 152 92 C 144 80 140 71 140 61 C 140 51 144 41 152 30 Z" fill={reed} opacity={0.6} />
            <Circle cx="58" cy="34" r="2" fill={reed} opacity={0.5} />
            <Circle cx="82" cy="24" r="1.6" fill={reed} opacity={0.45} />
            <Circle cx="122" cy="28" r="2.2" fill={reed} opacity={0.5} />
          </G>
        )}
        {variant === 'privacy' && (
          <G>
            <Path d="M40 150 C 22 118 26 82 46 66 C 56 96 54 126 40 150 Z" fill={mist} opacity={0.9} />
            <Path d="M160 150 C 178 118 174 82 154 66 C 144 96 146 126 160 150 Z" fill={mist} opacity={0.9} />
          </G>
        )}
        {variant === 'reframe' && (
          <G>
            <Circle cx="150" cy="52" r="13" fill={reed} opacity={0.2} />
            <Circle cx="170" cy="34" r="8" fill={reed} opacity={0.3} />
            <Circle cx="132" cy="38" r="5" fill={reed} opacity={0.35} />
          </G>
        )}

        {/* seated figure */}
        <Figure pine={pine} mist={mist} reed={reed} arms={VARIANT_ARMS[variant]} />

        {/* variant front prop */}
        {(variant === 'meditation' || variant === 'breath' || variant === 'journal' || variant === 'landscape') && (
          <G>
            <Reed x={170} y={158} rotate={16} scale={0.9} color={pine} />
            <Reed x={26} y={158} rotate={-18} scale={0.8} color={pine} />
          </G>
        )}
        {variant === 'planting' && (
          <G>
            <Reed x={132} y={160} rotate={10} scale={0.75} color={pine} />
            <Reed x={68} y={160} rotate={-10} scale={0.7} color={pine} />
          </G>
        )}
        {(variant === 'bloom' || variant === 'compassion') && (
          <G>
            <Lotus x={62} y={154} scale={0.72} color={pine} core={reed} />
            <Lotus x={138} y={154} scale={0.72} color={pine} core={reed} />
          </G>
        )}
        {variant === 'panic' && (
          <G>
            <Reed x={34} y={160} rotate={-16} scale={0.8} color={pine} />
            <Reed x={168} y={160} rotate={16} scale={0.8} color={pine} />
            <Circle cx="100" cy="118" r="3" fill={reed} opacity={0.7} />
          </G>
        )}
        {variant === 'journal' && (
          <G>
            <Path d="M150 60 l1.6 3.8 3.8 1.6 -3.8 1.6 -1.6 3.8 -1.6 -3.8 -3.8 -1.6 3.8 -1.6 Z" fill={reed} opacity={0.6} />
          </G>
        )}
        {variant === 'bodyScan' && (
          <G>
            {[112, 122, 132].map((y) => (
              <G key={y}>
                <Path d={`M74 ${y} H 126`} stroke={mist} strokeWidth="2" strokeLinecap="round" />
              </G>
            ))}
          </G>
        )}
        {variant === 'senses' && (
          <G>
            <Lotus x={54} y={152} scale={0.62} color={pine} core={reed} />
          </G>
        )}
        {variant === 'soundscape' && (
          <G>
            <Reed x={174} y={158} rotate={16} scale={0.9} color={pine} />
            <Reed x={28} y={158} rotate={-16} scale={0.8} color={pine} />
          </G>
        )}
      </Svg>
    </View>
  );
}
