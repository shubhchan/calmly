import { Database as WatermelonDatabase } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema, migrations } from './schema';
import {
  UserSetting,
  MoodEntry,
  JournalEntry,
  Habit,
  HabitCompletion,
  GratitudeEntry,
  PositiveMoment,
  CalmSession,
  BreathingSession,
  MeditationSession,
  SleepEntry,
  Reflection,
  Affirmation,
  Favorite,
  Tag,
  Routine,
  RoutineItem,
  Goal,
} from './models';

const modelClasses = [
  UserSetting,
  MoodEntry,
  JournalEntry,
  Habit,
  HabitCompletion,
  GratitudeEntry,
  PositiveMoment,
  CalmSession,
  BreathingSession,
  MeditationSession,
  SleepEntry,
  Reflection,
  Affirmation,
  Favorite,
  Tag,
  Routine,
  RoutineItem,
  Goal,
] as any[];

// Never throw at import time: the SQLite/JSI native module can be missing
// (Expo Go), fail to link, or reject the schema on some devices. In a release
// build an import-time throw means an instant grey screen with no ErrorBoundary.
// Instead fall back to a no-op in-memory database so first paint always succeeds
// and every repository degrades to empty lists.
function createNoopCollection() {
  const noopAsync = async () => {
    throw new Error('Database unavailable');
  };
  return {
    query: () => ({
      fetch: async () => [],
    }),
    find: noopAsync,
    create: noopAsync,
  };
}

function createNoopDatabase(): any {
  return {
    get: () => createNoopCollection(),
    write: async (fn: () => Promise<any>) => {
      try {
        return await fn();
      } catch {
        return undefined;
      }
    },
  };
}

let database: WatermelonDatabase;
let databaseAvailable = true;

try {
  const adapter = new SQLiteAdapter({
    schema,
    migrations,
    // Surface native setup failures via JS instead of a native crash.
    onSetUpError: (error: Error) => {
      console.warn('WatermelonDB setup error (continuing with empty data):', error);
      databaseAvailable = false;
    },
  });

  database = new WatermelonDatabase({
    adapter,
    modelClasses,
  });
} catch (error) {
  console.warn('WatermelonDB unavailable, using no-op database:', error);
  databaseAvailable = false;
  database = createNoopDatabase() as unknown as WatermelonDatabase;
}

export { database, databaseAvailable };

export type AppDatabase = typeof database;
