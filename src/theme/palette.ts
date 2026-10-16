// Mirrors the token values in /global.css exactly.
// Web reads global.css directly; native has no DOM/CSS engine, so this JS palette
// is what actually drives colors on iOS/Android via NativeWind's `vars()` (see
// ThemeContext.tsx) and via the `useThemeColors()` hook for non-style-prop APIs
// (Ionicons `color`, react-native-svg `stroke`/`fill`, etc).

export type ThemeMode = 'light' | 'dark';
export type AccentColor = 'sage' | 'lavender' | 'sky' | 'peach' | 'rose' | 'ocean';

const base = {
  light: {
    bgPrimary: '#FAF8F5',
    bgSecondary: '#F3ECE2',
    bgTertiary: '#E9DFC4',
    bgCard: '#FFFFFF',
    bgCardHover: '#F7F2E9',
    textPrimary: '#1F242E',
    textSecondary: '#475467',
    textTertiary: '#667085',
    textInverse: '#FAF8F5',
    borderLight: '#EBE3D5',
    borderMedium: '#D8CEBD',
    success: '#447C54',
    warning: '#D76949',
    error: '#D44766',
    info: '#3478D8',
  },
  dark: {
    bgPrimary: '#111722',
    bgSecondary: '#17202E',
    bgTertiary: '#1E2A3C',
    bgCard: '#192332',
    bgCardHover: '#212E42',
    textPrimary: '#F8FAFC',
    textSecondary: '#CBD5E1',
    textTertiary: '#94A3B8',
    textInverse: '#111722',
    borderLight: '#243245',
    borderMedium: '#33445C',
    success: '#62C27F',
    warning: '#FBA04B',
    error: '#F87192',
    info: '#60A5FA',
  },
};

const accents = {
  light: {
    sage: { primary: '#447C54', hover: '#346142', bg: '#EDF5EF', border: '#C4DECA' },
    lavender: { primary: '#705FCF', hover: '#5849B3', bg: '#F3F1FD', border: '#D4CEFC' },
    sky: { primary: '#3478D8', hover: '#2563EB', bg: '#EEF5FF', border: '#BFD8FE' },
    peach: { primary: '#D76949', hover: '#B85032', bg: '#FDF3EE', border: '#F8D0C2' },
    rose: { primary: '#D44766', hover: '#B3304E', bg: '#FDF1F4', border: '#F8C3CE' },
    ocean: { primary: '#177B8D', hover: '#105E6D', bg: '#EDF7F9', border: '#BAE3EB' },
  },
  dark: {
    sage: { primary: '#62C27F', hover: '#81D89B', bg: '#172E1E', border: '#254E31' },
    lavender: { primary: '#A78BFA', hover: '#C4B5FD', bg: '#29204A', border: '#433475' },
    sky: { primary: '#60A5FA', hover: '#93C5FD', bg: '#172847', border: '#254073' },
    peach: { primary: '#FB923C', hover: '#FDBA74', bg: '#3B2113', border: '#5C341E' },
    rose: { primary: '#F47293', hover: '#F9A8D4', bg: '#3B1825', border: '#5C263A' },
    ocean: { primary: '#38BDF8', hover: '#7DD3FC', bg: '#132838', border: '#1F425C' },
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
