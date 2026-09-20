import { database } from '..';
import { Q } from '@nozbe/watermelondb';
import { Routine, RoutineItem, Habit } from '../models';

const routineCollection = database.get<Routine>('routines');
const routineItemCollection = database.get<RoutineItem>('routine_items');
const habitCollection = database.get<Habit>('habits');

export type TimeOfDay = 'morning' | 'afternoon' | 'evening';

export const routineRepository = {
  async create(data: { name: string; timeOfDay: TimeOfDay; habitIds: string[] }) {
    return database.write(async () => {
      const routine = await routineCollection.create((r) => {
        r.name = data.name;
        r.timeOfDay = data.timeOfDay;
        r.active = true;
        r.createdAt = Date.now();
        r.updatedAt = Date.now();
      });

      await Promise.all(
        data.habitIds.map((habitId, index) =>
          routineItemCollection.create((item) => {
            item.routineId = routine.id;
            item.habitId = habitId;
            item.order = index;
          })
        )
      );

      return routine;
    });
  },

  async getAll(): Promise<Routine[]> {
    return routineCollection.query(Q.where('active', true), Q.sortBy('created_at', Q.desc)).fetch();
  },

  async getByTimeOfDay(timeOfDay: TimeOfDay): Promise<(Routine & { items: (RoutineItem & { habit: Habit })[] })[]> {
    const routines = await routineCollection
      .query(Q.where('active', true), Q.where('time_of_day', timeOfDay), Q.sortBy('created_at', Q.desc))
      .fetch();

    return Promise.all(
      routines.map(async (routine) => {
        const items = await routineItemCollection
          .query(Q.where('routine_id', routine.id), Q.sortBy('order', Q.asc))
          .fetch();

        const itemsWithHabits = await Promise.all(
          items.map(async (item) => {
            const habit = await habitCollection.find(item.habitId);
            return { ...item, habit: habit! };
          })
        );

        return { ...routine, items: itemsWithHabits };
      })
    );
  },

  async getById(id: string): Promise<Routine | null> {
    try {
      return await routineCollection.find(id);
    } catch {
      return null;
    }
  },

  async getWithItems(id: string): Promise<(Routine & { items: (RoutineItem & { habit: Habit })[] }) | null> {
    try {
      const routine = await routineCollection.find(id);
      const items = await routineItemCollection
        .query(Q.where('routine_id', id), Q.sortBy('order', Q.asc))
        .fetch();

      const itemsWithHabits = await Promise.all(
        items.map(async (item) => {
          const habit = await habitCollection.find(item.habitId);
          return { ...item, habit: habit! };
        })
      );

      return { ...routine, items: itemsWithHabits };
    } catch {
      return null;
    }
  },

  async update(id: string, data: { name?: string; habitIds?: string[] }) {
    return database.write(async () => {
      const routine = await routineCollection.find(id);
      await routine.update((r) => {
        if (data.name !== undefined) r.name = data.name;
        r.updatedAt = Date.now();
      });

      if (data.habitIds !== undefined) {
        const existingItems = await routineItemCollection.query(Q.where('routine_id', id)).fetch();
        await Promise.all(existingItems.map((item) => item.destroyPermanently()));

        await Promise.all(
          data.habitIds.map((habitId, index) =>
            routineItemCollection.create((item) => {
              item.routineId = id;
              item.habitId = habitId;
              item.order = index;
            })
          )
        );
      }
    });
  },

  async delete(id: string) {
    return database.write(async () => {
      const items = await routineItemCollection.query(Q.where('routine_id', id)).fetch();
      await Promise.all(items.map((item) => item.destroyPermanently()));
      const routine = await routineCollection.find(id);
      await routine.destroyPermanently();
    });
  },

  async reorderItems(routineId: string, habitIds: string[]) {
    return database.write(async () => {
      const existingItems = await routineItemCollection.query(Q.where('routine_id', routineId)).fetch();
      await Promise.all(existingItems.map((item) => item.destroyPermanently()));

      await Promise.all(
        habitIds.map((habitId, index) =>
          routineItemCollection.create((item) => {
            item.routineId = routineId;
            item.habitId = habitId;
            item.order = index;
          })
        )
      );
    });
  },
};