export type RootStackParamList = {
  App: undefined;
  Home: undefined;
  HomeMain: undefined;
  Journal: undefined;
  JournalMain: undefined;
  JournalEntry?: {
    id?: string;
    type?: JournalType;
    preview?: {
      title?: string;
      body?: string;
      favorite?: boolean;
    };
  };
  Calm: undefined;
  CalmMain: undefined;
  BreathworkStudio: undefined;
  Soundscapes: undefined;
  SensoryGrounding: undefined;
  BodyScan: undefined;
  PanicAnchor: undefined;
  BreathingSession?: { preset?: BreathingPreset; duration?: number };
  GroundingExercise?: { type: GroundingType };
  Insights: undefined;
  InsightsMain: undefined;
  MoodCalendar: undefined;
  ReflectionReport: undefined;
  Settings: undefined;
  SettingsMain: undefined;
  MoodCheckIn?: { fromHome?: boolean };
  Onboarding: undefined;
  AppLock: undefined;
  Habits: undefined;
  HabitDetail: {
    id: string;
    preview?: {
      name: string;
      icon: string;
      color: string;
      frequency: string;
      customDays?: string;
    };
  };
  HabitForm?: {
    id?: string;
    preview?: {
      name: string;
      icon: string;
      color: string;
      frequency: string;
      customDays?: string;
      reminderTime?: string;
      goal?: number;
      notes?: string;
    };
  };
  Routines: undefined;
  RoutineDetail: { timeOfDay: 'morning' | 'afternoon' | 'evening'; routine?: any };
  Gratitude: { type: 'gratitude' | 'positive' };
  GratitudeForm: { type: 'gratitude' | 'positive'; id?: string };
  Affirmations: undefined;
  AffirmationDetail: {
    id: string;
    preview?: {
      text: string;
      category: string;
      favorite: boolean;
    };
  };
  SelfCompassion: undefined;
  WhatCanIControl: undefined;
  ThoughtReframing: undefined;
  Notifications: undefined;
  AppLockSettings: undefined;
  SetPin: undefined;
  DataManagement: undefined;
  CloudStorage: undefined;
  FontBrowser: undefined;
  DesignSystem: undefined;
};

export type TabParamList = {
  Home: undefined;
  Journal: undefined;
  Calm: undefined;
  Insights: undefined;
  Settings: undefined;
  Habits: undefined;
};

export type JournalType = 
  | 'free' 
  | 'daily_reflection' 
  | 'gratitude' 
  | 'stress' 
  | 'sleep' 
  | 'morning' 
  | 'evening' 
  | 'brain_dump';

export type BreathingPreset = 
  | 'box' 
  | '4-6' 
  | '4-7-8' 
  | 'deep' 
  | 'slow' 
  | 'relaxation';

export type GroundingType = 
  | '5-4-3-2-1' 
  | 'body-scan' 
  | 'cognitive' 
  | 'physical';

export type MoodType = 
  | 'happy' 
  | 'peaceful' 
  | 'grateful' 
  | 'stressed' 
  | 'overwhelmed' 
  | 'anxious' 
  | 'sad' 
  | 'angry' 
  | 'exhausted' 
  | 'excited' 
  | 'content' 
  | 'hopeful'
  | 'proud'
  | 'motivated'
  | 'relieved'
  | 'lonely'
  | 'frustrated'
  | 'uncertain'
  | 'connected'
  | 'bored';

export type HabitFrequency = 'daily' | 'weekdays' | 'custom';

export type ThemeMode = 'light' | 'dark' | 'system';
export type AccentColor = 'sage' | 'lavender' | 'sky' | 'peach' | 'rose' | 'ocean';