/**
 * Raw color utilities and reference tonal ramps.
 *
 * Application code must use the SEMANTIC tokens from `useAppTheme()` — the
 * ramps below exist for documentation and the design-system showcase only.
 */

/**
 * Hex (#RRGGBB) -> rgba() with the given alpha (0..1).
 * Used to derive subtle/overlay tones from the base palette so every theme
 * value stays consistent with the palette instead of hardcoding rgba strings.
 */
export function withAlpha(hex: string, alpha: number): string {
  const safe = /^#([0-9a-fA-F]{6})$/.test(hex) ? hex : '#000000';
  const r = parseInt(safe.slice(1, 3), 16);
  const g = parseInt(safe.slice(3, 5), 16);
  const b = parseInt(safe.slice(5, 7), 16);
  const clamped = Math.min(1, Math.max(0, alpha));
  return `rgba(${r}, ${g}, ${b}, ${clamped})`;
}

/** Reference tonal ramps (50–900) for the core hues. Docs + showcase only. */
export const tonalRamps = {
  sage: {
    50: '#EDF5EF',
    100: '#DCEBE0',
    200: '#C4DECA',
    300: '#A3CBAE',
    400: '#7DB391',
    500: '#447C54',
    600: '#3A6B49',
    700: '#2F573B',
    800: '#25452F',
    900: '#1B3323',
  },
  sky: {
    50: '#EEF5FF',
    100: '#D9E8FE',
    200: '#BFD8FE',
    300: '#93C0F9',
    400: '#64A3EC',
    500: '#3478D8',
    600: '#2A63B4',
    700: '#224F90',
    800: '#1B3E6F',
    900: '#142E52',
  },
  rose: {
    50: '#FDF1F4',
    100: '#FBE0E7',
    200: '#F8C3CE',
    300: '#F29CB0',
    400: '#E97090',
    500: '#D44766',
    600: '#B33A54',
    700: '#8F2E43',
    800: '#6E2334',
    900: '#4F1825',
  },
  neutral: {
    50: '#FAF8F5',
    100: '#F3ECE2',
    200: '#EBE3D5',
    300: '#D8CEBD',
    400: '#B0A691',
    500: '#667085',
    600: '#475467',
    700: '#334155',
    800: '#1F242E',
    900: '#111722',
  },
} as const;

export type RampName = keyof typeof tonalRamps;
