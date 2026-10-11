import { database } from '..';
import { Q } from '@nozbe/watermelondb';
import { JournalEntry } from '../models';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@calmly_journal_entries';
const journalCollection = database.get<JournalEntry>('journal_entries');

// In-memory fallback cache
let memoryCache: any[] = [];

async function getStoredEntries(): Promise<any[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        memoryCache = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to read journal entries from AsyncStorage:', err);
  }
  return memoryCache;
}

async function saveStoredEntries(entries: any[]): Promise<void> {
  memoryCache = entries;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (err) {
    console.warn('Failed to save journal entries to AsyncStorage:', err);
  }
}

export const journalRepository = {
  async create(data: {
    type: string;
    title?: string;
    body: string;
    mood?: string;
    tags?: string[];
    favorite?: boolean;
    imageUri?: string;
    audioUri?: string;
  }) {
    const now = Date.now();
    let watermelonRecord: any = null;

    try {
      watermelonRecord = await database.write(async () => {
        return journalCollection.create((entry) => {
          entry.type = data.type;
          entry.title = data.title || '';
          entry.body = data.body;
          entry.mood = data.mood || '';
          entry.tags = JSON.stringify(data.tags || []);
          entry.favorite = data.favorite || false;
          entry.imageUri = data.imageUri || '';
          entry.audioUri = data.audioUri || '';
          entry.createdAt = now;
          entry.updatedAt = now;
        });
      });
    } catch (e) {
      console.warn('WatermelonDB write failed, falling back to persistent storage:', e);
    }

    const fallbackItem = {
      id: watermelonRecord?.id || `jn_${now}_${Math.random().toString(36).slice(2, 8)}`,
      type: data.type,
      title: data.title || '',
      body: data.body,
      mood: data.mood || '',
      tags: JSON.stringify(data.tags || []),
      favorite: data.favorite || false,
      imageUri: data.imageUri || '',
      audioUri: data.audioUri || '',
      createdAt: now,
      updatedAt: now,
    };

    const existing = await getStoredEntries();
    const updated = [fallbackItem, ...(existing ?? []).filter((e: any) => e?.id !== fallbackItem.id)];
    await saveStoredEntries(updated);

    return watermelonRecord || fallbackItem;
  },

  async getById(id: string): Promise<JournalEntry | any | null> {
    try {
      const entry = await journalCollection.find(id);
      if (entry) return entry;
    } catch {
      // Fallback below
    }

    const stored = await getStoredEntries();
    return stored.find((e: any) => e?.id === id) || null;
  },

  async getAll(): Promise<JournalEntry[] | any[]> {
    let wmEntries: any[] = [];
    try {
      wmEntries = await journalCollection.query(Q.sortBy('created_at', Q.desc)).fetch();
    } catch (e) {
      console.warn('WatermelonDB getAll failed:', e);
      wmEntries = [];
    }

    const stored = await getStoredEntries();

    if (wmEntries.length > 0) {
      // Sync into storage for safety
      const mergedMap = new Map<string, any>();
      stored.forEach((item) => item?.id && mergedMap.set(item.id, item));
      wmEntries.forEach((wm) => {
        if (wm?.id) {
          mergedMap.set(wm.id, {
            id: wm.id,
            type: wm.type,
            title: wm.title,
            body: wm.body,
            mood: wm.mood,
            tags: wm.tags,
            favorite: wm.favorite,
            imageUri: wm.imageUri,
            audioUri: wm.audioUri,
            createdAt: wm.createdAt,
            updatedAt: wm.updatedAt,
          });
        }
      });
      const mergedList = Array.from(mergedMap.values()).sort(
        (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
      );
      saveStoredEntries(mergedList).catch(() => {});
      return wmEntries;
    }

    return (stored ?? []).sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
  },

  async getByType(type: string): Promise<JournalEntry[] | any[]> {
    try {
      const res = await journalCollection
        .query(Q.where('type', type), Q.sortBy('created_at', Q.desc))
        .fetch();
      if (res.length > 0) return res;
    } catch {
      // Fallback below
    }

    const all = await this.getAll();
    return all.filter((e: any) => e?.type === type);
  },

  async getFavorites(): Promise<JournalEntry[] | any[]> {
    try {
      const res = await journalCollection
        .query(Q.where('favorite', true), Q.sortBy('created_at', Q.desc))
        .fetch();
      if (res.length > 0) return res;
    } catch {
      // Fallback below
    }

    const all = await this.getAll();
    return all.filter((e: any) => !!e?.favorite);
  },

  async search(query: string): Promise<JournalEntry[] | any[]> {
    const lowerQuery = (query || '').toLowerCase();
    const all = await this.getAll();
    return all.filter(
      (entry: any) =>
        (entry?.title || '').toLowerCase().includes(lowerQuery) ||
        (entry?.body || '').toLowerCase().includes(lowerQuery) ||
        (entry?.tags || '').toLowerCase().includes(lowerQuery)
    );
  },

  async update(
    id: string,
    data: Partial<{
      title: string;
      body: string;
      mood: string;
      tags: string[];
      favorite: boolean;
      imageUri: string;
      audioUri: string;
    }>
  ) {
    const now = Date.now();
    try {
      await database.write(async () => {
        const entry = await journalCollection.find(id);
        await entry.update((e) => {
          if (data.title !== undefined) e.title = data.title;
          if (data.body !== undefined) e.body = data.body;
          if (data.mood !== undefined) e.mood = data.mood;
          if (data.tags !== undefined) e.tags = JSON.stringify(data.tags);
          if (data.favorite !== undefined) e.favorite = data.favorite;
          if (data.imageUri !== undefined) e.imageUri = data.imageUri;
          if (data.audioUri !== undefined) e.audioUri = data.audioUri;
          e.updatedAt = now;
        });
      });
    } catch (e) {
      console.warn('WatermelonDB update failed, using persistent storage:', e);
    }

    const stored = await getStoredEntries();
    const updated = stored.map((item: any) => {
      if (item.id === id) {
        return {
          ...item,
          ...data,
          tags: data.tags !== undefined ? JSON.stringify(data.tags) : item.tags,
          updatedAt: now,
        };
      }
      return item;
    });
    await saveStoredEntries(updated);
  },

  async delete(id: string) {
    try {
      await database.write(async () => {
        const entry = await journalCollection.find(id);
        await entry.destroyPermanently();
      });
    } catch (e) {
      console.warn('WatermelonDB delete failed, using persistent storage:', e);
    }

    const stored = await getStoredEntries();
    const updated = stored.filter((item: any) => item.id !== id);
    await saveStoredEntries(updated);
  },

  async getByDateRange(startDate: number, endDate: number): Promise<JournalEntry[] | any[]> {
    try {
      const res = await journalCollection
        .query(
          Q.where('created_at', Q.between(startDate, endDate)),
          Q.sortBy('created_at', Q.desc)
        )
        .fetch();
      if (res.length > 0) return res;
    } catch {
      // Fallback
    }

    const all = await this.getAll();
    return all.filter((e: any) => (e.createdAt || 0) >= startDate && (e.createdAt || 0) <= endDate);
  },

  async toggleFavorite(id: string) {
    const stored = await getStoredEntries();
    const existing = stored.find((e: any) => e.id === id);
    const newFav = existing ? !existing.favorite : true;

    try {
      await database.write(async () => {
        const entry = await journalCollection.find(id);
        await entry.update((e) => {
          e.favorite = !e.favorite;
          e.updatedAt = Date.now();
        });
      });
    } catch {
      // Fallback below
    }

    const updated = stored.map((item: any) => {
      if (item.id === id) {
        return { ...item, favorite: newFav, updatedAt: Date.now() };
      }
      return item;
    });
    await saveStoredEntries(updated);
  },

  async getCount(): Promise<number> {
    const all = await this.getAll();
    return all.length;
  },
};