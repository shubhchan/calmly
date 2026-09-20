import { database } from '..';
import { Q } from '@nozbe/watermelondb';
import { MoodEntry, JournalEntry, Habit, HabitCompletion, CalmSession, BreathingSession } from '../models';

const moodCollection = database.get<MoodEntry>('mood_entries');
const journalCollection = database.get<JournalEntry>('journal_entries');
const habitCollection = database.get<Habit>('habits');
const completionCollection = database.get<HabitCompletion>('habit_completions');
const calmCollection = database.get<CalmSession>('calm_sessions');
const breathingCollection = database.get<BreathingSession>('breathing_sessions');

export interface WeeklyStats {
  avgMood: number;
  avgStress: number;
  avgIntensity: number;
  journalCount: number;
  breathingMinutes: number;
  calmSessions: number;
  habitCompletionRate: number;
}

export interface HabitStats {
  id: string;
  name: string;
  color: string;
  icon: string;
  completedThisWeek: number;
  totalThisWeek: number;
  currentStreak: number;
  longestStreak: number;
}

export interface Insight {
  id: string;
  text: string;
  type: 'positive' | 'neutral' | 'action';
}

export const insightsRepository = {
  async getWeeklyStats(): Promise<WeeklyStats> {
    const now = Date.now();
    const weekAgo = now - 7 * 86400000;

    const [
      moodEntries,
      journalEntries,
      breathingSessions,
      calmSessions,
      habits,
      completions,
    ] = await Promise.all([
      moodCollection.query(Q.where('created_at', Q.between(weekAgo, now))).fetch(),
      journalCollection.query(Q.where('created_at', Q.between(weekAgo, now))).fetch(),
      breathingCollection.query(Q.where('created_at', Q.between(weekAgo, now))).fetch(),
      calmCollection.query(Q.where('created_at', Q.between(weekAgo, now))).fetch(),
      habitCollection.query(Q.where('archived', false)).fetch(),
      completionCollection.query(Q.where('created_at', Q.between(weekAgo, now)), Q.where('completed', true)).fetch(),
    ]);

    const avgMood = moodEntries.length > 0
      ? moodEntries.reduce((sum, e) => sum + e.intensity, 0) / moodEntries.length
      : 0;
    const avgStress = moodEntries.length > 0
      ? moodEntries.reduce((sum, e) => sum + e.stress, 0) / moodEntries.length
      : 0;
    const avgIntensity = moodEntries.length > 0
      ? moodEntries.reduce((sum, e) => sum + e.intensity, 0) / moodEntries.length
      : 0;

    const totalHabitInstances = habits.length * 7;
    const habitCompletionRate = totalHabitInstances > 0
      ? (completions.length / totalHabitInstances) * 100
      : 0;

    return {
      avgMood: Math.round(avgMood * 10) / 10,
      avgStress: Math.round(avgStress * 10) / 10,
      avgIntensity: Math.round(avgIntensity * 10) / 10,
      journalCount: journalEntries.length,
      breathingMinutes: breathingSessions.reduce((sum, s) => sum + s.duration, 0),
      calmSessions: calmSessions.filter(s => s.completed).length,
      habitCompletionRate: Math.round(habitCompletionRate),
    };
  },

  async getHabitStats(): Promise<HabitStats[]> {
    const now = Date.now();
    const weekAgo = now - 7 * 86400000;

    const [habits, completions] = await Promise.all([
      habitCollection.query(Q.where('archived', false)).fetch(),
      completionCollection.query(Q.where('created_at', Q.between(weekAgo, now)), Q.where('completed', true)).fetch(),
    ]);

    const completionByHabit: Record<string, number> = {};
    completions.forEach(c => {
      completionByHabit[c.habitId] = (completionByHabit[c.habitId] || 0) + 1;
    });

    return habits.map(habit => {
      const completedThisWeek = completionByHabit[habit.id] || 0;
      const daysDue = 7; // Simplified - assuming daily
      return {
        id: habit.id,
        name: habit.name,
        color: habit.color,
        icon: habit.icon,
        completedThisWeek,
        totalThisWeek: daysDue,
        currentStreak: 0, // Would need streak calculation
        longestStreak: 0,
      };
    });
  },

  async getMoodDistribution(startDate: number, endDate: number): Promise<Record<string, number>> {
    const entries = await moodCollection
      .query(Q.where('created_at', Q.between(startDate, endDate)))
      .fetch();
    const distribution: Record<string, number> = {};
    entries.forEach((entry) => {
      distribution[entry.mood] = (distribution[entry.mood] || 0) + 1;
    });
    return distribution;
  },

  async getMoodCalendarData(year: number, month: number): Promise<Record<number, { mood: string; intensity: number; stress: number; energy: string }>> {
    const start = new Date(year, month, 1).getTime();
    const end = new Date(year, month + 1, 0, 23, 59, 59).getTime();

    const entries = await moodCollection
      .query(Q.where('created_at', Q.between(start, end)), Q.sortBy('created_at', Q.desc))
      .fetch();

    const data: Record<number, { mood: string; intensity: number; stress: number; energy: string }> = {};
    entries.forEach(entry => {
      const day = new Date(entry.createdAt).getDate();
      if (!data[day]) {
        data[day] = {
          mood: entry.mood,
          intensity: entry.intensity,
          stress: entry.stress,
          energy: entry.energy,
        };
      }
    });
    return data;
  },

  async generateInsights(): Promise<Insight[]> {
    const stats = await this.getWeeklyStats();
    const insights: Insight[] = [];

    if (stats.avgStress < 4 && stats.calmSessions > 3) {
      insights.push({
        id: '1',
        text: 'Your stress stays low when you do 3+ calm sessions a week. Keep it up!',
        type: 'positive',
      });
    }

    if (stats.journalCount >= 3 && stats.avgMood > 6) {
      insights.push({
        id: '2',
        text: 'Journaling 3+ times correlates with better mood scores for you.',
        type: 'positive',
      });
    }

    if (stats.habitCompletionRate > 60) {
      insights.push({
        id: '3',
        text: `You completed ${stats.habitCompletionRate}% of habits this week. Consistency builds momentum.`,
        type: 'positive',
      });
    }

    if (stats.breathingMinutes > 20) {
      insights.push({
        id: '4',
        text: `${stats.breathingMinutes} minutes of breathing this week. Your nervous system thanks you.`,
        type: 'positive',
      });
    }

    if (stats.journalCount === 0) {
      insights.push({
        id: '5',
        text: 'No journal entries this week. Even one sentence can help process the day.',
        type: 'action',
      });
    }

    if (stats.calmSessions === 0) {
      insights.push({
        id: '6',
        text: 'No calm sessions logged. A 2-minute breathing exercise can shift your state.',
        type: 'action',
      });
    }

    if (insights.length === 0) {
      insights.push({
        id: '7',
        text: 'Keep tracking to unlock personalized insights about your patterns.',
        type: 'neutral',
      });
    }

    return insights;
  },

  async getMonthlyComparison(): Promise<{ thisMonth: WeeklyStats; lastMonth: WeeklyStats }> {
    const now = Date.now();
    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);
    
    const lastMonthStart = new Date(thisMonthStart);
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
    const lastMonthEnd = new Date(thisMonthStart);
    lastMonthEnd.setMilliseconds(-1);

    const [thisMonth, lastMonth] = await Promise.all([
      this.getStatsForRange(thisMonthStart.getTime(), now),
      this.getStatsForRange(lastMonthStart.getTime(), lastMonthEnd.getTime()),
    ]);

    return { thisMonth, lastMonth };
  },

  async getStatsForRange(startDate: number, endDate: number): Promise<WeeklyStats> {
    const [
      moodEntries,
      journalEntries,
      breathingSessions,
      calmSessions,
      habits,
      completions,
    ] = await Promise.all([
      moodCollection.query(Q.where('created_at', Q.between(startDate, endDate))).fetch(),
      journalCollection.query(Q.where('created_at', Q.between(startDate, endDate))).fetch(),
      breathingCollection.query(Q.where('created_at', Q.between(startDate, endDate))).fetch(),
      calmCollection.query(Q.where('created_at', Q.between(startDate, endDate))).fetch(),
      habitCollection.query(Q.where('archived', false)).fetch(),
      completionCollection.query(Q.where('created_at', Q.between(startDate, endDate)), Q.where('completed', true)).fetch(),
    ]);

    const avgMood = moodEntries.length > 0
      ? moodEntries.reduce((sum, e) => sum + e.intensity, 0) / moodEntries.length
      : 0;
    const avgStress = moodEntries.length > 0
      ? moodEntries.reduce((sum, e) => sum + e.stress, 0) / moodEntries.length
      : 0;
    const avgIntensity = moodEntries.length > 0
      ? moodEntries.reduce((sum, e) => sum + e.intensity, 0) / moodEntries.length
      : 0;

    const totalHabitInstances = habits.length * 7;
    const habitCompletionRate = totalHabitInstances > 0
      ? (completions.length / totalHabitInstances) * 100
      : 0;

    return {
      avgMood: Math.round(avgMood * 10) / 10,
      avgStress: Math.round(avgStress * 10) / 10,
      avgIntensity: Math.round(avgIntensity * 10) / 10,
      journalCount: journalEntries.length,
      breathingMinutes: breathingSessions.reduce((sum, s) => sum + s.duration, 0),
      calmSessions: calmSessions.filter(s => s.completed).length,
      habitCompletionRate: Math.round(habitCompletionRate),
    };
  },
};