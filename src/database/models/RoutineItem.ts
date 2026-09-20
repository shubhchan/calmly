import { Model } from '@nozbe/watermelondb';
import { field, text, date, readonly, writer } from '@nozbe/watermelondb/decorators';

export default class RoutineItem extends Model {
  static table = 'routine_items';

  @text('routine_id') routineId!: string;
  @text('habit_id') habitId!: string;
  @field('order') order!: number;
}