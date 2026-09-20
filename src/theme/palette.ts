// Mirrors the token values in /global.css exactly.
// Web reads global.css directly; native has no DOM/CSS engine, so this JS palette
// is what actually drives colors on iOS/Android via NativeWind's `vars()` (see
// ThemeContext.tsx) and via the `useThemeColors()` hook for non-style-prop APIs
// (Ionicons `color`, react-native-svg `stroke`/`fill`, etc).

export type ThemeMode = 'light' | 'dark';
export type AccentColor = 'sage' | 'lavender' | 'sky' | 'peach' | 'rose' | 'ocean';

const base = {
  light: {
    bgPrimary: '#FDFBF7',
    bgSecondary: '#FAF6ED',
    bgTertiary: '#F5F0DE',
    bgCard: '#FFFFFF',
    bgCardHover: '#FAF6ED',
    textPrimary: '#1E232E',
    textSecondary: '#34415A',
    textTertiary: '#425474',
    textInverse: '#FDFBF7',
    borderLight: '#E4DEBC',
    borderMedium: '#DBD4A9',
    success: '#5A955A',
    warning: '#EB876D',
    error: '#EB697F',
    info: '#6B9BCD',
  },
  dark: {
    bgPrimary: '#151A23',
    bgSecondary: '#1E232E',
    bgTertiary: '#293143',
    bgCard: '#1E232E',
    bgCardHover: '#293143',
    textPrimary: '#FDFBF7',
    textSecondary: '#E1EBF5',
    textTertiary: '#C3D7EB',
    textInverse: '#151A23',
    borderLight: '#34415A',
    borderMedium: '#425474',
    success: '#74AC74',
    warning: '#EF9F8A',
    error: '#EF8799',
    info: '#87AFD7',
  },
};

const accents = {
  light: {
    sage: { primary: '#5A955A', hover: '#477747', bg: '#F0F4F0', border: '#BAD6BA' },
    lavender: { primary: '#877FC5', hover: '#6E64A8', bg: '#F3F1FA', border: '#CFCBE9' },
    sky: { primary: '#6B9BCD', hover: '#5282B0', bg: '#F0F5FA', border: '#C3D7EB' },
    peach: { primary: '#EB876D', hover: '#E06E50', bg: '#FDF3F0', border: '#F7CFC4' },
    rose: { primary: '#EB697F', hover: '#E04E65', bg: '#FDF0F3', border: '#F7C3CD' },
    ocean: { primary: '#5F9BB4', hover: '#4A8095', bg: '#EFF5F7', border: '#BFD7E1' },
  },
  dark: {
    sage: { primary: '#74AC74', hover: '#97C197', bg: '#2D4B2D', border: '#385E38' },
    lavender: { primary: '#9F98D1', hover: '#B7B2DD', bg: '#473F6E', border: '#584E8A' },
    sky: { primary: '#87AFD7', hover: '#A5C3E1', bg: '#2E4660', border: '#365475' },
    peach: { primary: '#EF9F8A', hover: '#F3B7A7', bg: '#5D3A2B', border: '#7A4A3A' },
    rose: { primary: '#EF8799', hover: '#F3A5B3', bg: '#5D2E3A', border: '#7A3D4D' },
    ocean: { primary: '#7FAFC3', hover: '#9FC3D2', bg: '#27414C', border: '#30515E' },
  },
};

export function resolveColors(theme: ThemeMode, accent: AccentColor) {
  const b = base[theme];
  const a = accents[theme][accent];
  return {
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
  };
}

export type ResolvedColors = ReturnType<typeof resolveColors>;

// Converts { textPrimary: '#111' } -> { '--color-text-primary': '#111' }
// so it can be handed straight to NativeWind's vars().
export function toCssVars(colors: ResolvedColors): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(colors)) {
    const kebab = key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
    out[`--color-${kebab}`] = value;
  }
  return out;
}
