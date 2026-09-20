import { Model } from '@nozbe/watermelondb';
import { field, text, date, readonly, writer } from '@nozbe/watermelondb/decorators';

export default class Goal extends Model {
  static table = 'goals';

  @text('title') title!: string;
  @text('description') description!: string;
  @field('target_date') targetDate!: number;
  @field('completed') completed!: boolean;
  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;

  @readonly @date('created_at') createdAtDate!: Date;
  @readonly @date('updated_at') updatedAtDate!: Date;
}