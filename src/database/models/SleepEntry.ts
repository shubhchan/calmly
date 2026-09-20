import { Model } from '@nozbe/watermelondb';
import { field, text, date, readonly, writer } from '@nozbe/watermelondb/decorators';

export default class SleepEntry extends Model {
  static table = 'sleep_entries';

  @field('bedtime') bedtime!: number;
  @field('wake_time') wakeTime!: number;
  @field('quality') quality!: number;
  @text('notes') notes!: string;
  @field('created_at') createdAt!: number;

  @readonly @date('created_at') createdAtDate!: Date;
}