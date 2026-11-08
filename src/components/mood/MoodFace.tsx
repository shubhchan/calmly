import React from 'react';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { useAppTheme } from '../../theme/ThemeContext';
import type { MoodType } from '../../types/navigation';

type Eyes = 'dot' | 'closed' | 'wide' | 'angry';
type Brows = 'none' | 'raised' | 'lowered' | 'worried';
type Mouth = 'smile' | 'grin' | 'flat' | 'frown' | 'open' | 'smirk' | 'small';

interface FaceSpec {
  eyes: Eyes;
  brows: Brows;
  mouth: Mouth;
  tear?: boolean;
  sweat?: boolean;
  zzz?: boolean;
  blush?: boolean;
  sparkle?: boolean;
}

/**
 * Mood faces — the Doop illustration language applied to expressions.
 *
 * One plate, one ink, one small measure of reed. No outlines, no gradients.
 * The caller draws the round plate; this component draws only the features,
 * so the same face works inside a wheel stop, a chip or a summary row.
 */
const FACES: Record<MoodType, FaceSpec> = {
  happy: { eyes: 'dot', brows: 'none', mouth: 'smile', blush: true },
  excited: { eyes: 'wide', brows: 'raised', mouth: 'grin', sparkle: true },
  grateful: { eyes: 'closed', brows: 'none', mouth: 'smile', blush: true },
  content: { eyes: 'dot', brows: 'none', mouth: 'smile' },
  peaceful: { eyes: 'closed', brows: 'none', mouth: 'small' },
  hopeful: { eyes: 'dot', brows: 'raised', mouth: 'smile', sparkle: true },
  proud: { eyes: 'dot', brows: 'none', mouth: 'smirk', sparkle: true },
  motivated: { eyes: 'dot', brows: 'lowered', mouth: 'smile' },
  relieved: { eyes: 'closed', brows: 'none', mouth: 'grin' },
  connected: { eyes: 'dot', brows: 'none', mouth: 'grin', blush: true },
  anxious: { eyes: 'wide', brows: 'worried', mouth: 'frown', sweat: true },
  stressed: { eyes: 'wide', brows: 'lowered', mouth: 'open', sweat: true },
  overwhelmed: { eyes: 'dot', brows: 'worried', mouth: 'flat', sweat: true },
  angry: { eyes: 'angry', brows: 'lowered', mouth: 'frown' },
  frustrated: { eyes: 'angry', brows: 'lowered', mouth: 'flat' },
  sad: { eyes: 'dot', brows: 'worried', mouth: 'frown', tear: true },
  exhausted: { eyes: 'closed', brows: 'none', mouth: 'flat', zzz: true },
  lonely: { eyes: 'dot', brows: 'worried', mouth: 'frown', tear: true },
  uncertain: { eyes: 'dot', brows: 'raised', mouth: 'small' },
  bored: { eyes: 'dot', brows: 'none', mouth: 'flat' },
};

function EyesShape({ kind, ink, accent }: { kind: Eyes; ink: string; accent: string }) {
  switch (kind) {
    case 'closed':
      return (
        <>
          <Path d="M11.8 17.4q2.7 2.6 5.4 0" stroke={ink} strokeWidth={1.8} fill="none" strokeLinecap="round" />
          <Path d="M22.8 17.4q2.7 2.6 5.4 0" stroke={ink} strokeWidth={1.8} fill="none" strokeLinecap="round" />
        </>
      );
    case 'wide':
      return (
        <>
          <Circle cx={14.5} cy={17.4} r={2.4} fill={ink} />
          <Circle cx={25.5} cy={17.4} r={2.4} fill={ink} />
          <Circle cx={15.3} cy={16.6} r={0.7} fill={accent} />
          <Circle cx={26.3} cy={16.6} r={0.7} fill={accent} />
        </>
      );
    case 'angry':
      return (
        <>
          <Circle cx={14.5} cy={18} r={1.8} fill={ink} />
          <Circle cx={25.5} cy={18} r={1.8} fill={ink} />
        </>
      );
    default:
      return (
        <>
          <Circle cx={14.5} cy={17.4} r={1.8} fill={ink} />
          <Circle cx={25.5} cy={17.4} r={1.8} fill={ink} />
        </>
      );
  }
}

function BrowsShape({ kind, ink }: { kind: Brows; ink: string }) {
  if (kind === 'none') return null;
  const left =
    kind === 'raised'
      ? 'M11.4 13.4q2.7-1.6 5.4 0'
      : kind === 'worried'
        ? 'M11.4 14.2q2.7-1.8 5.4-0.9'
        : 'M11.4 12.9q2.7 1.4 5.4 1.5';
  const right =
    kind === 'raised'
      ? 'M23.2 13.4q2.7-1.6 5.4 0'
      : kind === 'worried'
        ? 'M23.2 13.3q2.7-0.9 5.4 0.9'
        : 'M23.2 14.4q2.7-0.1 5.4-1.5';
  return (
    <>
      <Path d={left} stroke={ink} strokeWidth={1.7} fill="none" strokeLinecap="round" />
      <Path d={right} stroke={ink} strokeWidth={1.7} fill="none" strokeLinecap="round" />
    </>
  );
}

function MouthShape({ kind, ink }: { kind: Mouth; ink: string }) {
  switch (kind) {
    case 'grin':
      return <Path d="M13.6 24.6q6.4 6.6 12.8 0" stroke={ink} strokeWidth={2} fill="none" strokeLinecap="round" />;
    case 'flat':
      return <Path d="M15.6 26h8.8" stroke={ink} strokeWidth={2} fill="none" strokeLinecap="round" />;
    case 'frown':
      return <Path d="M14.2 27.6q5.8-4.4 11.6 0" stroke={ink} strokeWidth={2} fill="none" strokeLinecap="round" />;
    case 'open':
      return <Ellipse cx={20} cy={26.4} rx={3.6} ry={2.8} fill={ink} />;
    case 'smirk':
      return <Path d="M15 26q7 2.4 10.4-2.2" stroke={ink} strokeWidth={2} fill="none" strokeLinecap="round" />;
    case 'small':
      return <Path d="M17.2 26q2.8 1.9 5.6 0" stroke={ink} strokeWidth={1.9} fill="none" strokeLinecap="round" />;
    default:
      return <Path d="M14 25.4q6 5 12 0" stroke={ink} strokeWidth={2} fill="none" strokeLinecap="round" />;
  }
}

const DROP = 'M0 0c1.9 2.1 3.2 3.4 3.2 4.7a3.2 3.2 0 0 1-6.4 0C-3.2 3.4-1.9 2.1 0 0z';

export interface MoodFaceProps {
  mood: MoodType;
  /** Square size in points. */
  size?: number;
  /** Feature color. Defaults to the primary ink. */
  color?: string;
  /** Optional reed accent for tears, sparks and blushes. */
  accent?: string;
}

export function MoodFace({ mood, size = 34, color, accent = '#B08A4F' }: MoodFaceProps) {
  const { colors } = useAppTheme();
  const ink = color ?? colors.primary.default;
  const spec = FACES[mood] ?? FACES.content;
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      {spec.blush ? (
        <>
          <Ellipse cx={12.6} cy={22.6} rx={2.4} ry={1.4} fill={accent} opacity={0.4} />
          <Ellipse cx={27.4} cy={22.6} rx={2.4} ry={1.4} fill={accent} opacity={0.4} />
        </>
      ) : null}
      <EyesShape kind={spec.eyes} ink={ink} accent={accent} />
      <BrowsShape kind={spec.brows} ink={ink} />
      <MouthShape kind={spec.mouth} ink={ink} />
      {spec.tear ? (
        <Path d={DROP} transform="translate(11.6 19.6) scale(0.78)" fill={accent} />
      ) : null}
      {spec.sweat ? (
        <Path d={DROP} transform="translate(29.4 12.8) scale(0.62)" fill={accent} />
      ) : null}
      {spec.zzz ? (
        <Path
          d="M28 11.4h4.2l-4.2 4.2h4.2"
          stroke={accent}
          strokeWidth={1.6}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
      {spec.sparkle ? (
        <Path
          d="M30.6 7.4l1.1 2.7 2.7 1.1-2.7 1.1-1.1 2.7-1.1-2.7-2.7-1.1 2.7-1.1z"
          fill={accent}
        />
      ) : null}
    </Svg>
  );
}
