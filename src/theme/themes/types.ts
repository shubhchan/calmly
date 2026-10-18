import type { AccentColor, ResolvedColors, ThemeMode } from '../palette';

/** A status color family (success / warning / error / info). */
export interface StatusTone {
  /** Base hue — icons, bars, strong text. */
  default: string;
  /** Very soft background tint for banners and badges. */
  subtle: string;
  /** Border for tinted containers. */
  border: string;
  /** Readable text/icon color on `subtle`. */
  foreground: string;
}

/**
 * Semantic color contract. Every theme (light, dark, any future theme) must
 * provide the exact same shape — components only ever read these names.
 */
export interface AppThemeColors {
  /** Primary action / brand color (follows the user's chosen accent). */
  primary: {
    default: string;
    hover: string;
    pressed: string;
    /** Text/icon color ON the primary fill. */
    foreground: string;
    /** Soft tinted background (secondary buttons, icon plates). */
    subtle: string;
    subtleBorder: string;
    disabled: string;
  };
  /** Neutral secondary action. */
  secondary: {
    default: string;
    hover: string;
    foreground: string;
    subtle: string;
    subtleBorder: string;
  };
  /** Named accent hues, for playful per-card tones. */
  accents: Record<AccentColor, string>;
  background: {
    default: string;
    secondary: string;
    tertiary: string;
  };
  surface: {
    default: string;
    elevated: string;
    muted: string;
    hover: string;
    selected: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverse: string;
    disabled: string;
    link: string;
  };
  border: {
    subtle: string;
    default: string;
    strong: string;
    focus: string;
    disabled: string;
  };
  status: {
    success: StatusTone;
    warning: StatusTone;
    error: StatusTone;
    info: StatusTone;
  };
  interactive: {
    pressed: string;
    hover: string;
    focusRing: string;
    selection: string;
  };
  overlay: {
    scrim: string;
    backdrop: string;
  };
  disabled: {
    background: string;
    foreground: string;
    border: string;
  };
}

/** The full theme object handed to components via `useAppTheme()`. */
export interface AppTheme {
  mode: ThemeMode;
  isDark: boolean;
  accent: AccentColor;
  colors: AppThemeColors;
  /** Escape hatch: raw palette values for legacy code paths. */
  raw: ResolvedColors;
}
