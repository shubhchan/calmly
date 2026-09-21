import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useColorScheme, View } from 'react-native';
import { vars } from 'nativewind';
import { Storage } from '../services/storage';
import { bootLog } from '../components/ErrorBoundary';
import { resolveColors, toCssVars, ThemeMode as ResolvedMode, AccentColor } from './palette';

export type ThemeMode = 'light' | 'dark' | 'system';
export type { AccentColor };

interface ThemeContextType {
  theme: ThemeMode;
  accent: AccentColor;
  resolvedTheme: ResolvedMode;
  colors: ReturnType<typeof resolveColors>;
  setTheme: (theme: ThemeMode) => Promise<void>;
  setAccent: (accent: AccentColor) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'app_theme';
const ACCENT_STORAGE_KEY = 'app_accent';
const DEFAULT_ACCENT: AccentColor = 'sage';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeMode>('system');
  const [accent, setAccentState] = useState<AccentColor>(DEFAULT_ACCENT);

  useEffect(() => {
    bootLog('theme-ready');
  }, []);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [savedTheme, savedAccent] = await Promise.all([
          Storage.getString(THEME_STORAGE_KEY),
          Storage.getString(ACCENT_STORAGE_KEY),
        ]);
        if (savedTheme) setThemeState(savedTheme as ThemeMode);
        if (savedAccent) setAccentState(savedAccent as AccentColor);
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
  const colors = useMemo(() => resolveColors(resolvedTheme, accent), [resolvedTheme, accent]);
  const themeVars = useMemo(() => vars(toCssVars(colors)), [colors]);

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
  };

  const setAccent = async (newAccent: AccentColor) => {
    setAccentState(newAccent);
    await Storage.setString(ACCENT_STORAGE_KEY, newAccent);
  };

  const toggleTheme = async () => {
    const newTheme: ThemeMode = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    await setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider
      value={{ theme, accent, resolvedTheme, colors, setTheme, setAccent, toggleTheme }}
    >
      {/* This View carries the CSS variables for the whole native tree. */}
      <View style={themeVars} className="flex-1">
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
