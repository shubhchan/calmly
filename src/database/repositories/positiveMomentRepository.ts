import { database } from '..';
import { Q } from '@nozbe/watermelondb';
import { PositiveMoment } from '../models';

const positiveMomentCollection = database.get<PositiveMoment>('positive_moments');

export const positiveMomentRepository = {
  async create(data: {
    text: string;
    mood?: string;
    tags?: string[];
    favorite?: boolean;
  }) {
    return database.write(async () => {
      return positiveMomentCollection.create((entry) => {
        entry.text = data.text;
        entry.mood = data.mood || '';
        entry.tags = JSON.stringify(data.tags || []);
        entry.favorite = data.favorite || false;
        entry.resurfacedAt = 0;
        entry.createdAt = Date.now();
        entry.updatedAt = Date.now();
      });
    });
  },

  async getAll(): Promise<PositiveMoment[]> {
    return positiveMomentCollection.query(Q.sortBy('created_at', Q.desc)).fetch();
  },

  async getFavorites(): Promise<PositiveMoment[]> {
    return positiveMomentCollection
      .query(Q.where('favorite', true), Q.sortBy('created_at', Q.desc))
      .fetch();
  },

  async getRandomFavorite(minDaysOld = 7): Promise<PositiveMoment | null> {
    const cutoffDate = new Date(Date.now() - minDaysOld * 86400000).toISOString();
    const favorites = await positiveMomentCollection
      .query(
        Q.where('favorite', true),
        Q.where('created_at', Q.lt(Date.now() - minDaysOld * 86400000)),
        Q.sortBy('created_at', Q.desc)
      )
      .fetch();
    if (favorites.length === 0) return null;
    return favorites[Math.floor(Math.random() * favorites.length)];
  },

  async updateResurfaced(id: string) {
    return database.write(async () => {
      const entry = await positiveMomentCollection.find(id);
      await entry.update((e) => {
        e.resurfacedAt = Date.now();
        e.updatedAt = Date.now();
      });
    });
  },

  async update(id: string, data: Partial<PositiveMoment>) {
    return database.write(async () => {
      const entry = await positiveMomentCollection.find(id);
      await entry.update((e) => {
        if (data.text !== undefined) e.text = data.text;
        if (data.mood !== undefined) e.mood = data.mood;
        if (data.tags !== undefined) e.tags = JSON.stringify(data.tags);
        if (data.favorite !== undefined) e.favorite = data.favorite;
        e.updatedAt = Date.now();
      });
    });
  },

  async delete(id: string) {
    return database.write(async () => {
      const entry = await positiveMomentCollection.find(id);
      await entry.destroyPermanently();
    });
  },
};