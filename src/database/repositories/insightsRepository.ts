import { database } from '..';
import { Q } from '@nozbe/watermelondb';
import { MoodEntry, JournalEntry, Habit, HabitCompletion, CalmSession, BreathingSession } from '../models';
import { moodRepository } from './moodRepository';
import { journalRepository } from './journalRepository';

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
  moodCount?: number;
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
    return this.getStatsForRange(Date.now() - 7 * 86400000, Date.now());
  },

  async getHabitStats(days = 7): Promise<HabitStats[]> {
    const now = Date.now();
    const weekAgo = now - days * 86400000;

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
      const daysDue = days; // Displayed as an approximate daily opportunity count
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
    return moodRepository.getMoodDistribution(startDate, endDate);
  },

  async getMoodCalendarData(year: number, month: number): Promise<Record<number, { mood: string; intensity: number; stress: number; energy: string }>> {
    const start = new Date(year, month, 1).getTime();
    const end = new Date(year, month + 1, 1).getTime() - 1;
    const entries = await moodRepository.getByDateRange(start, end);
    const data: Record<number, { mood: string; intensity: number; stress: number; energy: string }> = {};
    for (const entry of entries) {
      const day = new Date(entry.createdAt).getDate();
      if (!data[day]) data[day] = { mood: entry.mood, intensity: entry.intensity, stress: entry.stress, energy: entry.energy };
    }
    return data;
  },

  async generateInsights(days = 7): Promise<Insight[]> {
    const stats = await this.getStatsForRange(Date.now() - days * 86400000, Date.now());
    const insights: Insight[] = [];

    if ((stats.moodCount ?? 0) > 0 && stats.avgStress < 4 && stats.calmSessions > 3) {
      insights.push({
        id: '1',
        text: 'You recorded several calm sessions and a lower average stress rating. This is a pattern to reflect on, not proof of cause and effect.',
        type: 'positive',
      });
    }

    if (stats.journalCount >= 3 && (stats.moodCount ?? 0) >= 1) {
      insights.push({
        id: '2',
        text: 'You wrote at least three journal entries this period. Review your reflection map for themes that appeared alongside check-ins.',
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
        text: 'No journal notes were recorded in this period. One sentence is enough to begin a reflection.',
        type: 'action',
      });
    }

    if (stats.calmSessions === 0) {
      insights.push({
        id: '6',
        text: 'No calm sessions were logged in this period. Try a short breathing practice if it feels helpful.',
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
      moodRepository.getByDateRange(startDate, endDate),
      journalRepository.getByDateRange(startDate, endDate),
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
      moodCount: moodEntries.length,
      journalCount: journalEntries.length,
      breathingMinutes: breathingSessions.reduce((sum, s) => sum + s.duration, 0),
      calmSessions: calmSessions.filter(s => s.completed).length,
      habitCompletionRate: Math.round(habitCompletionRate),
    };
  },
};