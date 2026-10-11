import { database } from '..';
import { Q } from '@nozbe/watermelondb';
import { MoodEntry } from '../models';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@calmly_mood_entries';
const moodCollection = database.get<MoodEntry>('mood_entries');

let memoryMoodCache: any[] = [];

async function getStoredMoods(): Promise<any[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        memoryMoodCache = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to read moods from AsyncStorage:', err);
  }
  return memoryMoodCache;
}

async function saveStoredMoods(entries: any[]): Promise<void> {
  memoryMoodCache = entries;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (err) {
    console.warn('Failed to save moods to AsyncStorage:', err);
  }
}

export const moodRepository = {
  async create(data: {
    mood: string;
    intensity: number;
    stress: number;
    energy: string;
    context?: string;
    needs?: string;
  }) {
    const now = Date.now();
    let watermelonRecord: any = null;

    try {
      watermelonRecord = await database.write(async () => {
        return moodCollection.create((entry) => {
          entry.mood = data.mood;
          entry.intensity = data.intensity;
          entry.stress = data.stress;
          entry.energy = data.energy;
          entry.context = data.context || '';
          entry.needs = data.needs || '';
          entry.createdAt = now;
          entry.updatedAt = now;
        });
      });
    } catch (err) {
      console.warn('WatermelonDB mood create failed, using persistent storage fallback:', err);
    }

    const fallbackItem = {
      id: watermelonRecord?.id || `mood_${now}_${Math.random().toString(36).slice(2, 8)}`,
      mood: data.mood,
      intensity: data.intensity,
      stress: data.stress,
      energy: data.energy,
      context: data.context || '',
      needs: data.needs || '',
      createdAt: now,
      updatedAt: now,
    };

    const existing = await getStoredMoods();
    const updated = [fallbackItem, ...(existing ?? []).filter((e: any) => e?.id !== fallbackItem.id)];
    await saveStoredMoods(updated);

    return watermelonRecord || fallbackItem;
  },

  async getLatest(): Promise<MoodEntry | any | null> {
    try {
      const entries = await moodCollection
        .query(Q.sortBy('created_at', Q.desc), Q.take(1))
        .fetch();
      if (entries.length > 0) return entries[0];
    } catch {
      // Fallback below
    }

    const stored = await getStoredMoods();
    return stored[0] || null;
  },

  async getByDateRange(startDate: number, endDate: number): Promise<MoodEntry[] | any[]> {
    try {
      const entries = await moodCollection
        .query(
          Q.where('created_at', Q.between(startDate, endDate)),
          Q.sortBy('created_at', Q.desc)
        )
        .fetch();
      if (entries.length > 0) return entries;
    } catch {
      // Fallback below
    }

    const stored = await getStoredMoods();
    return stored.filter((e: any) => (e.createdAt || 0) >= startDate && (e.createdAt || 0) <= endDate);
  },

  async getToday(): Promise<MoodEntry | any | null> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    try {
      const entries = await moodCollection
        .query(
          Q.where('created_at', Q.between(today.getTime(), tomorrow.getTime())),
          Q.sortBy('created_at', Q.desc)
        )
        .fetch();
      if (entries.length > 0) return entries[0];
    } catch {
      // Fallback
    }

    const stored = await getStoredMoods();
    return (
      stored.find((e: any) => (e.createdAt || 0) >= today.getTime() && (e.createdAt || 0) < tomorrow.getTime()) ||
      null
    );
  },

  async getAll(): Promise<MoodEntry[] | any[]> {
    try {
      const entries = await moodCollection.query(Q.sortBy('created_at', Q.desc)).fetch();
      if (entries.length > 0) {
        saveStoredMoods(entries.map((e: any) => ({
          id: e.id,
          mood: e.mood,
          intensity: e.intensity,
          stress: e.stress,
          energy: e.energy,
          context: e.context,
          needs: e.needs,
          createdAt: e.createdAt,
          updatedAt: e.updatedAt,
        }))).catch(() => {});
        return entries;
      }
    } catch {
      // Fallback
    }

    const stored = await getStoredMoods();
    return (stored ?? []).sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
  },

  async getMoodDistribution(startDate: number, endDate: number): Promise<Record<string, number>> {
    const entries = await this.getByDateRange(startDate, endDate);
    const distribution: Record<string, number> = {};
    (entries ?? []).forEach((entry: any) => {
      if (entry?.mood) {
        distribution[entry.mood] = (distribution[entry.mood] || 0) + 1;
      }
    });
    return distribution;
  },

  async getAverageIntensity(startDate: number, endDate: number): Promise<number> {
    const entries = await this.getByDateRange(startDate, endDate);
    if (!entries || entries.length === 0) return 0;
    const sum = entries.reduce((acc: number, e: any) => acc + (e?.intensity || 0), 0);
    return sum / entries.length;
  },

  async getAverageStress(startDate: number, endDate: number): Promise<number> {
    const entries = await this.getByDateRange(startDate, endDate);
    if (!entries || entries.length === 0) return 0;
    const sum = entries.reduce((acc: number, e: any) => acc + (e?.stress || 0), 0);
    return sum / entries.length;
  },
};