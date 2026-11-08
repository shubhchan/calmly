/**
 * Restrained card tones for "Still Water".
 *
 * The palette stays inside the foggy pine lake at first light: moss, stone,
 * rain, paper and one small measure of warm gold. Tones exist to separate
 * groups, not to decorate. Every tone ships a light and a dark variant;
 * `resolveTint` picks the right one from the active theme.
 *
 * Contrast targets: `text` >= 7:1 on `bg`, `muted` >= 4.5:1 on `bg`,
 * `accent` >= 4.5:1 on `plate`.
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
    bg: '#F0E7D6',
    border: '#E2D4BC',
    text: '#3A3125',
    muted: '#6B5E4A',
    accent: '#8E5F42',
    plate: '#E8DAC4',
  },
  cream: {
    bg: '#F3EFE4',
    border: '#E3DCCB',
    text: '#333026',
    muted: '#6A6353',
    accent: '#9A7434',
    plate: '#EAE2D0',
  },
  navy: {
    bg: '#223E36',
    border: '#2E4D43',
    text: '#EDF3EF',
    muted: '#A9CBBC',
    accent: '#D2B078',
    plate: '#2C4B42',
  },
  sage: {
    bg: '#E3ECE7',
    border: '#C9DCD3',
    text: '#1A2420',
    muted: '#46524C',
    accent: '#2C4F45',
    plate: '#D5E4DC',
  },
  blush: {
    bg: '#EDE6E6',
    border: '#D9CBCB',
    text: '#3A2C2D',
    muted: '#6B5758',
    accent: '#7F5257',
    plate: '#E3D8D8',
  },
  lilac: {
    bg: '#EAE8ED',
    border: '#D3CFD9',
    text: '#2C2A31',
    muted: '#5D5966',
    accent: '#5F5A6B',
    plate: '#DEDBE4',
  },
  sky: {
    bg: '#E5EBEC',
    border: '#C9D6D8',
    text: '#223034',
    muted: '#4E6368',
    accent: '#41626E',
    plate: '#D7E2E4',
  },
  mint: {
    bg: '#E1ECE7',
    border: '#C5DAD1',
    text: '#16302A',
    muted: '#48625A',
    accent: '#2C4F45',
    plate: '#D3E5DC',
  },
};

const darkTints: Record<TintName, Tint> = {
  coral: {
    bg: '#261F1A',
    border: '#3E3228',
    text: '#F0E6DA',
    muted: '#C3AE97',
    accent: '#D2B078',
    plate: '#322821',
  },
  cream: {
    bg: '#24211A',
    border: '#3A3528',
    text: '#F1EBDD',
    muted: '#C0B79F',
    accent: '#D2B078',
    plate: '#2E2A20',
  },
  navy: {
    bg: '#223E36',
    border: '#2F4F45',
    text: '#EDF3EF',
    muted: '#A9CBBC',
    accent: '#D2B078',
    plate: '#2C4B42',
  },
  sage: {
    bg: '#1C2A25',
    border: '#2F4A40',
    text: '#ECF1EE',
    muted: '#A9CBBC',
    accent: '#9AC6B4',
    plate: '#243630',
  },
  blush: {
    bg: '#251E20',
    border: '#3B3032',
    text: '#EFE4E5',
    muted: '#C1A9AC',
    accent: '#C2A0A6',
    plate: '#302628',
  },
  lilac: {
    bg: '#221F2A',
    border: '#37333F',
    text: '#ECE9F0',
    muted: '#B7B1C4',
    accent: '#B7B1C4',
    plate: '#2B2733',
  },
  sky: {
    bg: '#1B2528',
    border: '#2C3B3F',
    text: '#E6EEF0',
    muted: '#A3BBC0',
    accent: '#9DBFCB',
    plate: '#223034',
  },
  mint: {
    bg: '#1C2A25',
    border: '#2F4A40',
    text: '#E7F2EC',
    muted: '#A9CBBC',
    accent: '#9AC6B4',
    plate: '#243630',
  },
};

export function resolveTint(isDark: boolean, name: TintName): Tint {
  return (isDark ? darkTints : lightTints)[name];
}

/** Map user accent selection to its corresponding card tint. */
export function accentToTint(accent?: string): TintName {
  switch (accent) {
    case 'sage':
      return 'sage';
    case 'lavender':
      return 'lilac';
    case 'sky':
      return 'sky';
    case 'peach':
      return 'coral';
    case 'rose':
      return 'blush';
    case 'ocean':
      return 'mint';
    default:
      return 'sage';
  }
}

/** Deterministic tone rotation so cards feel ordered but never random. */
export function tintForIndex(index: number): TintName {
  return TINT_NAMES[Math.abs(index) % TINT_NAMES.length];
}
