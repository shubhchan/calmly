import { Database as WatermelonDatabase } from '@nozbe/watermelondb';
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs';
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
  const adapter = new LokiJSAdapter({
    dbName: 'calmly_db',
    schema,
    migrations,
    useWebWorker: false,
    useIncrementalIndexedDB: true,
    onSetUpError: (error: Error) => {
      console.warn('WatermelonDB (LokiJS) setup error on web:', error);
      databaseAvailable = false;
    },
  });

  database = new WatermelonDatabase({
    adapter,
    modelClasses,
  });
} catch (error) {
  console.warn('WatermelonDB LokiJSAdapter unavailable on web, falling back to no-op:', error);
  databaseAvailable = false;
  database = createNoopDatabase() as unknown as WatermelonDatabase;
}

export { database, databaseAvailable };
export type AppDatabase = typeof database;

