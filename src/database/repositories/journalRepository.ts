import { database } from '..';
import { Q } from '@nozbe/watermelondb';
import { JournalEntry } from '../models';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NoteAttachment } from '../../types/attachment';
import { parseAttachments } from '../../utils/attachmentStorage';

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
    attachments?: NoteAttachment[];
  }) {
    const now = Date.now();
    let watermelonRecord: any = null;

    const resolvedImageUri =
      data.attachments !== undefined
        ? (data.attachments.length > 0 ? JSON.stringify(data.attachments) : '')
        : (data.imageUri || '');
    const resolvedAudioUri =
      data.attachments !== undefined
        ? (data.attachments.find((a) => a.type === 'audio')?.uri || '')
        : (data.audioUri || '');

    try {
      watermelonRecord = await database.write(async () => {
        return journalCollection.create((entry) => {
          entry.type = data.type;
          entry.title = data.title || '';
          entry.body = data.body;
          entry.mood = data.mood || '';
          entry.tags = JSON.stringify(data.tags || []);
          entry.favorite = data.favorite || false;
          entry.imageUri = resolvedImageUri;
          entry.audioUri = resolvedAudioUri;
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
      imageUri: resolvedImageUri,
      audioUri: resolvedAudioUri,
      createdAt: now,
      updatedAt: now,
      attachments: data.attachments || parseAttachments({ imageUri: resolvedImageUri, audioUri: resolvedAudioUri, createdAt: now }),
    };

    const existing = await getStoredEntries();
    const updated = [fallbackItem, ...(existing ?? []).filter((e: any) => e?.id !== fallbackItem.id)];
    await saveStoredEntries(updated);

    return watermelonRecord
      ? {
        ...watermelonRecord,
        id: watermelonRecord.id,
        type: watermelonRecord.type,
        title: watermelonRecord.title,
        body: watermelonRecord.body,
        mood: watermelonRecord.mood,
        tags: watermelonRecord.tags,
        favorite: watermelonRecord.favorite,
        imageUri: watermelonRecord.imageUri,
        audioUri: watermelonRecord.audioUri,
        createdAt: watermelonRecord.createdAt,
        updatedAt: watermelonRecord.updatedAt,
        attachments: parseAttachments(watermelonRecord),
      }
      : fallbackItem;
  },

  async getById(id: string): Promise<JournalEntry | any | null> {
    try {
      const entry = await journalCollection.find(id);
      if (entry) {
        return {
          ...entry,
          id: entry.id,
          type: entry.type,
          title: entry.title,
          body: entry.body,
          mood: entry.mood,
          tags: entry.tags,
          favorite: entry.favorite,
          imageUri: entry.imageUri,
          audioUri: entry.audioUri,
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt,
          attachments: parseAttachments(entry),
        };
      }
    } catch {
      // Fallback below
    }

    const stored = await getStoredEntries();
    const found = stored.find((e: any) => e?.id === id) || null;
    if (found) {
      return {
        ...found,
        attachments: parseAttachments(found),
      };
    }
    return null;
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
            attachments: parseAttachments(wm),
          });
        }
      });
      const mergedList = Array.from(mergedMap.values())
        .map((item) => ({ ...item, attachments: parseAttachments(item) }))
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      saveStoredEntries(mergedList).catch(() => { });
      return mergedList;
    }

    return (stored ?? [])
      .map((item: any) => ({ ...item, attachments: parseAttachments(item) }))
      .sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
  },

  async clearFallback(): Promise<void> { await saveStoredEntries([]); },

  /** Merge a user-owned backup into the persistent fallback, preserving IDs. */
  async importEntries(entries: any[]): Promise<number> {
    const existing = await this.getAll();
    const ids = new Set(existing.map((e: any) => String(e.id)));
    const safe = entries.filter((e: any) => typeof e?.id === 'string' && typeof e?.body === 'string' && Number.isFinite(e?.createdAt) && !ids.has(e.id));
    await saveStoredEntries([...safe, ...existing].sort((a, b) => b.createdAt - a.createdAt));
    return safe.length;
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
      type: string;
      title: string;
      body: string;
      mood: string;
      tags: string[];
      favorite: boolean;
      imageUri: string;
      audioUri: string;
      attachments: NoteAttachment[];
    }>
  ) {
    const now = Date.now();

    const resolvedImageUri =
      data.attachments !== undefined
        ? (data.attachments.length > 0 ? JSON.stringify(data.attachments) : '')
        : data.imageUri;
    const resolvedAudioUri =
      data.attachments !== undefined
        ? (data.attachments.find((a) => a.type === 'audio')?.uri || '')
        : data.audioUri;

    try {
      await database.write(async () => {
        const entry = await journalCollection.find(id);
        await entry.update((e) => {
          if (data.type !== undefined) e.type = data.type;
          if (data.title !== undefined) e.title = data.title;
          if (data.body !== undefined) e.body = data.body;
          if (data.mood !== undefined) e.mood = data.mood;
          if (data.tags !== undefined) e.tags = JSON.stringify(data.tags);
          if (data.favorite !== undefined) e.favorite = data.favorite;
          if (resolvedImageUri !== undefined) e.imageUri = resolvedImageUri;
          if (resolvedAudioUri !== undefined) e.audioUri = resolvedAudioUri;
          e.updatedAt = now;
        });
      });
    } catch (e) {
      console.warn('WatermelonDB update failed, using persistent storage:', e);
    }

    const stored = await getStoredEntries();
    const updated = stored.map((item: any) => {
      if (item.id === id) {
        const updatedItem = {
          ...item,
          ...data,
          imageUri: resolvedImageUri !== undefined ? resolvedImageUri : item.imageUri,
          audioUri: resolvedAudioUri !== undefined ? resolvedAudioUri : item.audioUri,
          tags: data.tags !== undefined ? JSON.stringify(data.tags) : item.tags,
          updatedAt: now,
        };
        return {
          ...updatedItem,
          attachments: parseAttachments(updatedItem),
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