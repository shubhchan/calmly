import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { AppState, Platform, useColorScheme, View } from 'react-native';
import { vars } from 'nativewind';
import { useMaterial3Theme } from '@pchmn/expo-material3-theme';
import { useFontStore } from './fontStore';
import { Storage } from '../services/storage';
import { settingsRepository } from '../database/repositories/settingsRepository';
import { bootLog } from '../components/ErrorBoundary';
import { customAccentFor, resolveColors, toCssVars, ThemeMode as ResolvedMode, AccentColor } from './palette';
import { createAppTheme, lightTheme, type AppTheme } from './themes';

export type ThemeMode = 'light' | 'dark' | 'system';
export type { AccentColor };

interface ThemeContextType {
  theme: ThemeMode;
  accent: AccentColor;
  resolvedTheme: ResolvedMode;
  isDark: boolean;
  /** Whether wallpaper-derived Material You colors override the palette. */
  dynamicColors: boolean;
  /** Whether high-contrast ink is enabled for body text and typography tokens. */
  highContrast: boolean;
  colors: ReturnType<typeof resolveColors>;
  /** Semantic design-system tokens (colors etc.) derived from the raw palette. */
  tokens: AppTheme;
  setTheme: (theme: ThemeMode) => Promise<void>;
  setAccent: (accent: AccentColor) => Promise<void>;
  setDynamicColors: (enabled: boolean) => Promise<void>;
  setHighContrast: (enabled: boolean) => Promise<void>;
  toggleTheme: () => Promise<void>;
  fontRevision?: number;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'app_theme';
const ACCENT_STORAGE_KEY = 'app_accent';
const DYNAMIC_COLORS_STORAGE_KEY = 'app_dynamic_colors';
const HIGH_CONTRAST_STORAGE_KEY = 'app_high_contrast';
const DEFAULT_ACCENT: AccentColor = 'sage';

/** Android 12+ (API 31+) supports Material You dynamic colors.
 *  iOS and older Android always use the app's own palette. */
export function supportsDynamicColors(): boolean {
  return Platform.OS === 'android' && Number(Platform.Version) >= 31;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeMode>('system');
  const [accent, setAccentState] = useState<AccentColor>(DEFAULT_ACCENT);
  /** Whether wallpaper-derived colors override the accent. Android 12+ only. */
  const [dynamicColors, setDynamicColorsState] = useState(supportsDynamicColors());
  const [highContrast, setHighContrastState] = useState(false);
  /** Wallpaper-derived Material 3 theme; on unsupported devices the library
   *  returns a fallback built from fallbackSourceColor. */
  const { theme: m3Theme } = useMaterial3Theme({ fallbackSourceColor: '#2C4F45' });
  /** Re-resolves the 'dynamic' accent when the app returns to the foreground. */
  const [dynamicTick, setDynamicTick] = useState(0);
  const fontRevision = useFontStore((s) => s.revision);

  useEffect(() => {
    if (accent !== 'dynamic') return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') setDynamicTick((t) => t + 1);
    });
    return () => sub.remove();
  }, [accent]);

  useEffect(() => {
    bootLog('theme-ready');
  }, []);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [savedTheme, savedAccent, savedDynamic, savedHighContrast] = await Promise.all([
          Storage.getString(THEME_STORAGE_KEY),
          Storage.getString(ACCENT_STORAGE_KEY),
          Storage.getString(DYNAMIC_COLORS_STORAGE_KEY),
          Storage.getString(HIGH_CONTRAST_STORAGE_KEY),
        ]);
        if (savedTheme) setThemeState(savedTheme as ThemeMode);
        if (savedAccent) setAccentState(savedAccent as AccentColor);
        if (typeof savedDynamic === 'string') setDynamicColorsState(savedDynamic === 'true');
        if (typeof savedHighContrast === 'string') setHighContrastState(savedHighContrast === 'true');

        if (!savedTheme || !savedAccent) {
          const dbSettings = await settingsRepository.getSettings();
          if (!savedTheme && dbSettings?.theme) {
            setThemeState(dbSettings.theme as ThemeMode);
          }
          if (!savedAccent && dbSettings?.accent) {
            setAccentState(dbSettings.accent as AccentColor);
          }
          if (typeof savedDynamic !== 'string' && dbSettings?.dynamicColors === false) {
            setDynamicColorsState(false);
          }
          if (typeof savedHighContrast !== 'string' && (dbSettings as any)?.highContrast) {
            setHighContrastState(true);
          }
        }
      } catch (error) {
        // Renders with defaults (system theme, sage accent) below regardless —
        // a storage failure should never take down the whole app's UI.
        console.warn('Failed to load theme settings:', error);
      }
    };
    loadSettings();
  }, []);

  const resolvedTheme: ResolvedMode =
    theme === 'system' ? (systemColorScheme === 'dark' ? 'dark' : 'light') : theme;

  // Single source of truth for native. `colors` gives literal hex for props that
  // don't go through className (Ionicons `color`, SVG `stroke`/`fill`, etc).
  // `themeVars` feeds NativeWind's vars() so `className="bg-[var(--color-x)]"`
  // resolves correctly at runtime, including on theme/accent change.
  // Guarded: if the CSS-interop runtime ever throws in a release bundle, the
  // app still paints (unstyled vars) instead of grey-screening.
  const colors = useMemo(() => {
    const resolved = resolveColors(resolvedTheme, accent);
    // Material You: when enabled on Android 12+, the wallpaper's system
    // source color becomes the accent ramp; neutrals stay "Still Water".
    if (dynamicColors) {
      const scheme = m3Theme?.[resolvedTheme];
      const ramp = scheme ? customAccentFor(scheme.primary, resolvedTheme) : null;
      if (ramp) {
        return {
          ...resolved,
          accentPrimary: ramp.primary,
          accentPrimaryHover: ramp.hover,
          accentBg: ramp.bg,
          accentBorder: ramp.border,
        };
      }
    }
    return resolved;
  }, [resolvedTheme, accent, dynamicTick, dynamicColors, m3Theme]);
  const tokens = useMemo(() => createAppTheme(colors, highContrast), [colors, highContrast]);
  const themeVars = useMemo(() => {
    try {
      return vars(toCssVars(colors));
    } catch (error) {
      console.warn('Theme vars failed, continuing without CSS vars:', error);
      bootLog('theme-vars-failed');
      return {};
    }
  }, [colors]);

  // Web still gets the DOM attribute treatment so plain CSS in global.css
  // ([data-theme]/[data-accent] selectors) keeps working for RN-web/browser builds.
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', resolvedTheme);
      document.documentElement.setAttribute('data-accent', accent);
    }
  }, [resolvedTheme, accent]);

  const setTheme = async (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    await Storage.setString(THEME_STORAGE_KEY, newTheme);
    try {
      await settingsRepository.updateSettings({ theme: newTheme });
    } catch (e) {
      // non-blocking
    }
  };

  const setAccent = async (newAccent: AccentColor) => {
    setAccentState(newAccent);
    await Storage.setString(ACCENT_STORAGE_KEY, newAccent);
    try {
      await settingsRepository.updateSettings({ accent: newAccent });
    } catch (e) {
      // non-blocking
    }
  };

  const setDynamicColors = async (enabled: boolean) => {
    setDynamicColorsState(enabled);
    await Storage.setString(DYNAMIC_COLORS_STORAGE_KEY, enabled ? 'true' : 'false');
    try {
      await settingsRepository.updateSettings({ dynamicColors: enabled });
    } catch (e) {
      // non-blocking
    }
  };

  const setHighContrast = async (enabled: boolean) => {
    setHighContrastState(enabled);
    await Storage.setString(HIGH_CONTRAST_STORAGE_KEY, enabled ? 'true' : 'false');
    try {
      await settingsRepository.updateSettings({ highContrast: enabled } as any);
    } catch (e) {
      // non-blocking
    }
  };

  const toggleTheme = async () => {
    const newTheme: ThemeMode = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    await setTheme(newTheme);
  };

    const isDark = resolvedTheme === 'dark';

  return (
    <ThemeContext.Provider
      value={{
        theme,
        accent,
        resolvedTheme,
        isDark,
        dynamicColors,
        highContrast,
        colors,
        tokens,
        setTheme,
        setAccent,
        setDynamicColors,
        setHighContrast,
        toggleTheme,
        fontRevision,
      }}
    >
      {/* This View carries the CSS variables for the whole native tree. */}
      {/* NOTE: flex:1 is set as a plain style (not only className) so a
          CSS-interop failure can never collapse the root to zero size and
          blank the entire app with no error. */}
      <View style={[{ flex: 1 }, themeVars]} className="flex-1">
        {children}
      </View>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Use this anywhere you need a literal color value instead of a className —
// Ionicons `color`, react-native-svg `stroke`/`fill`, chart libraries, etc.
// Never pass 'var(--color-x)' strings to those props; they are not CSS-aware.
export function useThemeColors() {
  return useTheme().colors;
}

/**
 * Design-system hook: the semantic theme. Safe to call outside the provider
 * (boot screens, error boundaries) — falls back to the canonical light theme
 * instead of throwing.
 */
export function useAppTheme(): AppTheme {
  const context = useContext(ThemeContext);
  return context?.tokens ?? lightTheme;
}

export function useThemedStyles<T>(styleCreator: (colors: ReturnType<typeof resolveColors>, isDark: boolean) => T): T {
  const { colors, isDark } = useTheme();
  return useMemo(() => styleCreator(colors, isDark), [colors, isDark, styleCreator]);
}

