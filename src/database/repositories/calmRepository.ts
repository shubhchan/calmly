import { database } from '..';
import { Q } from '@nozbe/watermelondb';
import { CalmSession, BreathingSession, MeditationSession } from '../models';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY_CALM = '@calmly_calm_sessions';
const STORAGE_KEY_BREATHING = '@calmly_breathing_sessions';
const STORAGE_KEY_MEDITATION = '@calmly_meditation_sessions';

const calmCollection = database.get<CalmSession>('calm_sessions');
const breathingCollection = database.get<BreathingSession>('breathing_sessions');
const meditationCollection = database.get<MeditationSession>('meditation_sessions');

async function getStoredList(key: string): Promise<any[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

async function appendStoredItem(key: string, item: any): Promise<void> {
  try {
    const list = await getStoredList(key);
    await AsyncStorage.setItem(key, JSON.stringify([item, ...list]));
  } catch {}
}

export const calmRepository = {
  async logSession(data: {
    type: 'breathing' | 'grounding' | 'meditation';
    preset?: string;
    duration: number;
    completed: boolean;
  }) {
    const now = Date.now();
    try {
      await database.write(async () => {
        return calmCollection.create((session) => {
          session.type = data.type;
          session.preset = data.preset || '';
          session.duration = data.duration;
          session.completed = data.completed;
          session.createdAt = now;
        });
      });
    } catch (err) {
      console.warn('WatermelonDB calmSession log fallback:', err);
    }

    const fallback = {
      id: `calm_${now}_${Math.random().toString(36).substr(2, 6)}`,
      type: data.type,
      preset: data.preset || '',
      duration: data.duration,
      completed: data.completed,
      createdAt: now,
    };
    await appendStoredItem(STORAGE_KEY_CALM, fallback);
    return fallback;
  },

  async logBreathing(data: {
    preset: string;
    duration: number;
    cyclesCompleted: number;
  }) {
    const now = Date.now();
    try {
      await database.write(async () => {
        return breathingCollection.create((session) => {
          session.preset = data.preset;
          session.duration = data.duration;
          session.cyclesCompleted = data.cyclesCompleted;
          session.createdAt = now;
        });
      });
    } catch (err) {
      console.warn('WatermelonDB breathingSession log fallback:', err);
    }

    const fallback = {
      id: `breath_${now}_${Math.random().toString(36).substr(2, 6)}`,
      preset: data.preset,
      duration: data.duration,
      cyclesCompleted: data.cyclesCompleted,
      createdAt: now,
    };
    await appendStoredItem(STORAGE_KEY_BREATHING, fallback);
    return fallback;
  },

  async logMeditation(data: {
    title: string;
    duration: number;
    completed: boolean;
  }) {
    const now = Date.now();
    try {
      await database.write(async () => {
        return meditationCollection.create((session) => {
          session.title = data.title;
          session.duration = data.duration;
          session.completed = data.completed;
          session.createdAt = now;
        });
      });
    } catch (err) {
      console.warn('WatermelonDB meditation log fallback:', err);
    }

    const fallback = {
      id: `med_${now}_${Math.random().toString(36).substr(2, 6)}`,
      title: data.title,
      duration: data.duration,
      completed: data.completed,
      createdAt: now,
    };
    await appendStoredItem(STORAGE_KEY_MEDITATION, fallback);
    return fallback;
  },

  async getSessionsByDateRange(startDate: number, endDate: number): Promise<CalmSession[]> {
    try {
      const results = await calmCollection
        .query(
          Q.where('created_at', Q.between(startDate, endDate)),
          Q.sortBy('created_at', Q.desc)
        )
        .fetch();
      if (results.length > 0) return results;
    } catch {}

    const stored = await getStoredList(STORAGE_KEY_CALM);
    return stored.filter((s) => s.createdAt >= startDate && s.createdAt <= endDate) as unknown as CalmSession[];
  },

  async getBreathingSessions(startDate: number, endDate: number): Promise<BreathingSession[]> {
    try {
      const results = await breathingCollection
        .query(
          Q.where('created_at', Q.between(startDate, endDate)),
          Q.sortBy('created_at', Q.desc)
        )
        .fetch();
      if (results.length > 0) return results;
    } catch {}

    const stored = await getStoredList(STORAGE_KEY_BREATHING);
    return stored.filter((s) => s.createdAt >= startDate && s.createdAt <= endDate) as unknown as BreathingSession[];
  },

  async getTotalBreathingMinutes(startDate: number, endDate: number): Promise<number> {
    const sessions = await this.getBreathingSessions(startDate, endDate);
    return sessions.reduce((sum, s) => sum + s.duration, 0);
  },

  async getTotalCalmSessions(startDate: number, endDate: number): Promise<number> {
    const sessions = await this.getSessionsByDateRange(startDate, endDate);
    return sessions.filter((s) => s.completed).length;
  },
};