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
    return (await this.getAll())[0] || null;
  },

  async getByDateRange(startDate: number, endDate: number): Promise<MoodEntry[] | any[]> {
    const all = await this.getAll();
    return all.filter((x: any) => (x.createdAt || 0) >= startDate && (x.createdAt || 0) <= endDate);
  },

  async getToday(): Promise<MoodEntry | any | null> {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(start); end.setDate(start.getDate() + 1);
    return (await this.getByDateRange(start.getTime(), end.getTime() - 1))[0] || null;
  },

  async getAll(): Promise<MoodEntry[] | any[]> {
    let wm: any[] = [];
    try { wm = await moodCollection.query(Q.sortBy('created_at', Q.desc)).fetch(); }
    catch (err) { console.warn('Mood database unavailable; reading saved fallback:', err); }
    const stored = await getStoredMoods();
    const merged = new Map<string, any>();
    // Never drop fallback-only entries, e.g. restored from a Drive snapshot.
    [...stored, ...wm].forEach((item: any) => {
      const id = item?.id || `legacy-${item?.createdAt}`;
      if (!item) return;
      merged.set(id, {
        id, mood: item.mood, intensity: item.intensity, stress: item.stress,
        energy: item.energy, context: item.context, needs: item.needs,
        createdAt: item.createdAt, updatedAt: item.updatedAt,
      });
    });
    const items = [...merged.values()].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    await saveStoredMoods(items);
    return items;
  },

  async clearFallback(): Promise<void> { await saveStoredMoods([]); },

  /** Merge an encrypted cloud snapshot without overwriting local records. */
  async importEntries(entries: any[]): Promise<number> {
    const existing = await this.getAll();
    const ids = new Set(existing.map((e: any) => String(e.id)));
    const safe = entries.filter((e: any) => typeof e?.id === 'string' && typeof e?.mood === 'string' && Number.isFinite(e?.createdAt) && !ids.has(e.id));
    await saveStoredMoods([...safe, ...existing].sort((a, b) => b.createdAt - a.createdAt));
    return safe.length;
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