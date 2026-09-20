import { Model } from '@nozbe/watermelondb';
import { field, text, date, readonly, writer } from '@nozbe/watermelondb/decorators';

export default class Routine extends Model {
  static table = 'routines';

  @text('name') name!: string;
  @text('time_of_day') timeOfDay!: string;
  @field('active') active!: boolean;
  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;

  @readonly @date('created_at') createdAtDate!: Date;
  @readonly @date('updated_at') updatedAtDate!: Date;
}