import { Model } from '@nozbe/watermelondb';
import { field, text, date, readonly, writer } from '@nozbe/watermelondb/decorators';

export default class Habit extends Model {
  static table = 'habits';

  @text('name') name!: string;
  @text('icon') icon!: string;
  @text('color') color!: string;
  @text('frequency') frequency!: string;
  @text('custom_days') customDays!: string;
  @text('reminder_time') reminderTime!: string;
  @field('goal') goal!: number;
  @text('notes') notes!: string;
  @field('archived') archived!: boolean;
  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;

  @readonly @date('created_at') createdAtDate!: Date;
  @readonly @date('updated_at') updatedAtDate!: Date;
}