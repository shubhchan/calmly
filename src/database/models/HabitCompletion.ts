import { Model } from '@nozbe/watermelondb';
import { field, text, date, readonly, writer } from '@nozbe/watermelondb/decorators';

export default class HabitCompletion extends Model {
  static table = 'habit_completions';

  @text('habit_id') habitId!: string;
  @text('date') date!: string;
  @field('completed') completed!: boolean;
  @field('created_at') createdAt!: number;

  @readonly @date('created_at') createdAtDate!: Date;
}