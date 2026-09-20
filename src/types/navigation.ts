export type RootStackParamList = {
  App: undefined;
  Home: undefined;
  Journal: undefined;
  JournalEntry: { id?: string; type?: JournalType };
  Calm: undefined;
  BreathingSession: { preset?: BreathingPreset; duration?: number };
  GroundingExercise: { type: GroundingType };
  Insights: undefined;
  MoodCalendar: undefined;
  Settings: undefined;
  MoodCheckIn: { fromHome?: boolean };
  Onboarding: undefined;
  AppLock: undefined;
  Habits: undefined;
  HabitDetail: { id: string };
  HabitForm: { id?: string };
  Routines: undefined;
  RoutineDetail: { timeOfDay: 'morning' | 'afternoon' | 'evening'; routine?: any };
  Gratitude: { type: 'gratitude' | 'positive' };
  GratitudeForm: { type: 'gratitude' | 'positive'; id?: string };
  Affirmations: undefined;
  AffirmationDetail: { id: string };
  SelfCompassion: undefined;
  WhatCanIControl: undefined;
  ThoughtReframing: undefined;
  Notifications: undefined;
  AppLockSettings: undefined;
  SetPin: { onComplete?: () => void };
  DataManagement: undefined;
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
  | 'hopeful';

export type HabitFrequency = 'daily' | 'weekdays' | 'custom';

export type ThemeMode = 'light' | 'dark' | 'system';
export type AccentColor = 'sage' | 'lavender' | 'sky' | 'peach' | 'rose' | 'ocean';