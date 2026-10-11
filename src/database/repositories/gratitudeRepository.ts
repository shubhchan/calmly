import { database } from '..';
import { Q } from '@nozbe/watermelondb';
import { GratitudeEntry } from '../models';

const gratitudeCollection = database.get<GratitudeEntry>('gratitude_entries');

export const gratitudeRepository = {
  async create(data: {
    text: string;
    mood?: string;
    tags?: string[];
    imageUri?: string;
    favorite?: boolean;
  }) {
    return database.write(async () => {
      return gratitudeCollection.create((entry) => {
        entry.text = data.text;
        entry.mood = data.mood || '';
        entry.tags = JSON.stringify(data.tags || []);
        entry.imageUri = data.imageUri || '';
        entry.favorite = data.favorite || false;
        entry.createdAt = Date.now();
        entry.updatedAt = Date.now();
      });
    });
  },

  async getAll(): Promise<GratitudeEntry[]> {
    return gratitudeCollection.query(Q.sortBy('created_at', Q.desc)).fetch();
  },

  async getFavorites(): Promise<GratitudeEntry[]> {
    return gratitudeCollection
      .query(Q.where('favorite', true), Q.sortBy('created_at', Q.desc))
      .fetch();
  },

  async getRandomFavorite(): Promise<GratitudeEntry | null> {
    const favorites = await this.getFavorites();
    if (favorites.length === 0) return null;
    return favorites[Math.floor(Math.random() * favorites.length)];
  },

  async update(id: string, data: Partial<GratitudeEntry>) {
    return database.write(async () => {
      const entry = await gratitudeCollection.find(id);
      await entry.update((e) => {
        if (data.text !== undefined) e.text = data.text;
        if (data.mood !== undefined) e.mood = data.mood;
        if (data.tags !== undefined) {
          e.tags = typeof data.tags === 'string' ? data.tags : JSON.stringify(data.tags);
        }
        if (data.imageUri !== undefined) e.imageUri = data.imageUri;
        if (data.favorite !== undefined) e.favorite = data.favorite;
        e.updatedAt = Date.now();
      });
    });
  },

  async delete(id: string) {
    return database.write(async () => {
      const entry = await gratitudeCollection.find(id);
      await entry.destroyPermanently();
    });
  },
};