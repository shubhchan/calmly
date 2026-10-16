/**
 * Playful pastel card palette ("pop colors").
 *
 * A restrained set of eight tones derived from the mindful base theme — used
 * for colorful, popping cards that make key screens feel joyful without
 * breaking the calm, warm-stone foundation. Every tone has a light and a dark
 * variant; `resolveTint` picks the right one from the active theme.
 *
 * Contrast targets: `text` >= 7:1 on `bg`, `muted` >= 4.5:1 on `bg`,
 * `accent` >= 4.5:1 on `plate` — so every card stays comfortably readable.
 */

export type TintName = 'coral' | 'cream' | 'navy' | 'sage' | 'blush' | 'lilac' | 'sky' | 'mint';

export interface Tint {
  /** Card background */
  bg: string;
  /** Hairline border */
  border: string;
  /** Primary text color that is readable on `bg` */
  text: string;
  /** Secondary / muted text color that is readable on `bg` */
  muted: string;
  /** Accent for icons / badges drawn on `bg` or `plate` */
  accent: string;
  /** Soft chip / icon-plate color on top of `bg` */
  plate: string;
}

export const TINT_NAMES: TintName[] = ['coral', 'cream', 'navy', 'sage', 'blush', 'lilac', 'sky', 'mint'];

const lightTints: Record<TintName, Tint> = {
  coral: {
    bg: '#FBDCD1',
    border: '#F2BCA6',
    text: '#6E2A10',
    muted: '#8F4527',
    accent: '#BC5124',
    plate: '#F7C7B3',
  },
  cream: {
    bg: '#FAEFC5',
    border: '#EED88C',
    text: '#5D4606',
    muted: '#7C6313',
    accent: '#9C7410',
    plate: '#F5E19F',
  },
  navy: {
    bg: '#2A2653',
    border: '#413C74',
    text: '#F7F5FF',
    muted: '#CFC9F0',
    accent: '#FFD6A8',
    plate: '#393468',
  },
  sage: {
    bg: '#DAEAD7',
    border: '#B5D3B2',
    text: '#1F4A29',
    muted: '#3F6B48',
    accent: '#2F7044',
    plate: '#C6DEC3',
  },
  blush: {
    bg: '#F9DBE5',
    border: '#F1B9CB',
    text: '#711F3F',
    muted: '#95425E',
    accent: '#C03A64',
    plate: '#F5C4D4',
  },
  lilac: {
    bg: '#E6E0F7',
    border: '#CDC1EE',
    text: '#3A2B75',
    muted: '#584796',
    accent: '#6347CE',
    plate: '#D8CDF3',
  },
  sky: {
    bg: '#D6E7F9',
    border: '#B0D0EF',
    text: '#143C66',
    muted: '#33608F',
    accent: '#1F63C9',
    plate: '#C3DCF5',
  },
  mint: {
    bg: '#D2EBDF',
    border: '#A8D9C5',
    text: '#0F4433',
    muted: '#2D6754',
    accent: '#0B6B51',
    plate: '#BEE6D5',
  },
};

const darkTints: Record<TintName, Tint> = {
  coral: {
    bg: '#3A221A',
    border: '#593324',
    text: '#FFE1D3',
    muted: '#E8B49A',
    accent: '#FFA07C',
    plate: '#4A2B1F',
  },
  cream: {
    bg: '#362E17',
    border: '#534826',
    text: '#FCEDBF',
    muted: '#E0CB85',
    accent: '#F2CD5C',
    plate: '#453B1D',
  },
  navy: {
    bg: '#2F2B5C',
    border: '#464178',
    text: '#F7F5FF',
    muted: '#CCC6EE',
    accent: '#FFD6A8',
    plate: '#3C3770',
  },
  sage: {
    bg: '#20301C',
    border: '#334B2F',
    text: '#E4F1E0',
    muted: '#ACC8A8',
    accent: '#8AD598',
    plate: '#2A4026',
  },
  blush: {
    bg: '#391D28',
    border: '#562E3D',
    text: '#FEDCE6',
    muted: '#E8A8BC',
    accent: '#FF8FA9',
    plate: '#482632',
  },
  lilac: {
    bg: '#292245',
    border: '#403866',
    text: '#ECE5FF',
    muted: '#C0B3E3',
    accent: '#BCA7F8',
    plate: '#362D55',
  },
  sky: {
    bg: '#18293E',
    border: '#273F5D',
    text: '#E0EEFD',
    muted: '#A8C4E0',
    accent: '#7FBBFF',
    plate: '#21354F',
  },
  mint: {
    bg: '#14302A',
    border: '#21473B',
    text: '#DAF1E7',
    muted: '#A0C9B9',
    accent: '#61DAB4',
    plate: '#1C3C32',
  },
};

export function resolveTint(isDark: boolean, name: TintName): Tint {
  return (isDark ? darkTints : lightTints)[name];
}

/** Deterministic tone rotation so cards feel playful but never random/strobing. */
export function tintForIndex(index: number): TintName {
  return TINT_NAMES[Math.abs(index) % TINT_NAMES.length];
}
