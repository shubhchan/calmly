import { database } from '..';
import { Q } from '@nozbe/watermelondb';
import { Reflection, MoodEntry, JournalEntry, Habit, HabitCompletion, CalmSession, BreathingSession } from '../models';

const reflectionCollection = database.get<Reflection>('reflections');
const moodCollection = database.get<MoodEntry>('mood_entries');
const journalCollection = database.get<JournalEntry>('journal_entries');
const habitCollection = database.get<Habit>('habits');
const completionCollection = database.get<HabitCompletion>('habit_completions');
const calmCollection = database.get<CalmSession>('calm_sessions');
const breathingCollection = database.get<BreathingSession>('breathing_sessions');

export type ReflectionType = 'weekly' | 'monthly';

export interface ReflectionData {
  type: ReflectionType;
  periodStart: number;
  periodEnd: number;
  avgMood: number;
  avgStress: number;
  journalCount: number;
  breathingMinutes: number;
  calmSessions: number;
  topMoods: string[];
  habitCompletionRate: number;
  prompt1: string;
  response1?: string;
  prompt2: string;
  response2?: string;
  prompt3: string;
  response3?: string;
}

export const reflectionRepository = {
  async create(data: ReflectionData) {
    return database.write(async () => {
      return reflectionCollection.create((r) => {
        r.type = data.type;
        r.periodStart = data.periodStart;
        r.periodEnd = data.periodEnd;
        r.avgMood = data.avgMood;
        r.avgStress = data.avgStress;
        r.journalCount = data.journalCount;
        r.breathingMinutes = data.breathingMinutes;
        r.calmSessions = data.calmSessions;
        r.topMoods = JSON.stringify(data.topMoods);
        r.habitCompletionRate = data.habitCompletionRate;
        r.prompt1 = data.prompt1;
        r.response1 = data.response1 || '';
        r.prompt2 = data.prompt2;
        r.response3 = data.prompt3 || '';
        r.response3 = data.response3 || '';
        r.createdAt = Date.now();
        r.updatedAt = Date.now();
      });
    });
  },

  async getAll(): Promise<Reflection[]> {
    return reflectionCollection.query(Q.sortBy('created_at', Q.desc)).fetch();
  },

  async getByType(type: ReflectionType): Promise<Reflection[]> {
    return reflectionCollection
      .query(Q.where('type', type), Q.sortBy('created_at', Q.desc))
      .fetch();
  },

  async getLatest(type: ReflectionType): Promise<Reflection | null> {
    const entries = await reflectionCollection
      .query(Q.where('type', type), Q.sortBy('created_at', Q.desc), Q.take(1))
      .fetch();
    return entries[0] || null;
  },

  async update(id: string, data: Partial<Reflection>) {
    return database.write(async () => {
      const reflection = await reflectionCollection.find(id);
      await reflection.update((r) => {
        if (data.response1 !== undefined) r.response1 = data.response1;
        if (data.response2 !== undefined) r.response2 = data.response2;
        if (data.response3 !== undefined) r.response3 = data.response3;
        r.updatedAt = Date.now();
      });
    });
  },

  async generateWeeklyReflection(): Promise<ReflectionData> {
    const now = Date.now();
    const weekStart = now - 7 * 86400000;
    const weekEnd = now;

    const [moodEntries, journalEntries, breathingSessions, calmSessions, habits, completions] = await Promise.all([
      moodCollection.query(Q.where('created_at', Q.between(weekStart, weekEnd))).fetch(),
      journalCollection.query(Q.where('created_at', Q.between(weekStart, weekEnd))).fetch(),
      breathingCollection.query(Q.where('created_at', Q.between(weekStart, weekEnd))).fetch(),
      calmCollection.query(Q.where('created_at', Q.between(weekStart, weekEnd))).fetch(),
      habitCollection.query(Q.where('archived', false)).fetch(),
      completionCollection.query(Q.where('created_at', Q.between(weekStart, weekEnd)), Q.where('completed', true)).fetch(),
    ]);

    const avgMood = moodEntries.length > 0
      ? moodEntries.reduce((sum, e) => sum + e.intensity, 0) / moodEntries.length
      : 0;
    const avgStress = moodEntries.length > 0
      ? moodEntries.reduce((sum, e) => sum + e.stress, 0) / moodEntries.length
      : 0;

    const moodCounts: Record<string, number> = {};
    moodEntries.forEach(e => {
      moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
    });
    const topMoods = Object.entries(moodCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([mood]) => mood);

    const totalHabitInstances = habits.length * 7;
    const habitCompletionRate = totalHabitInstances > 0
      ? (completions.length / totalHabitInstances) * 100
      : 0;

    return {
      type: 'weekly',
      periodStart: weekStart,
      periodEnd: weekEnd,
      avgMood: Math.round(avgMood * 10) / 10,
      avgStress: Math.round(avgStress * 10) / 10,
      journalCount: journalEntries.length,
      breathingMinutes: breathingSessions.reduce((sum, s) => sum + s.duration, 0),
      calmSessions: calmSessions.filter(s => s.completed).length,
      topMoods,
      habitCompletionRate: Math.round(habitCompletionRate),
      prompt1: 'What was the highlight of your week?',
      prompt2: 'What challenged you this week, and how did you handle it?',
      prompt3: 'What is one thing you want to focus on next week?',
    };
  },

  async generateMonthlyReflection(): Promise<ReflectionData> {
    const now = Date.now();
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthEnd = now;

    const [moodEntries, journalEntries, breathingSessions, calmSessions, habits, completions] = await Promise.all([
      moodCollection.query(Q.where('created_at', Q.between(monthStart.getTime(), monthEnd))).fetch(),
      journalCollection.query(Q.where('created_at', Q.between(monthStart.getTime(), monthEnd))).fetch(),
      breathingCollection.query(Q.where('created_at', Q.between(monthStart.getTime(), monthEnd))).fetch(),
      calmCollection.query(Q.where('created_at', Q.between(monthStart.getTime(), monthEnd))).fetch(),
      habitCollection.query(Q.where('archived', false)).fetch(),
      completionCollection.query(Q.where('created_at', Q.between(monthStart.getTime(), monthEnd)), Q.where('completed', true)).fetch(),
    ]);

    const avgMood = moodEntries.length > 0
      ? moodEntries.reduce((sum, e) => sum + e.intensity, 0) / moodEntries.length
      : 0;
    const avgStress = moodEntries.length > 0
      ? moodEntries.reduce((sum, e) => sum + e.stress, 0) / moodEntries.length
      : 0;

    const moodCounts: Record<string, number> = {};
    moodEntries.forEach(e => {
      moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
    });
    const topMoods = Object.entries(moodCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([mood]) => mood);

    const daysInMonth = new Date().getDate();
    const totalHabitInstances = habits.length * daysInMonth;
    const habitCompletionRate = totalHabitInstances > 0
      ? (completions.length / totalHabitInstances) * 100
      : 0;

    return {
      type: 'monthly',
      periodStart: monthStart.getTime(),
      periodEnd: monthEnd,
      avgMood: Math.round(avgMood * 10) / 10,
      avgStress: Math.round(avgStress * 10) / 10,
      journalCount: journalEntries.length,
      breathingMinutes: breathingSessions.reduce((sum, s) => sum + s.duration, 0),
      calmSessions: calmSessions.filter(s => s.completed).length,
      topMoods,
      habitCompletionRate: Math.round(habitCompletionRate),
      prompt1: 'What was the most meaningful moment this month?',
      prompt2: 'What patterns did you notice in your mood and energy?',
      prompt3: 'What intention do you want to set for next month?',
    };
  },
};