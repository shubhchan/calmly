import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';
import { useAppTheme } from '../../theme/ThemeContext';
import { withAlpha } from '../../theme/tokens';

/**
 * Shared zen landscape used by every illustration in the app.
 *
 * One seated figure in lotus posture, painted with the live theme tokens and
 * framed by hills, trees, leaves and a soft sun. Each screen picks a variant
 * that changes the accent, the arm pose and the surrounding props so the set
 * reads as one family.
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

type AccentKey = 'sage' | 'lavender' | 'sky' | 'peach' | 'rose' | 'ocean';

const VARIANT_ACCENT: Record<ZenVariant, AccentKey> = {
  meditation: 'sage',
  breath: 'sky',
  soundscape: 'ocean',
  senses: 'peach',
  bodyScan: 'lavender',
  panic: 'rose',
  journal: 'sage',
  landscape: 'sky',
  planting: 'sage',
  bloom: 'rose',
  aura: 'lavender',
  compassion: 'peach',
  affirmation: 'peach',
  privacy: 'sage',
  reframe: 'sky',
  control: 'ocean',
  rest: 'lavender',
};

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

function Tree({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <G>
      <Path
        d={`M${x} ${y} C ${x - 1.5} ${y - 10} ${x + 1.5} ${y - 18} ${x} ${y - 24}`}
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity={0.85}
      />
      <Circle cx={x} cy={y - 32} r={11} fill={color} opacity={0.5} />
      <Circle cx={x - 8} cy={y - 24} r={7.5} fill={color} opacity={0.38} />
      <Circle cx={x + 8} cy={y - 24} r={7.5} fill={color} opacity={0.38} />
    </G>
  );
}

function Sprig({
  x,
  y,
  scale = 1,
  rotate = 0,
  color,
}: {
  x: number;
  y: number;
  scale?: number;
  rotate?: number;
  color: string;
}) {
  return (
    <G transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      <Path d="M0 0 C 1 -9 6 -15 13 -18" stroke={color} strokeWidth="1.4" strokeLinecap="round" opacity={0.8} />
      <Path d="M4 -7 C 0 -11 -1 -15 3 -18 C 7 -14 7 -10 4 -7 Z" fill={color} opacity={0.75} />
      <Path d="M9 -11 C 13 -14 17 -13 18 -9 C 14 -7 10 -8 9 -11 Z" fill={color} opacity={0.55} />
    </G>
  );
}

function Lotus({
  x,
  y,
  scale = 1,
  color,
  core,
}: {
  x: number;
  y: number;
  scale?: number;
  color: string;
  core: string;
}) {
  return (
    <G transform={`translate(${x} ${y}) scale(${scale})`}>
      <Path d="M0 0 C -9 -3 -13 -9 -12 -14 C -6 -15 -2 -8 0 0 Z" fill={color} opacity={0.7} />
      <Path d="M0 0 C 9 -3 13 -9 12 -14 C 6 -15 2 -8 0 0 Z" fill={color} opacity={0.7} />
      <Path d="M0 0 C -5 -5 -6 -12 0 -18 C 6 -12 5 -5 0 0 Z" fill={color} />
      <Circle cx="0" cy="-2" r="2.4" fill={core} />
    </G>
  );
}

function Stars({ color, points }: { color: string; points: Array<[number, number, number]> }) {
  return (
    <G>
      {points.map(([cx, cy, r], index) => (
        <Circle key={index} cx={cx} cy={cy} r={r} fill={color} opacity={0.7} />
      ))}
    </G>
  );
}

function Figure({
  accent,
  skin,
  hair,
  ink,
  arms,
}: {
  accent: string;
  skin: string;
  hair: string;
  ink: string;
  arms: ArmPose;
}) {
  const shade = withAlpha(ink, 0.18);
  const light = withAlpha('#FFFFFF', 0.24);

  return (
    <G>
      {/* ground shadow */}
      <Ellipse cx="100" cy="152" rx="46" ry="7" fill={accent} opacity={0.15} />

      {/* crossed legs */}
      <Path
        d="M60 144 C 68 132 88 129 100 133 C 112 129 132 132 140 144 C 130 151 113 152 100 150 C 87 152 70 151 60 144 Z"
        fill={accent}
      />
      <Path
        d="M78 146 Q 100 137 122 146"
        stroke={shade}
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />

      {/* torso */}
      <Path
        d="M85 138 C 83 121 83 110 87 102 C 91 95 109 95 113 102 C 117 110 117 121 115 138 Z"
        fill={accent}
      />
      <Path
        d="M92 100 L100 109 L108 100"
        stroke={light}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* arms */}
      {arms === 'mudra' && (
        <G>
          <Path d="M88 108 C 80 116 80 129 90 135" stroke={accent} strokeWidth="6.5" strokeLinecap="round" fill="none" />
          <Path d="M112 108 C 120 116 120 129 110 135" stroke={accent} strokeWidth="6.5" strokeLinecap="round" fill="none" />
          <Circle cx="92" cy="136" r="4" fill={skin} />
          <Circle cx="108" cy="136" r="4" fill={skin} />
        </G>
      )}
      {arms === 'heart' && (
        <G>
          <Path d="M112 108 C 120 116 120 129 110 135" stroke={accent} strokeWidth="6.5" strokeLinecap="round" fill="none" />
          <Path d="M88 108 C 79 114 84 124 96 122" stroke={accent} strokeWidth="6.5" strokeLinecap="round" fill="none" />
          <Circle cx="98" cy="121" r="4" fill={skin} />
          <Circle cx="108" cy="136" r="4" fill={skin} />
        </G>
      )}
      {arms === 'book' && (
        <G>
          <Path d="M89 111 C 84 120 87 129 94 132" stroke={accent} strokeWidth="6.5" strokeLinecap="round" fill="none" />
          <Path d="M111 111 C 116 120 113 129 106 132" stroke={accent} strokeWidth="6.5" strokeLinecap="round" fill="none" />
          <Rect x="85" y="126" width="30" height="12" rx="2.5" fill={withAlpha('#FFFFFF', 0.9)} stroke={shade} strokeWidth="1" />
          <Path d="M100 127 L100 137" stroke={shade} strokeWidth="1" />
          <Path d="M89 130 L97 130 M89 133 L97 133 M103 130 L111 130 M103 133 L111 133" stroke={accent} strokeWidth="1" strokeLinecap="round" opacity={0.6} />
        </G>
      )}
      {arms === 'flower' && (
        <G>
          <Path d="M88 108 C 80 116 80 129 90 135" stroke={accent} strokeWidth="6.5" strokeLinecap="round" fill="none" />
          <Path d="M112 108 C 120 116 120 129 110 135" stroke={accent} strokeWidth="6.5" strokeLinecap="round" fill="none" />
          <Circle cx="92" cy="136" r="4" fill={skin} />
          <Circle cx="108" cy="136" r="4" fill={skin} />
          <Lotus x={100} y={131} scale={0.7} color={accent} core={skin} />
        </G>
      )}
      {arms === 'plant' && (
        <G>
          <Path d="M88 108 C 80 116 80 129 90 135" stroke={accent} strokeWidth="6.5" strokeLinecap="round" fill="none" />
          <Path d="M112 110 C 120 118 124 128 126 138" stroke={accent} strokeWidth="6.5" strokeLinecap="round" fill="none" />
          <Circle cx="92" cy="136" r="4" fill={skin} />
          <Circle cx="127" cy="139" r="4" fill={skin} />
        </G>
      )}
      {arms === 'reach' && (
        <G>
          <Path d="M88 107 C 78 100 68 96 60 97" stroke={accent} strokeWidth="6.5" strokeLinecap="round" fill="none" />
          <Path d="M112 107 C 122 100 132 96 140 97" stroke={accent} strokeWidth="6.5" strokeLinecap="round" fill="none" />
          <Circle cx="58" cy="97" r="4" fill={skin} />
          <Circle cx="142" cy="97" r="4" fill={skin} />
        </G>
      )}
      {arms === 'ground' && (
        <G>
          <Path d="M88 110 C 80 118 74 128 70 136" stroke={accent} strokeWidth="6.5" strokeLinecap="round" fill="none" />
          <Path d="M112 110 C 120 118 126 128 130 136" stroke={accent} strokeWidth="6.5" strokeLinecap="round" fill="none" />
          <Circle cx="69" cy="137" r="4" fill={skin} />
          <Circle cx="131" cy="137" r="4" fill={skin} />
        </G>
      )}

      {/* neck and head */}
      <Rect x="97" y="88" width="6" height="10" rx="3" fill={skin} />
      <Circle cx="100" cy="80" r="13" fill={skin} />
      <Path d="M86.5 80 C 86.5 65 113.5 65 113.5 80 C 108 72 92 72 86.5 80 Z" fill={hair} />
      <Circle cx="100" cy="62" r="6" fill={hair} />

      {/* calm face */}
      <Path d="M94 81 Q 96.2 83.6 98.4 81" stroke={ink} strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <Path d="M101.6 81 Q 103.8 83.6 106 81" stroke={ink} strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <Path d="M97 86 Q 100 88.2 103 86" stroke={ink} strokeWidth="1" strokeLinecap="round" fill="none" />
    </G>
  );
}

export function ZenNatureScene({
  variant,
  width = 150,
  height = 130,
  style,
}: ZenNatureSceneProps) {
  const { colors, isDark } = useAppTheme();
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, '');

  const accent = colors.accents[VARIANT_ACCENT[variant]] ?? colors.primary.default;
  const skin = isDark ? '#E7D3C0' : '#EAC9A6';
  const hair = isDark ? '#E5E7EB' : '#2B3442';
  const ink = isDark ? '#0F141C' : '#1F2937';
  const leaf = withAlpha(accent, isDark ? 0.75 : 0.7);
  const leafSoft = withAlpha(accent, isDark ? 0.45 : 0.4);
  const auraOpacity = isDark ? 0.3 : 0.2;

  const showSun = variant !== 'rest';

  return (
    <View style={[{ alignItems: 'center', justifyContent: 'center' }, style]}>
      <Svg width={width} height={height} viewBox="0 0 200 180" fill="none">
        <Defs>
          <LinearGradient id={`${uid}aura`} x1="100" y1="18" x2="100" y2="168" gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopColor={accent} stopOpacity={auraOpacity} />
            <Stop offset="100%" stopColor={accent} stopOpacity="0" />
          </LinearGradient>
          <LinearGradient id={`${uid}ground`} x1="100" y1="140" x2="100" y2="180" gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopColor={accent} stopOpacity={isDark ? 0.32 : 0.24} />
            <Stop offset="100%" stopColor={accent} stopOpacity={isDark ? 0.08 : 0.04} />
          </LinearGradient>
        </Defs>

        {/* ambient glow */}
        <Circle cx="100" cy="92" r="78" fill={`url(#${uid}aura)`} />

        {/* sun and halo rings */}
        {showSun && <Circle cx="100" cy="84" r="40" fill={withAlpha(accent, isDark ? 0.2 : 0.13)} />}
        <Circle cx="100" cy="88" r="60" stroke={accent} strokeWidth="1" strokeDasharray="3 5" strokeOpacity="0.32" fill="none" />
        <Circle cx="100" cy="88" r="47" stroke={accent} strokeWidth="1" strokeOpacity="0.16" fill="none" />

        {/* distant hills */}
        <Path
          d="M4 148 Q 40 124 76 139 Q 100 148 124 139 Q 160 124 196 148 L 196 174 Q 100 182 4 174 Z"
          fill={`url(#${uid}ground)`}
        />
        <Path
          d="M4 160 Q 46 150 82 157 Q 118 162 150 156 Q 174 152 196 161 L 196 180 L 4 180 Z"
          fill={withAlpha(accent, isDark ? 0.18 : 0.13)}
        />

        {/* trees */}
        {(variant === 'meditation' || variant === 'landscape' || variant === 'rest') && (
          <G>
            <Tree x={34} y={146} color={leafSoft} />
            <Tree x={166} y={148} color={leafSoft} />
          </G>
        )}
        {variant === 'privacy' && (
          <G>
            <Tree x={28} y={150} color={leafSoft} />
            <Tree x={172} y={150} color={leafSoft} />
          </G>
        )}

        {/* back decoration */}
        {variant === 'breath' && (
          <G>
            <Circle cx="100" cy="98" r="44" stroke={accent} strokeWidth="1.3" strokeOpacity="0.45" fill="none" />
            <Circle cx="100" cy="98" r="56" stroke={accent} strokeWidth="1.1" strokeDasharray="4 6" strokeOpacity="0.35" fill="none" />
            <Circle cx="100" cy="98" r="68" stroke={accent} strokeWidth="1" strokeDasharray="2 8" strokeOpacity="0.25" fill="none" />
            <Path d="M8 96 C 22 82 34 110 46 96" stroke={accent} strokeWidth="1.8" strokeLinecap="round" opacity={0.5} fill="none" />
            <Path d="M154 96 C 166 82 178 110 192 96" stroke={accent} strokeWidth="1.8" strokeLinecap="round" opacity={0.5} fill="none" />
          </G>
        )}

        {variant === 'soundscape' && (
          <G>
            <Path d="M148 74 A 26 26 0 0 1 148 122" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeOpacity="0.45" fill="none" />
            <Path d="M156 64 A 36 36 0 0 1 156 132" stroke={accent} strokeWidth="1.6" strokeLinecap="round" strokeOpacity="0.3" fill="none" />
            <Path d="M164 54 A 46 46 0 0 1 164 142" stroke={accent} strokeWidth="1.3" strokeLinecap="round" strokeOpacity="0.2" fill="none" />
          </G>
        )}

        {variant === 'senses' && (
          <G>
            {[0, 1, 2, 3, 4].map((index) => {
              const angle = -Math.PI / 2 + (index - 2) * 0.5;
              return (
                <Circle
                  key={index}
                  cx={100 + Math.cos(angle) * 52}
                  cy={86 + Math.sin(angle) * 40}
                  r={index === 2 ? 3.4 : 2.6}
                  fill={accent}
                  opacity={0.55}
                />
              );
            })}
          </G>
        )}

        {variant === 'bodyScan' && (
          <G>
            <Circle cx="100" cy="98" r="66" stroke={accent} strokeWidth="1" strokeDasharray="2 7" strokeOpacity="0.28" fill="none" />
          </G>
        )}

        {variant === 'panic' && (
          <G>
            <Path d="M84 150 C 78 158 72 162 66 166" stroke={accent} strokeWidth="1.6" strokeLinecap="round" strokeOpacity="0.4" fill="none" />
            <Path d="M100 152 C 98 160 96 164 94 170" stroke={accent} strokeWidth="1.6" strokeLinecap="round" strokeOpacity="0.4" fill="none" />
            <Path d="M116 150 C 122 158 128 162 134 166" stroke={accent} strokeWidth="1.6" strokeLinecap="round" strokeOpacity="0.4" fill="none" />
          </G>
        )}

        {variant === 'landscape' && (
          <G>
            <Path d="M18 142 Q 46 116 78 134 Q 100 144 124 130 Q 154 112 182 142" stroke={leafSoft} strokeWidth="1.6" strokeLinecap="round" fill="none" />
          </G>
        )}

        {variant === 'aura' && (
          <G>
            <Circle cx="100" cy="96" r="52" stroke={colors.accents.rose} strokeWidth="1.6" strokeOpacity="0.3" fill="none" />
            <Circle cx="100" cy="96" r="62" stroke={colors.accents.lavender} strokeWidth="1.4" strokeOpacity="0.26" fill="none" />
            <Circle cx="100" cy="96" r="72" stroke={colors.accents.sky} strokeWidth="1.2" strokeOpacity="0.22" fill="none" />
          </G>
        )}

        {variant === 'compassion' && (
          <G>
            <Circle cx="100" cy="96" r="54" stroke={accent} strokeWidth="1.2" strokeDasharray="5 6" strokeOpacity="0.35" fill="none" />
            <Lotus x={62} y={128} scale={0.75} color={leafSoft} core={skin} />
            <Lotus x={140} y={132} scale={0.6} color={leafSoft} core={skin} />
          </G>
        )}

        {variant === 'affirmation' && (
          <G>
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
              const radians = (angle * Math.PI) / 180;
              return (
                <Path
                  key={angle}
                  d={`M${100 + Math.cos(radians) * 50} ${72 + Math.sin(radians) * 50} L${100 + Math.cos(radians) * 64} ${72 + Math.sin(radians) * 64}`}
                  stroke={accent}
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  opacity={0.4}
                />
              );
            })}
            <Circle cx="100" cy="72" r="44" stroke={accent} strokeWidth="1" strokeOpacity="0.2" fill="none" />
          </G>
        )}

        {variant === 'privacy' && (
          <G>
            <Path d="M42 158 C 18 120 24 76 52 58 C 62 84 60 124 42 158 Z" fill={leafSoft} opacity={0.55} />
            <Path d="M158 158 C 182 120 176 76 148 58 C 138 84 140 124 158 158 Z" fill={leafSoft} opacity={0.55} />
            <Path d="M52 58 C 60 92 58 130 44 156" stroke={leaf} strokeWidth="1.4" strokeLinecap="round" fill="none" opacity={0.6} />
            <Path d="M148 58 C 140 92 142 130 156 156" stroke={leaf} strokeWidth="1.4" strokeLinecap="round" fill="none" opacity={0.6} />
          </G>
        )}

        {variant === 'reframe' && (
          <G>
            <Circle cx="146" cy="52" r="14" fill={withAlpha(accent, isDark ? 0.18 : 0.12)} stroke={accent} strokeWidth="1" strokeOpacity="0.4" />
            <Circle cx="166" cy="34" r="9" fill={withAlpha(accent, isDark ? 0.18 : 0.12)} stroke={accent} strokeWidth="1" strokeOpacity="0.4" />
            <Circle cx="130" cy="36" r="6" fill={withAlpha(accent, isDark ? 0.18 : 0.12)} stroke={accent} strokeWidth="1" strokeOpacity="0.4" />
            <Sprig x={146} y={58} scale={0.5} color={leaf} />
          </G>
        )}

        {variant === 'control' && (
          <G>
            <Ellipse cx="100" cy="100" rx="70" ry="30" stroke={accent} strokeWidth="1.4" strokeOpacity="0.35" fill="none" transform="rotate(-18 100 100)" />
            <Ellipse cx="100" cy="100" rx="58" ry="24" stroke={accent} strokeWidth="1.2" strokeOpacity="0.24" fill="none" transform="rotate(24 100 100)" />
            <Circle cx="100" cy="100" r="30" stroke={accent} strokeWidth="1" strokeOpacity="0.18" fill="none" />
          </G>
        )}

        {variant === 'rest' && (
          <G>
            <Path
              d="M152 44 C 138 52 130 63 130 75 C 130 87 138 98 152 106 C 144 94 140 85 140 75 C 140 65 144 55 152 44 Z"
              fill={accent}
              opacity={0.55}
            />
            <Stars color={accent} points={[[52, 44, 2], [74, 30, 1.6], [120, 36, 2.2], [172, 44, 1.8], [44, 76, 1.6]]} />
          </G>
        )}

        {/* seated figure */}
        <Figure accent={accent} skin={skin} hair={hair} ink={ink} arms={VARIANT_ARMS[variant]} />

        {/* ground line under the figure */}
        <Path d="M58 151 Q 100 158 142 151" stroke={accent} strokeWidth="1" strokeOpacity="0.25" fill="none" />

        {/* front decoration */}
        {variant === 'bodyScan' && (
          <G>
            {[110, 120, 130].map((y) => (
              <G key={y}>
                <Path d={`M70 ${y} L 130 ${y}`} stroke={accent} strokeWidth="1.2" strokeOpacity="0.35" strokeDasharray="3 4" fill="none" />
                <Circle cx="70" cy={y} r="1.8" fill={accent} opacity={0.6} />
                <Circle cx="130" cy={y} r="1.8" fill={accent} opacity={0.6} />
              </G>
            ))}
          </G>
        )}

        {(variant === 'planting' || variant === 'journal' || variant === 'meditation') && (
          <G>
            <Path d="M124 150 Q 128 140 128 132" stroke={leaf} strokeWidth="2" strokeLinecap="round" fill="none" />
            <Path d="M128 138 C 120 136 118 130 122 126 C 128 128 130 133 128 138 Z" fill={leaf} opacity={0.8} />
            <Path d="M128 144 C 136 142 138 136 134 132 C 128 134 126 139 128 144 Z" fill={leaf} opacity={0.55} />
          </G>
        )}

        {variant === 'bloom' && (
          <G>
            <Lotus x={100} y={134} scale={1.15} color={accent} core={skin} />
            <Circle cx="60" cy="92" r="2.4" fill={accent} opacity={0.5} />
            <Circle cx="140" cy="96" r="2" fill={accent} opacity={0.45} />
            <Circle cx="72" cy="66" r="1.8" fill={accent} opacity={0.4} />
          </G>
        )}

        {variant === 'meditation' && (
          <G>
            <Sprig x={172} y={158} rotate={18} scale={0.95} color={leaf} />
            <Sprig x={26} y={158} rotate={-20} scale={0.85} color={leafSoft} />
            <Stars color={accent} points={[[68, 46, 2], [132, 46, 2], [100, 32, 2.4]]} />
          </G>
        )}

        {variant === 'breath' && (
          <G>
            <Sprig x={170} y={160} rotate={20} scale={0.9} color={leaf} />
            <Sprig x={28} y={160} rotate={-22} scale={0.8} color={leafSoft} />
          </G>
        )}

        {variant === 'soundscape' && (
          <G>
            <Path d="M22 160 C 24 148 30 142 36 138" stroke={leaf} strokeWidth="1.6" strokeLinecap="round" fill="none" />
            <Path d="M30 160 C 32 150 38 146 44 144" stroke={leafSoft} strokeWidth="1.4" strokeLinecap="round" fill="none" />
            <Sprig x={174} y={158} rotate={18} scale={0.9} color={leaf} />
          </G>
        )}

        {variant === 'senses' && (
          <G>
            <Lotus x={44} y={150} scale={0.7} color={leafSoft} core={skin} />
            <Lotus x={156} y={150} scale={0.7} color={leafSoft} core={skin} />
            <Sprig x={172} y={112} rotate={26} scale={0.8} color={leaf} />
          </G>
        )}

        {variant === 'panic' && (
          <G>
            <Sprig x={30} y={158} rotate={-18} scale={0.8} color={leaf} />
            <Sprig x={170} y={158} rotate={18} scale={0.8} color={leafSoft} />
          </G>
        )}

        {variant === 'landscape' && (
          <G>
            <Sprig x={40} y={156} rotate={-16} scale={0.8} color={leafSoft} />
          </G>
        )}

        {variant === 'aura' && (
          <G>
            <Circle cx="48" cy="70" r="3" fill={colors.accents.rose} opacity={0.5} />
            <Circle cx="152" cy="60" r="2.4" fill={colors.accents.lavender} opacity={0.5} />
            <Circle cx="156" cy="112" r="2.8" fill={colors.accents.sky} opacity={0.45} />
          </G>
        )}

        {variant === 'affirmation' && (
          <G>
            <Stars color={accent} points={[[54, 52, 2], [146, 46, 2], [80, 32, 1.6], [122, 28, 1.8]]} />
            <Sprig x={28} y={160} rotate={-20} scale={0.85} color={leafSoft} />
          </G>
        )}

        {variant === 'control' && (
          <G>
            <Circle cx="162" cy="62" r="3" fill={accent} opacity={0.55} />
            <Circle cx="40" cy="112" r="2.6" fill={accent} opacity={0.45} />
          </G>
        )}

        {variant === 'rest' && (
          <G>
            <Sprig x={34} y={160} rotate={-18} scale={0.85} color={leafSoft} />
            <Sprig x={168} y={160} rotate={18} scale={0.85} color={leafSoft} />
          </G>
        )}

        {variant === 'reframe' && (
          <G>
            <Sprig x={30} y={160} rotate={-18} scale={0.8} color={leafSoft} />
          </G>
        )}

        {variant === 'journal' && (
          <G>
            <Sprig x={34} y={158} rotate={-18} scale={0.8} color={leafSoft} />
            <Stars color={accent} points={[[150, 42, 1.8], [168, 58, 1.4]]} />
          </G>
        )}
      </Svg>
    </View>
  );
}
