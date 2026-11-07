import { journalRepository } from '../database/repositories/journalRepository';
import { moodRepository } from '../database/repositories/moodRepository';
import { calmRepository } from '../database/repositories/calmRepository';
import { settingsRepository } from '../database/repositories/settingsRepository';

export interface MindfulStats {
  /** Days since first use, counting today as day one. */
  days: number;
  reflections: number;
  sessions: number;
  mindfulMinutes: number;
  /** Consecutive days with at least one record. */
  streak: number;
}

export const EMPTY_MINDFUL_STATS: MindfulStats = {
  days: 1,
  reflections: 0,
  sessions: 0,
  mindfulMinutes: 0,
  streak: 0,
};

function computeStreak(timestamps: number[]): number {
  const days = new Set(
    timestamps.filter((timestamp) => Number.isFinite(timestamp)).map((timestamp) => new Date(timestamp).toDateString())
  );
  const cursor = new Date();
  if (!days.has(cursor.toDateString())) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(cursor.toDateString())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** One quiet read of the user's own records, shared by the Me screens. */
export async function loadMindfulStats(): Promise<MindfulStats> {
  const now = Date.now();
  const [settings, journals, moods, calmSessions, breathingSessions] = await Promise.all([
    settingsRepository.getSettings().catch(() => null),
    journalRepository.getAll().catch(() => []),
    moodRepository.getAll().catch(() => []),
    calmRepository.getSessionsByDateRange(0, now).catch(() => []),
    calmRepository.getBreathingSessions(0, now).catch(() => []),
  ]);

  const sessions = [...calmSessions, ...breathingSessions];
  const mindfulSeconds = sessions.reduce((sum: number, session: any) => sum + (session?.duration || 0), 0);
  const timestamps = [
    ...(journals as any[]).map((entry) => entry?.createdAt),
    ...(moods as any[]).map((entry) => entry?.createdAt),
    ...sessions.map((session: any) => session?.createdAt),
  ];
  const firstUseAt = settings?.firstUseAt ?? now;

  return {
    days: Math.max(1, Math.floor((now - firstUseAt) / 86400000) + 1),
    reflections: journals.length,
    sessions: sessions.length,
    mindfulMinutes: Math.round(mindfulSeconds / 60),
    streak: computeStreak(timestamps),
  };
}
