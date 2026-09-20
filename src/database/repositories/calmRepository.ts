import { database } from '..';
import { Q } from '@nozbe/watermelondb';
import { CalmSession, BreathingSession, MeditationSession } from '../models';

const calmCollection = database.get<CalmSession>('calm_sessions');
const breathingCollection = database.get<BreathingSession>('breathing_sessions');
const meditationCollection = database.get<MeditationSession>('meditation_sessions');

export const calmRepository = {
  async logSession(data: {
    type: 'breathing' | 'grounding' | 'meditation';
    preset?: string;
    duration: number;
    completed: boolean;
  }) {
    return database.write(async () => {
      return calmCollection.create((session) => {
        session.type = data.type;
        session.preset = data.preset || '';
        session.duration = data.duration;
        session.completed = data.completed;
        session.createdAt = Date.now();
      });
    });
  },

  async logBreathing(data: {
    preset: string;
    duration: number;
    cyclesCompleted: number;
  }) {
    return database.write(async () => {
      return breathingCollection.create((session) => {
        session.preset = data.preset;
        session.duration = data.duration;
        session.cyclesCompleted = data.cyclesCompleted;
        session.createdAt = Date.now();
      });
    });
  },

  async logMeditation(data: {
    title: string;
    duration: number;
    completed: boolean;
  }) {
    return database.write(async () => {
      return meditationCollection.create((session) => {
        session.title = data.title;
        session.duration = data.duration;
        session.completed = data.completed;
        session.createdAt = Date.now();
      });
    });
  },

  async getSessionsByDateRange(startDate: number, endDate: number): Promise<CalmSession[]> {
    return calmCollection
      .query(
        Q.where('created_at', Q.between(startDate, endDate)),
        Q.sortBy('created_at', Q.desc)
      )
      .fetch();
  },

  async getBreathingSessions(startDate: number, endDate: number): Promise<BreathingSession[]> {
    return breathingCollection
      .query(
        Q.where('created_at', Q.between(startDate, endDate)),
        Q.sortBy('created_at', Q.desc)
      )
      .fetch();
  },

  async getTotalBreathingMinutes(startDate: number, endDate: number): Promise<number> {
    const sessions = await this.getBreathingSessions(startDate, endDate);
    return sessions.reduce((sum, s) => sum + s.duration, 0);
  },

  async getTotalCalmSessions(startDate: number, endDate: number): Promise<number> {
    const sessions = await this.getSessionsByDateRange(startDate, endDate);
    return sessions.filter((s) => s.completed).length;
  },
};