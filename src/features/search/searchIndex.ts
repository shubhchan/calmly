import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export interface SearchDestination {
  id: string;
  title: string;
  note: string;
  icon: IoniconName;
  route: string;
  params?: Record<string, unknown>;
  keywords?: string[];
}

/**
 * The app's quiet directory. Every feature stays reachable from Home search,
 * even when its hub only shows the four most useful choices.
 */
export const searchDestinations: SearchDestination[] = [
  // Calm
  { id: 'breathe', title: 'Breathe', note: 'Paced breathing, box or 4-7-8', icon: 'leaf-outline', route: 'BreathingSession', params: { preset: 'box', duration: 180 }, keywords: ['breath', 'breathwork', 'anxiety', 'calm'] },
  { id: 'body-scan', title: 'Body scan', note: 'Release tension, head to feet', icon: 'body-outline', route: 'BodyScan', keywords: ['rest', 'sleep', 'tension'] },
  { id: 'grounding', title: 'Sensory grounding', note: 'Five senses, one at a time', icon: 'hand-left-outline', route: 'SensoryGrounding', keywords: ['ground', 'panic', 'senses'] },
  { id: 'sounds', title: 'Soundscapes', note: 'Rain, pine, a slow shore', icon: 'water-outline', route: 'Soundscapes', keywords: ['music', 'nature', 'rain', 'ocean'] },
  { id: 'studio', title: 'Breathwork studio', note: 'Choose your own cadence', icon: 'pulse-outline', route: 'BreathworkStudio', keywords: ['breath', 'pattern'] },
  { id: 'playground', title: 'Playground', note: 'Bubbles, sand, a small companion', icon: 'ellipse-outline', route: 'ZenPlayground', keywords: ['game', 'bubbles', 'sand'] },
  { id: 'panic', title: 'A one-minute reset', note: 'For when it is too much right now', icon: 'flash-outline', route: 'PanicAnchor', keywords: ['panic', 'emergency', 'sos'] },

  // Journal
  { id: 'free-writing', title: 'Free writing', note: 'Unstructured flow of thought', icon: 'create-outline', route: 'JournalEntry', params: { type: 'free' }, keywords: ['journal', 'write', 'page'] },
  { id: 'daily-review', title: 'Daily review', note: 'Look back on the day', icon: 'sunny-outline', route: 'JournalEntry', params: { type: 'daily_reflection' }, keywords: ['journal', 'reflection', 'evening'] },
  { id: 'gratitude-page', title: 'Gratitude page', note: 'Name what you noticed', icon: 'heart-outline', route: 'JournalEntry', params: { type: 'gratitude' }, keywords: ['journal', 'thankful'] },
  { id: 'stress-page', title: 'Stress release', note: 'Put the weight down', icon: 'leaf-outline', route: 'JournalEntry', params: { type: 'stress' }, keywords: ['journal', 'worry'] },
  { id: 'sleep-page', title: 'Sleep and dreams', note: 'Close the night', icon: 'moon-outline', route: 'JournalEntry', params: { type: 'sleep' }, keywords: ['journal', 'dream'] },
  { id: 'morning-pages', title: 'Morning pages', note: 'Clear the early mind', icon: 'cafe-outline', route: 'JournalEntry', params: { type: 'morning' }, keywords: ['journal', 'morning'] },
  { id: 'brain-dump', title: 'Brain dump', note: 'Empty it all onto the page', icon: 'sparkles-outline', route: 'JournalEntry', params: { type: 'brain_dump' }, keywords: ['journal', 'list'] },

  // Gentle practices
  { id: 'affirmations', title: 'Affirmations', note: 'Words to keep close', icon: 'sparkles-outline', route: 'Affirmations', keywords: ['kind words', 'self talk'] },
  { id: 'reframing', title: 'Thought reframing', note: 'Meet a hard thought gently', icon: 'swap-horizontal-outline', route: 'ThoughtReframing', keywords: ['cbt', 'thought'] },
  { id: 'control', title: 'Sphere of control', note: 'Sort what is yours to carry', icon: 'aperture-outline', route: 'WhatCanIControl', keywords: ['worry', 'control'] },
  { id: 'compassion', title: 'Self compassion', note: 'A kinder inner voice', icon: 'heart-circle-outline', route: 'SelfCompassion', keywords: ['kind', 'soothe'] },
  { id: 'gratitude', title: 'Gratitude', note: 'Small good things', icon: 'sunny-outline', route: 'Gratitude', params: { type: 'gratitude' }, keywords: ['thankful'] },
  { id: 'positive-moments', title: 'Positive moments', note: 'Keep the good ones', icon: 'star-outline', route: 'Gratitude', params: { type: 'positive' }, keywords: ['happy', 'memory'] },

  // Rhythm
  { id: 'habits', title: 'Habits', note: 'Small things, kept', icon: 'checkmark-circle-outline', route: 'Habits', keywords: ['routine', 'daily'] },
  { id: 'routines', title: 'Routines', note: 'Morning and evening shape', icon: 'repeat-outline', route: 'Routines', keywords: ['morning', 'evening'] },
  { id: 'mood-check', title: 'Mood check-in', note: 'One tap, no judgement', icon: 'partly-sunny-outline', route: 'MoodCheckIn' },
  { id: 'mood-calendar', title: 'Mood calendar', note: 'Your weather over time', icon: 'calendar-outline', route: 'MoodCalendar' },
  { id: 'insights', title: 'Insights', note: 'Your week, gently', icon: 'analytics-outline', route: 'Insights' },
  { id: 'reflection-map', title: 'Reflection map', note: 'A longer look, when you want one', icon: 'git-network-outline', route: 'ReflectionReport' },

  // You
  { id: 'profile', title: 'Your profile', note: 'Name and avatar', icon: 'person-outline', route: 'Profile' },
  { id: 'reminders', title: 'Reminders', note: 'Quiet nudges for your day', icon: 'notifications-outline', route: 'Notifications' },
  { id: 'app-lock', title: 'App lock', note: 'PIN or biometric privacy', icon: 'lock-closed-outline', route: 'AppLockSettings' },
  { id: 'cloud', title: 'Cloud backup', note: 'Encrypted Google Drive sync', icon: 'cloud-outline', route: 'CloudStorage' },
  { id: 'your-data', title: 'Your data', note: 'Export or delete records', icon: 'download-outline', route: 'DataManagement' },
  { id: 'font', title: 'Font and text', note: 'Choose the reading voice', icon: 'text-outline', route: 'FontBrowser' },
];

function haystack(item: SearchDestination): string {
  return [
    item.title,
    item.note,
    ...(item.keywords ?? []),
  ]
    .join(' ')
    .toLowerCase();
}

export function searchDestinationsFor(query: string, limit = 4): SearchDestination[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const words = q.split(/\s+/).filter(Boolean);

  return searchDestinations
    .filter((item) => {
      const text = haystack(item);
      return words.every((word) => text.includes(word));
    })
    .sort((a, b) => {
      const aTitle = a.title.toLowerCase();
      const bTitle = b.title.toLowerCase();
      const aStarts = aTitle.startsWith(q) ? 0 : 1;
      const bStarts = bTitle.startsWith(q) ? 0 : 1;
      if (aStarts !== bStarts) return aStarts - bStarts;
      return aTitle.localeCompare(bTitle);
    })
    .slice(0, limit);
}

export interface SearchNote {
  id: string;
  title: string;
  body: string;
  createdAt: number;
  type: string;
  favorite?: boolean;
}

export function searchNotesFor(entries: any[], query: string, limit = 4): SearchNote[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const words = q.split(/\s+/).filter(Boolean);

  return (entries ?? [])
    .filter((entry) => {
      const text = `${entry?.title ?? ''} ${entry?.body ?? ''}`.toLowerCase();
      return words.every((word) => text.includes(word));
    })
    .slice(0, limit)
    .map((entry) => ({
      id: String(entry?.id ?? ''),
      title: String(entry?.title ?? '').trim() || 'Untitled page',
      body: String(entry?.body ?? ''),
      createdAt: Number(entry?.createdAt ?? Date.now()),
      type: String(entry?.type ?? 'free'),
      favorite: !!entry?.favorite,
    }));
}
