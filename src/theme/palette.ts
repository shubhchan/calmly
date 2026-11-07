// Mirrors the token values in /global.css exactly.
// Web reads global.css directly; native has no DOM/CSS engine, so this JS palette
// is what actually drives colors on iOS/Android via NativeWind's `vars()` (see
// ThemeContext.tsx) and via the `useThemeColors()` hook for non-style-prop APIs
// (Ionicons `color`, react-native-svg `stroke`/`fill`, etc).
//
// Visual direction: "Still Water" — a foggy pine lake at first light.
// Contrast rules:
// - ink on ground >= 12:1
// - ink-2 on ground >= 7:1
// - ink-3 is the lightest text allowed at 12–13px (>= 4.5:1)
// - accent gold is decoration only, under 5% of a screen.

export type ThemeMode = 'light' | 'dark';
export type AccentColor = 'sage' | 'lavender' | 'sky' | 'peach' | 'rose' | 'ocean';

const base = {
  light: {
    bgPrimary: '#F4F5F1',
    bgSecondary: '#EAEDE7',
    bgTertiary: '#E3ECE7',
    bgCard: '#FFFFFF',
    bgCardHover: '#F0F2EE',
    textPrimary: '#1A2420',
    textSecondary: '#46524C',
    textTertiary: '#6C7873',
    textInverse: '#F7F9F6',
    borderLight: '#DEE3DC',
    borderMedium: '#C7D0C8',
    success: '#3F6E58',
    warning: '#9A7434',
    error: '#A9503C',
    info: '#3F6B78',
  },
  dark: {
    bgPrimary: '#0F1513',
    bgSecondary: '#161E1B',
    bgTertiary: '#1C2A25',
    bgCard: '#161E1B',
    bgCardHover: '#1D2622',
    textPrimary: '#ECF1EE',
    textSecondary: '#B3C0BA',
    textTertiary: '#8B9993',
    textInverse: '#0F1513',
    borderLight: '#26312C',
    borderMedium: '#38463F',
    success: '#8FC2A8',
    warning: '#D2B078',
    error: '#E08B72',
    info: '#93BFCB',
  },
};

const accents = {
  light: {
    sage: { primary: '#2C4F45', hover: '#223E36', bg: '#E3ECE7', border: '#C9DCD3' },
    lavender: { primary: '#5F5A6B', hover: '#4B4756', bg: '#EAE8ED', border: '#D3CFD9' },
    sky: { primary: '#41626E', hover: '#344F59', bg: '#E5EBEC', border: '#C9D6D8' },
    peach: { primary: '#8E5F42', hover: '#755036', bg: '#EFE8E1', border: '#DDCFC2' },
    rose: { primary: '#7F5257', hover: '#6A4449', bg: '#EDE6E6', border: '#D9CBCB' },
    ocean: { primary: '#356B6D', hover: '#2A5759', bg: '#E2ECEC', border: '#C3D8D8' },
  },
  dark: {
    sage: { primary: '#9AC6B4', hover: '#B5D7C8', bg: '#1C2A25', border: '#2F4A40' },
    lavender: { primary: '#B7B1C4', hover: '#CBC6D6', bg: '#221F2A', border: '#37333F' },
    sky: { primary: '#9DBFCB', hover: '#B6D2DB', bg: '#1B2528', border: '#2C3B3F' },
    peach: { primary: '#C9A084', hover: '#DAB6A0', bg: '#261F1A', border: '#3E3228' },
    rose: { primary: '#C2A0A6', hover: '#D6B7BC', bg: '#251E20', border: '#3B3032' },
    ocean: { primary: '#9AC0C2', hover: '#B3D2D4', bg: '#1A2526', border: '#2A3B3C' },
  },
};

export function resolveColors(theme: ThemeMode, accent: AccentColor) {
  const b = base[theme];
  const a = accents[theme][accent];
  return {
    isDark: theme === 'dark',
    theme,
    accent,
    bgPrimary: b.bgPrimary,
    bgSecondary: b.bgSecondary,
    bgTertiary: b.bgTertiary,
    bgCard: b.bgCard,
    bgCardHover: b.bgCardHover,
    textPrimary: b.textPrimary,
    textSecondary: b.textSecondary,
    textTertiary: b.textTertiary,
    textInverse: b.textInverse,
    borderLight: b.borderLight,
    borderMedium: b.borderMedium,
    success: b.success,
    warning: b.warning,
    error: b.error,
    info: b.info,
    accentPrimary: a.primary,
    accentPrimaryHover: a.hover,
    accentBg: a.bg,
    accentBorder: a.border,
    accentSage: accents[theme].sage.primary,
    accentLavender: accents[theme].lavender.primary,
    accentSky: accents[theme].sky.primary,
    accentPeach: accents[theme].peach.primary,
    accentRose: accents[theme].rose.primary,
    accentOcean: accents[theme].ocean.primary,
  };
}

export type ResolvedColors = ReturnType<typeof resolveColors>;

// Converts { textPrimary: '#111' } -> { '--color-text-primary': '#111' }
// so it can be handed straight to NativeWind's vars().
export function toCssVars(colors: ResolvedColors): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(colors)) {
    if (typeof value !== 'string') continue;
    const kebab = key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
    out[`--color-${kebab}`] = value;
  }
  return out;
}
