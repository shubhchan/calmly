import { database } from '..';
import { Q } from '@nozbe/watermelondb';
import { MoodEntry } from '../models';

const moodCollection = database.get<MoodEntry>('mood_entries');

export const moodRepository = {
  async create(data: {
    mood: string;
    intensity: number;
    stress: number;
    energy: string;
    context?: string;
    needs?: string;
  }) {
    return database.write(async () => {
      return moodCollection.create((entry) => {
        entry.mood = data.mood;
        entry.intensity = data.intensity;
        entry.stress = data.stress;
        entry.energy = data.energy;
        entry.context = data.context || '';
        entry.needs = data.needs || '';
        entry.createdAt = Date.now();
        entry.updatedAt = Date.now();
      });
    });
  },

  async getLatest(): Promise<MoodEntry | null> {
    const entries = await moodCollection
      .query(Q.sortBy('created_at', Q.desc), Q.take(1))
      .fetch();
    return entries[0] || null;
  },

  async getByDateRange(startDate: number, endDate: number): Promise<MoodEntry[]> {
    return moodCollection
      .query(
        Q.where('created_at', Q.between(startDate, endDate)),
        Q.sortBy('created_at', Q.desc)
      )
      .fetch();
  },

  async getToday(): Promise<MoodEntry | null> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const entries = await moodCollection
      .query(
        Q.where('created_at', Q.between(today.getTime(), tomorrow.getTime())),
        Q.sortBy('created_at', Q.desc)
      )
      .fetch();
    return entries[0] || null;
  },

  async getAll(): Promise<MoodEntry[]> {
    return moodCollection.query(Q.sortBy('created_at', Q.desc)).fetch();
  },

  async getMoodDistribution(startDate: number, endDate: number): Promise<Record<string, number>> {
    const entries = await this.getByDateRange(startDate, endDate);
    const distribution: Record<string, number> = {};
    entries.forEach((entry) => {
      distribution[entry.mood] = (distribution[entry.mood] || 0) + 1;
    });
    return distribution;
  },

  async getAverageIntensity(startDate: number, endDate: number): Promise<number> {
    const entries = await this.getByDateRange(startDate, endDate);
    if (entries.length === 0) return 0;
    const sum = entries.reduce((acc, e) => acc + e.intensity, 0);
    return sum / entries.length;
  },

  async getAverageStress(startDate: number, endDate: number): Promise<number> {
    const entries = await this.getByDateRange(startDate, endDate);
    if (entries.length === 0) return 0;
    const sum = entries.reduce((acc, e) => acc + e.stress, 0);
    return sum / entries.length;
  },
};