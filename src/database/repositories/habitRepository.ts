import { database } from '..';
import { Q } from '@nozbe/watermelondb';
import { Habit, HabitCompletion } from '../models';

const habitCollection = database.get<Habit>('habits');
const completionCollection = database.get<HabitCompletion>('habit_completions');

export const habitRepository = {
  async create(data: {
    name: string;
    icon: string;
    color: string;
    frequency: string;
    customDays?: string[];
    reminderTime?: string;
    goal?: number;
    notes?: string;
  }) {
    return database.write(async () => {
      return habitCollection.create((habit) => {
        habit.name = data.name;
        habit.icon = data.icon;
        habit.color = data.color;
        habit.frequency = data.frequency;
        habit.customDays = JSON.stringify(data.customDays || []);
        habit.reminderTime = data.reminderTime || '';
        habit.goal = data.goal || 1;
        habit.notes = data.notes || '';
        habit.archived = false;
        habit.createdAt = Date.now();
        habit.updatedAt = Date.now();
      });
    });
  },

  async getAll(includeArchived = false): Promise<Habit[]> {
    if (includeArchived) {
      return habitCollection.query(Q.sortBy('created_at', Q.desc)).fetch();
    }
    return habitCollection
      .query(Q.where('archived', false), Q.sortBy('created_at', Q.desc))
      .fetch();
  },

  async getById(id: string): Promise<Habit | null> {
    try {
      return await habitCollection.find(id);
    } catch {
      return null;
    }
  },

  async update(id: string, data: Partial<Habit>) {
    return database.write(async () => {
      const habit = await habitCollection.find(id);
      await habit.update((h) => {
        if (data.name !== undefined) h.name = data.name;
        if (data.icon !== undefined) h.icon = data.icon;
        if (data.color !== undefined) h.color = data.color;
        if (data.frequency !== undefined) h.frequency = data.frequency;
        if (data.customDays !== undefined) h.customDays = JSON.stringify(data.customDays);
        if (data.reminderTime !== undefined) h.reminderTime = data.reminderTime;
        if (data.goal !== undefined) h.goal = data.goal;
        if (data.notes !== undefined) h.notes = data.notes;
        if (data.archived !== undefined) h.archived = data.archived;
        h.updatedAt = Date.now();
      });
    });
  },

  async delete(id: string) {
    return database.write(async () => {
      const habit = await habitCollection.find(id);
      await habit.destroyPermanently();
    });
  },

  async archive(id: string) {
    return this.update(id, { archived: true });
  },

  async complete(habitId: string, date: string = new Date().toISOString().split('T')[0]) {
    return database.write(async () => {
      const existing = await completionCollection
        .query(
          Q.where('habit_id', habitId),
          Q.where('date', date)
        )
        .fetch();

      if (existing.length > 0) {
        await existing[0].update((c) => {
          c.completed = true;
        });
      } else {
        await completionCollection.create((c) => {
          c.habitId = habitId;
          c.date = date;
          c.completed = true;
          c.createdAt = Date.now();
        });
      }
    });
  },

  async uncomplete(habitId: string, date: string = new Date().toISOString().split('T')[0]) {
    return database.write(async () => {
      const existing = await completionCollection
        .query(
          Q.where('habit_id', habitId),
          Q.where('date', date)
        )
        .fetch();

      if (existing.length > 0) {
        await existing[0].update((c) => {
          c.completed = false;
        });
      }
    });
  },

  async isCompleted(habitId: string, date: string): Promise<boolean> {
    const existing = await completionCollection
      .query(
        Q.where('habit_id', habitId),
        Q.where('date', date)
      )
      .fetch();
    return existing[0]?.completed || false;
  },

  async getCompletions(habitId: string, startDate: string, endDate: string): Promise<HabitCompletion[]> {
    return completionCollection
      .query(
        Q.where('habit_id', habitId),
        Q.where('date', Q.gte(startDate)),
        Q.where('date', Q.lte(endDate))
      )
      .fetch();
  },

  async getTodayCompletions(): Promise<Record<string, boolean>> {
    const today = new Date().toISOString().split('T')[0];
    const completions = await completionCollection
      .query(Q.where('date', today), Q.where('completed', true))
      .fetch();
    const result: Record<string, boolean> = {};
    completions.forEach((c) => {
      result[c.habitId] = true;
    });
    return result;
  },

  async getStreak(habitId: string): Promise<{ current: number; longest: number }> {
    const completions = await completionCollection
      .query(Q.where('habit_id', habitId), Q.where('completed', true), Q.sortBy('date', Q.desc))
      .fetch();

    if (completions.length === 0) return { current: 0, longest: 0 };

    const dates = completions.map((c) => c.date).sort((a, b) => b.localeCompare(a));
    let current = 0;
    let longest = 0;
    let temp = 0;
    let lastDate: string | null = null;

    dates.forEach((date) => {
      if (!lastDate) {
        temp = 1;
        lastDate = date;
        return;
      }

      const diff = new Date(lastDate).getTime() - new Date(date).getTime();
      const dayDiff = Math.floor(diff / (1000 * 60 * 60 * 24));

      if (dayDiff === 1) {
        temp++;
      } else {
        longest = Math.max(longest, temp);
        temp = 1;
      }
      lastDate = date;
    });

    longest = Math.max(longest, temp);
    current = temp;

    // Check if today or yesterday is completed for current streak
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (!dates.includes(today) && !dates.includes(yesterday)) {
      current = 0;
    }

    return { current, longest };
  },
};