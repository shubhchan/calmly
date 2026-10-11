// Mirrors the token values in /global.css exactly.
// Web reads global.css directly; native has no DOM/CSS engine, so this JS palette
// is what actually drives colors on iOS/Android via NativeWind's `vars()` (see
// ThemeContext.tsx) and via the `useThemeColors()` hook for non-style-prop APIs
// (Ionicons `color`, react-native-svg `stroke`/`fill`, etc).

export type ThemeMode = 'light' | 'dark';
export type AccentColor = 'sage' | 'lavender' | 'sky' | 'peach' | 'rose' | 'ocean';

const base = {
  light: {
    bgPrimary: '#FBF9F5',
    bgSecondary: '#F4EFE6',
    bgTertiary: '#ECE5D8',
    bgCard: '#FFFFFF',
    bgCardHover: '#F8F4EC',
    textPrimary: '#1A212D',
    textSecondary: '#384455',
    textTertiary: '#607085',
    textInverse: '#FBF9F5',
    borderLight: '#E6E0D4',
    borderMedium: '#D5CCC0',
    success: '#3E7B52',
    warning: '#D96547',
    error: '#DB3A60',
    info: '#2563EB',
  },
  dark: {
    bgPrimary: '#0F141C',
    bgSecondary: '#151C28',
    bgTertiary: '#1C2536',
    bgCard: '#182130',
    bgCardHover: '#202B3E',
    textPrimary: '#F9FAFB',
    textSecondary: '#D1D5DB',
    textTertiary: '#94A3B8',
    textInverse: '#0F141C',
    borderLight: '#263346',
    borderMedium: '#34435C',
    success: '#5EBE7B',
    warning: '#FB923C',
    error: '#F47293',
    info: '#60A5FA',
  },
};

const accents = {
  light: {
    sage: { primary: '#3E7B52', hover: '#316342', bg: '#EDF5EF', border: '#C2DCBF' },
    lavender: { primary: '#6C5CE7', hover: '#5849C4', bg: '#F2F0FB', border: '#D0CAFC' },
    sky: { primary: '#2563EB', hover: '#1D4ED8', bg: '#EFF5FF', border: '#BFDBFE' },
    peach: { primary: '#D96547', hover: '#BD5034', bg: '#FDF2EE', border: '#F8CEBE' },
    rose: { primary: '#DB3A60', hover: '#BF2C4F', bg: '#FDF1F4', border: '#F8C1CD' },
    ocean: { primary: '#0E7490', hover: '#0B5E75', bg: '#EDF8FB', border: '#BAE6FD' },
  },
  dark: {
    sage: { primary: '#5EBE7B', hover: '#7BD495', bg: '#172E1E', border: '#254E31' },
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
