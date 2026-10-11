import { database } from '..';
import { Q } from '@nozbe/watermelondb';
import { JournalEntry } from '../models';

const journalCollection = database.get<JournalEntry>('journal_entries');

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
    return database.write(async () => {
      return journalCollection.create((entry) => {
        entry.type = data.type;
        entry.title = data.title || '';
        entry.body = data.body;
        entry.mood = data.mood || '';
        entry.tags = JSON.stringify(data.tags || []);
        entry.favorite = data.favorite || false;
        entry.imageUri = data.imageUri || '';
        entry.audioUri = data.audioUri || '';
        entry.createdAt = Date.now();
        entry.updatedAt = Date.now();
      });
    });
  },

  async getById(id: string): Promise<JournalEntry | null> {
    try {
      return await journalCollection.find(id);
    } catch {
      return null;
    }
  },

  async getAll(): Promise<JournalEntry[]> {
    return journalCollection.query(Q.sortBy('created_at', Q.desc)).fetch();
  },

  async getByType(type: string): Promise<JournalEntry[]> {
    return journalCollection
      .query(Q.where('type', type), Q.sortBy('created_at', Q.desc))
      .fetch();
  },

  async getFavorites(): Promise<JournalEntry[]> {
    return journalCollection
      .query(Q.where('favorite', true), Q.sortBy('created_at', Q.desc))
      .fetch();
  },

  async search(query: string): Promise<JournalEntry[]> {
    const lowerQuery = query.toLowerCase();
    const all = await this.getAll();
    return all.filter(
      (entry) =>
        entry.title.toLowerCase().includes(lowerQuery) ||
        entry.body.toLowerCase().includes(lowerQuery) ||
        entry.tags.toLowerCase().includes(lowerQuery)
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
    return database.write(async () => {
      const entry = await journalCollection.find(id);
      await entry.update((e) => {
        if (data.title !== undefined) e.title = data.title;
        if (data.body !== undefined) e.body = data.body;
        if (data.mood !== undefined) e.mood = data.mood;
        if (data.tags !== undefined) e.tags = JSON.stringify(data.tags);
        if (data.favorite !== undefined) e.favorite = data.favorite;
        if (data.imageUri !== undefined) e.imageUri = data.imageUri;
        if (data.audioUri !== undefined) e.audioUri = data.audioUri;
        e.updatedAt = Date.now();
      });
    });
  },

  async delete(id: string) {
    return database.write(async () => {
      const entry = await journalCollection.find(id);
      await entry.destroyPermanently();
    });
  },

  async getByDateRange(startDate: number, endDate: number): Promise<JournalEntry[]> {
    return journalCollection
      .query(
        Q.where('created_at', Q.between(startDate, endDate)),
        Q.sortBy('created_at', Q.desc)
      )
      .fetch();
  },

  async toggleFavorite(id: string) {
    return database.write(async () => {
      const entry = await journalCollection.find(id);
      await entry.update((e) => {
        e.favorite = !e.favorite;
        e.updatedAt = Date.now();
      });
    });
  },

  async getCount(): Promise<number> {
    return journalCollection.query().fetchCount();
  },
};