import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import {
  getStateFromPath as defaultGetStateFromPath,
  getPathFromState as defaultGetPathFromState,
} from '@react-navigation/core';
import type { LinkingOptions } from '@react-navigation/native';
import type { RootStackParamList } from '../types/navigation';

/**
 * Determine web sub-path (e.g. 'calmly' on GitHub Pages) so navigation
 * stays rooted on the base URL without breaking subpath deployments or root domains.
 */
export function getWebBasePath(): string {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return '';
  }
  const expoBase = (Constants.expoConfig as any)?.experiments?.baseUrl;
  if (typeof expoBase === 'string' && expoBase && expoBase !== '/') {
    return expoBase.replace(/^\/+|\/+$/g, '');
  }
  const pathname = window.location.pathname || '';
  if (pathname.startsWith('/calmly')) {
    return 'calmly';
  }
  return '';
}

export function getLinkingPrefixes(): string[] {
  const prefixes: string[] = [Linking.createURL('/'), 'calmly://'];

  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.origin) {
    const origin = window.location.origin;
    if (!prefixes.includes(origin)) {
      prefixes.push(origin);
    }
    const basePath = getWebBasePath();
    if (basePath) {
      const fullBase = `${origin}/${basePath}`;
      if (!prefixes.includes(fullBase)) {
        prefixes.push(fullBase);
      }
    }
  }

  return prefixes;
}

export const linkingScreens = {
  App: {
    screens: {
      Home: {
        path: '',
        screens: {
          HomeMain: '',
        },
      },
      Calm: {
        path: 'calm',
        screens: {
          CalmMain: '',
        },
      },
      Journal: {
        path: 'journal',
        screens: {
          JournalMain: '',
        },
      },
      Insights: {
        path: 'insights',
        screens: {
          InsightsMain: '',
        },
      },
      Settings: {
        path: 'settings',
        screens: {
          SettingsMain: '',
        },
      },
    },
  },
  // Alias for App stack if referenced
  Main: {
    screens: {
      Home: 'main/home',
      Calm: 'main/calm',
      Journal: 'main/journal',
      Insights: 'main/insights',
      Settings: 'main/settings',
    },
  },

  // Introspective Modals & Sheet Flows
  JournalEntry: 'journal/entry/:id?',
  MoodCheckIn: 'mood/checkin',
  HabitForm: 'habits/form',
  GratitudeForm: 'gratitude/form',
  SetPin: 'settings/pin',

  // Immersive Somatic Focus Modes
  BreathingSession: 'calm/breathe',
  PanicAnchor: 'calm/panic-anchor',
  GroundingExercise: 'calm/grounding',

  // Pushed Sanctuaries
  Onboarding: 'onboarding',
  Profile: 'profile',
  AppLock: 'lock',
  Habits: 'habits',
  HabitDetail: 'habits/:id',
  Routines: 'routines',
  RoutineDetail: 'routines/:timeOfDay',
  Gratitude: 'gratitude',
  Affirmations: 'affirmations',
  AffirmationDetail: 'affirmations/:id',
  SelfCompassion: 'gratitude/self-compassion',
  WhatCanIControl: 'gratitude/control',
  ThoughtReframing: 'gratitude/thought-reframing',
  Notifications: 'settings/notifications',
  AppLockSettings: 'settings/lock',
  DataManagement: 'settings/data',
  CloudStorage: 'settings/cloud',
  BreathworkStudio: 'calm/breathwork',
  ZenPlayground: 'calm/playground',
  Soundscapes: 'calm/soundscapes',
  SensoryGrounding: 'calm/sensory',
  BodyScan: 'calm/body-scan',
  MoodCalendar: 'insights/calendar',
  ReflectionReport: 'insights/report',
  FontBrowser: 'settings/fonts',
  DesignSystem: 'design-system',
};

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: getLinkingPrefixes(),
  config: {
    path: getWebBasePath(),
    screens: linkingScreens,
  },
  getStateFromPath: (path, options) => {
    let cleanPath = path;
    const base = options?.path;
    if (base) {
      const normalizedBase = base.replace(/^\/+|\/+$/g, '');
      const regex = new RegExp(`^/?${normalizedBase}(/.*)?$`);
      const match = cleanPath.match(regex);
      if (match) {
        cleanPath = match[1] || '/';
      }
    }
    const strippedOptions = { ...options, path: undefined };
    return defaultGetStateFromPath(cleanPath, strippedOptions);
  },
  getPathFromState: (state, options) => {
    const rawPath = defaultGetPathFromState(state, { ...options, path: undefined });
    const base = options?.path?.replace(/^\/+|\/+$/g, '');
    if (!base) return rawPath;
    if (rawPath === '/') return `/${base}`;
    return `/${base}${rawPath.startsWith('/') ? rawPath : `/${rawPath}`}`;
  },
};
