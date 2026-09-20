import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 2,
  tables: [
    tableSchema({
      name: 'user_settings',
      columns: [
        { name: 'key', type: 'string', isIndexed: true },
        { name: 'value', type: 'string' },
      ],
    }),
    tableSchema({
      name: 'mood_entries',
      columns: [
        { name: 'mood', type: 'string' },
        { name: 'intensity', type: 'number' },
        { name: 'stress', type: 'number' },
        { name: 'energy', type: 'string' },
        { name: 'context', type: 'string' },
        { name: 'needs', type: 'string' },
        { name: 'created_at', type: 'number', isIndexed: true },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'journal_entries',
      columns: [
        { name: 'type', type: 'string', isIndexed: true },
        { name: 'title', type: 'string' },
        { name: 'body', type: 'string' },
        { name: 'mood', type: 'string' },
        { name: 'tags', type: 'string' },
        { name: 'favorite', type: 'boolean' },
        { name: 'image_uri', type: 'string' },
        { name: 'audio_uri', type: 'string' },
        { name: 'created_at', type: 'number', isIndexed: true },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'habits',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'icon', type: 'string' },
        { name: 'color', type: 'string' },
        { name: 'frequency', type: 'string' },
        { name: 'custom_days', type: 'string' },
        { name: 'reminder_time', type: 'string' },
        { name: 'goal', type: 'number' },
        { name: 'notes', type: 'string' },
        { name: 'archived', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'habit_completions',
      columns: [
        { name: 'habit_id', type: 'string', isIndexed: true },
        { name: 'date', type: 'string', isIndexed: true },
        { name: 'completed', type: 'boolean' },
        { name: 'created_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'gratitude_entries',
      columns: [
        { name: 'text', type: 'string' },
        { name: 'mood', type: 'string' },
        { name: 'tags', type: 'string' },
        { name: 'image_uri', type: 'string' },
        { name: 'favorite', type: 'boolean' },
        { name: 'created_at', type: 'number', isIndexed: true },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'positive_moments',
      columns: [
        { name: 'text', type: 'string' },
        { name: 'mood', type: 'string' },
        { name: 'tags', type: 'string' },
        { name: 'favorite', type: 'boolean' },
        { name: 'resurfaced_at', type: 'number' },
        { name: 'created_at', type: 'number', isIndexed: true },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'calm_sessions',
      columns: [
        { name: 'type', type: 'string', isIndexed: true },
        { name: 'preset', type: 'string' },
        { name: 'duration', type: 'number' },
        { name: 'completed', type: 'boolean' },
        { name: 'created_at', type: 'number', isIndexed: true },
      ],
    }),
    tableSchema({
      name: 'breathing_sessions',
      columns: [
        { name: 'preset', type: 'string' },
        { name: 'duration', type: 'number' },
        { name: 'cycles_completed', type: 'number' },
        { name: 'created_at', type: 'number', isIndexed: true },
      ],
    }),
    tableSchema({
      name: 'meditation_sessions',
      columns: [
        { name: 'title', type: 'string' },
        { name: 'duration', type: 'number' },
        { name: 'completed', type: 'boolean' },
        { name: 'created_at', type: 'number', isIndexed: true },
      ],
    }),
    tableSchema({
      name: 'sleep_entries',
      columns: [
        { name: 'bedtime', type: 'number' },
        { name: 'wake_time', type: 'number' },
        { name: 'quality', type: 'number' },
        { name: 'notes', type: 'string' },
        { name: 'created_at', type: 'number', isIndexed: true },
      ],
    }),
    tableSchema({
      name: 'reflections',
      columns: [
        { name: 'type', type: 'string' },
        { name: 'period', type: 'string' },
        { name: 'content', type: 'string' },
        { name: 'mood_before', type: 'number' },
        { name: 'mood_after', type: 'number' },
        { name: 'created_at', type: 'number', isIndexed: true },
      ],
    }),
    tableSchema({
      name: 'affirmations',
      columns: [
        { name: 'text', type: 'string' },
        { name: 'category', type: 'string' },
        { name: 'favorite', type: 'boolean' },
        { name: 'created_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'favorites',
      columns: [
        { name: 'item_type', type: 'string', isIndexed: true },
        { name: 'item_id', type: 'string', isIndexed: true },
        { name: 'created_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'tags',
      columns: [
        { name: 'name', type: 'string', isIndexed: true },
        { name: 'color', type: 'string' },
        { name: 'created_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'routines',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'time_of_day', type: 'string' },
        { name: 'active', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'routine_items',
      columns: [
        { name: 'routine_id', type: 'string', isIndexed: true },
        { name: 'habit_id', type: 'string', isIndexed: true },
        { name: 'order', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'goals',
      columns: [
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string' },
        { name: 'target_date', type: 'number' },
        { name: 'completed', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});

import { schemaMigrations, createTable } from '@nozbe/watermelondb/Schema/migrations';

// v1 -> v2: the PositiveMoment model shipped without its table, so any access
// to positive_moments threw. Fresh installs get the table from `schema` above;
// existing v1 installs migrate here instead of resetting (which would wipe
// user journals/habits).
export const migrations = schemaMigrations({
  migrations: [
    {
      toVersion: 2,
      steps: [
        createTable({
          name: 'positive_moments',
          columns: [
            { name: 'text', type: 'string' },
            { name: 'mood', type: 'string' },
            { name: 'tags', type: 'string' },
            { name: 'favorite', type: 'boolean' },
            { name: 'resurfaced_at', type: 'number' },
            { name: 'created_at', type: 'number', isIndexed: true },
            { name: 'updated_at', type: 'number' },
          ],
        }),
      ],
    },
  ],
});