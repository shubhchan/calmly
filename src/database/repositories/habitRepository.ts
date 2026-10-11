import { database } from '..';
import { Q } from '@nozbe/watermelondb';
import { Habit, HabitCompletion } from '../models';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY_HABITS = '@calmly_habits';
const STORAGE_KEY_COMPLETIONS = '@calmly_habit_completions';
const habitCollection = database.get<Habit>('habits');
const completionCollection = database.get<HabitCompletion>('habit_completions');

let habitMemoryCache: any[] = [];
let completionMemoryCache: any[] = [];

async function getStoredHabits(): Promise<any[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_HABITS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        habitMemoryCache = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to read habits from AsyncStorage:', err);
  }
  return habitMemoryCache;
}

async function saveStoredHabits(habits: any[]): Promise<void> {
  habitMemoryCache = habits;
  try {
    await AsyncStorage.setItem(STORAGE_KEY_HABITS, JSON.stringify(habits));
  } catch (err) {
    console.warn('Failed to save habits to AsyncStorage:', err);
  }
}

async function getStoredCompletions(): Promise<any[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_COMPLETIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        completionMemoryCache = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to read habit completions from AsyncStorage:', err);
  }
  return completionMemoryCache;
}

async function saveStoredCompletions(completions: any[]): Promise<void> {
  completionMemoryCache = completions;
  try {
    await AsyncStorage.setItem(STORAGE_KEY_COMPLETIONS, JSON.stringify(completions));
  } catch (err) {
    console.warn('Failed to save habit completions to AsyncStorage:', err);
  }
}

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
    const now = Date.now();
    let watermelonRecord: any = null;

    try {
      watermelonRecord = await database.write(async () => {
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
          habit.createdAt = now;
          habit.updatedAt = now;
        });
      });
    } catch (err) {
      console.warn('WatermelonDB habit create error, using AsyncStorage fallback:', err);
    }

    const fallbackHabit = {
      id: watermelonRecord?.id || `habit_${now}_${Math.random().toString(36).substr(2, 6)}`,
      name: data.name,
      icon: data.icon,
      color: data.color,
      frequency: data.frequency,
      customDays: JSON.stringify(data.customDays || []),
      reminderTime: data.reminderTime || '',
      goal: data.goal || 1,
      notes: data.notes || '',
      archived: false,
      createdAt: now,
      updatedAt: now,
    };

    const currentHabits = await getStoredHabits();
    await saveStoredHabits([fallbackHabit, ...currentHabits]);

    return watermelonRecord || fallbackHabit;
  },

  async getAll(includeArchived = false): Promise<Habit[]> {
    let wmHabits: any[] = [];
    try {
      if (includeArchived) {
        wmHabits = await habitCollection.query(Q.sortBy('created_at', Q.desc)).fetch();
      } else {
        wmHabits = await habitCollection
          .query(Q.where('archived', false), Q.sortBy('created_at', Q.desc))
          .fetch();
      }
    } catch {
      wmHabits = [];
    }

    if (wmHabits.length > 0) {
      return wmHabits as Habit[];
    }

    const stored = await getStoredHabits();
    const filtered = includeArchived ? stored : stored.filter((h) => !h.archived);
    return filtered as unknown as Habit[];
  },

  async getById(id: string): Promise<Habit | null> {
    try {
      return await habitCollection.find(id);
    } catch {
      const stored = await getStoredHabits();
      const found = stored.find((h) => h.id === id);
      return (found as unknown as Habit) || null;
    }
  },

  async update(id: string, data: Partial<Habit>) {
    try {
      await database.write(async () => {
        const habit = await habitCollection.find(id);
        await habit.update((h) => {
          if (data.name !== undefined) h.name = data.name;
          if (data.icon !== undefined) h.icon = data.icon;
          if (data.color !== undefined) h.color = data.color;
          if (data.frequency !== undefined) h.frequency = data.frequency;
          if (data.customDays !== undefined) h.customDays = typeof data.customDays === 'string' ? data.customDays : JSON.stringify(data.customDays);
          if (data.reminderTime !== undefined) h.reminderTime = data.reminderTime;
          if (data.goal !== undefined) h.goal = data.goal;
          if (data.notes !== undefined) h.notes = data.notes;
          if (data.archived !== undefined) h.archived = data.archived;
          h.updatedAt = Date.now();
        });
      });
    } catch (err) {
      console.warn('WatermelonDB habit update fallback:', err);
    }

    const stored = await getStoredHabits();
    const updated = stored.map((h) => {
      if (h.id === id) {
        return {
          ...h,
          ...data,
          updatedAt: Date.now(),
        };
      }
      return h;
    });
    await saveStoredHabits(updated);
  },

  async delete(id: string) {
    try {
      await database.write(async () => {
        const habit = await habitCollection.find(id);
        await habit.destroyPermanently();
      });
    } catch (err) {
      console.warn('WatermelonDB habit delete fallback:', err);
    }

    const stored = await getStoredHabits();
    await saveStoredHabits(stored.filter((h) => h.id !== id));
  },

  async archive(id: string) {
    return this.update(id, { archived: true });
  },

  async complete(habitId: string, date: string = new Date().toISOString().split('T')[0]) {
    try {
      await database.write(async () => {
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
    } catch (err) {
      console.warn('WatermelonDB habit complete fallback:', err);
    }

    const completions = await getStoredCompletions();
    const existingIndex = completions.findIndex((c) => c.habitId === habitId && c.date === date);
    if (existingIndex >= 0) {
      completions[existingIndex].completed = true;
    } else {
      completions.push({
        id: `comp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        habitId,
        date,
        completed: true,
        createdAt: Date.now(),
      });
    }
    await saveStoredCompletions([...completions]);
  },

  async uncomplete(habitId: string, date: string = new Date().toISOString().split('T')[0]) {
    try {
      await database.write(async () => {
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
    } catch (err) {
      console.warn('WatermelonDB habit uncomplete fallback:', err);
    }

    const completions = await getStoredCompletions();
    const existingIndex = completions.findIndex((c) => c.habitId === habitId && c.date === date);
    if (existingIndex >= 0) {
      completions[existingIndex].completed = false;
      await saveStoredCompletions([...completions]);
    }
  },

  async isCompleted(habitId: string, date: string): Promise<boolean> {
    try {
      const existing = await completionCollection
        .query(
          Q.where('habit_id', habitId),
          Q.where('date', date)
        )
        .fetch();
      if (existing.length > 0) {
        return existing[0]?.completed || false;
      }
    } catch {}

    const stored = await getStoredCompletions();
    const match = stored.find((c) => c.habitId === habitId && c.date === date);
    return match?.completed || false;
  },

  async getCompletions(habitId: string, startDate: string, endDate: string): Promise<HabitCompletion[]> {
    try {
      const results = await completionCollection
        .query(
          Q.where('habit_id', habitId),
          Q.where('date', Q.gte(startDate)),
          Q.where('date', Q.lte(endDate))
        )
        .fetch();
      if (results.length > 0) {
        return results;
      }
    } catch {}

    const stored = await getStoredCompletions();
    const filtered = stored.filter(
      (c) => c.habitId === habitId && c.date >= startDate && c.date <= endDate
    );
    return filtered as unknown as HabitCompletion[];
  },

  async getTodayCompletions(): Promise<Record<string, boolean>> {
    const today = new Date().toISOString().split('T')[0];
    const result: Record<string, boolean> = {};

    try {
      const completions = await completionCollection
        .query(Q.where('date', today), Q.where('completed', true))
        .fetch();
      if (completions.length > 0) {
        completions.forEach((c) => {
          result[c.habitId] = true;
        });
        return result;
      }
    } catch {}

    const stored = await getStoredCompletions();
    stored.forEach((c) => {
      if (c.date === today && c.completed) {
        result[c.habitId] = true;
      }
    });
    return result;
  },

  async getStreak(habitId: string): Promise<{ current: number; longest: number }> {
    let completionsList: any[] = [];
    try {
      const wmComps = await completionCollection
        .query(Q.where('habit_id', habitId), Q.where('completed', true), Q.sortBy('date', Q.desc))
        .fetch();
      if (wmComps.length > 0) {
        completionsList = wmComps;
      }
    } catch {}

    if (completionsList.length === 0) {
      const stored = await getStoredCompletions();
      completionsList = stored.filter((c) => c.habitId === habitId && c.completed);
    }

    if (completionsList.length === 0) return { current: 0, longest: 0 };

    const dates = completionsList.map((c) => c.date).sort((a, b) => b.localeCompare(a));
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