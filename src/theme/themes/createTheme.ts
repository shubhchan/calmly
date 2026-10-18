import type { ResolvedColors } from '../palette';
import { withAlpha } from '../tokens/colors';
import type { AppTheme, AppThemeColors, StatusTone } from './types';

function statusTone(base: string, isDark: boolean): StatusTone {
  return {
    default: base,
    subtle: withAlpha(base, isDark ? 0.18 : 0.1),
    border: withAlpha(base, isDark ? 0.42 : 0.3),
    foreground: base,
  };
}

/**
 * Build the semantic theme from the resolved raw palette.
 *
 * This is the ONLY place raw colors become semantic tokens — components never
 * see `bgPrimary`/`accentPrimary` etc. Because the mapping is a pure function,
 * switching accents or light/dark instantly updates every semantic token.
 */
export function createAppTheme(raw: ResolvedColors): AppTheme {
  const isDark = raw.isDark;

  const colors: AppThemeColors = {
    primary: {
      default: raw.accentPrimary,
      hover: raw.accentPrimaryHover,
      pressed: raw.accentPrimaryHover,
      // Dark-mode accents are bright (e.g. #62C27F); dark ink reads better
      // than white and keeps the 4.5:1 contrast bar.
      foreground: isDark ? raw.bgPrimary : '#FFFFFF',
      subtle: raw.accentBg,
      subtleBorder: raw.accentBorder,
      disabled: withAlpha(raw.accentPrimary, 0.45),
    },
    secondary: {
      default: raw.bgSecondary,
      hover: raw.bgCardHover,
      foreground: raw.textPrimary,
      subtle: raw.bgCard,
      subtleBorder: raw.borderLight,
    },
    accents: {
      sage: raw.accentSage,
      lavender: raw.accentLavender,
      sky: raw.accentSky,
      peach: raw.accentPeach,
      rose: raw.accentRose,
      ocean: raw.accentOcean,
    },
    background: {
      default: raw.bgPrimary,
      secondary: raw.bgSecondary,
      tertiary: raw.bgTertiary,
    },
    surface: {
      default: raw.bgCard,
      elevated: raw.bgCard,
      muted: raw.bgSecondary,
      hover: raw.bgCardHover,
      selected: raw.accentBg,
    },
    text: {
      primary: raw.textPrimary,
      secondary: raw.textSecondary,
      tertiary: raw.textTertiary,
      inverse: raw.textInverse,
      disabled: withAlpha(raw.textPrimary, isDark ? 0.45 : 0.38),
      link: raw.accentPrimary,
    },
    border: {
      subtle: withAlpha(raw.borderLight, isDark ? 0.7 : 0.65),
      default: raw.borderLight,
      strong: raw.borderMedium,
      focus: raw.accentPrimary,
      disabled: withAlpha(raw.borderMedium, 0.45),
    },
    status: {
      success: statusTone(raw.success, isDark),
      warning: statusTone(raw.warning, isDark),
      error: statusTone(raw.error, isDark),
      info: statusTone(raw.info, isDark),
    },
    interactive: {
      pressed: withAlpha(raw.textPrimary, isDark ? 0.14 : 0.06),
      hover: withAlpha(raw.textPrimary, isDark ? 0.09 : 0.04),
      focusRing: withAlpha(raw.accentPrimary, 0.45),
      selection: raw.accentBg,
    },
    overlay: {
      scrim: isDark ? 'rgba(2, 6, 16, 0.62)' : 'rgba(15, 23, 42, 0.5)',
      backdrop: isDark ? 'rgba(2, 6, 16, 0.4)' : 'rgba(15, 23, 42, 0.28)',
    },
    disabled: {
      background: raw.bgSecondary,
      foreground: raw.textTertiary,
      border: withAlpha(raw.borderMedium, 0.45),
    },
  };

  return {
    mode: raw.theme,
    isDark,
    accent: raw.accent,
    colors,
    raw,
  };
}
