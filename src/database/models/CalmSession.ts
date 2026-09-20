import { Model } from '@nozbe/watermelondb';
import { field, text, date, readonly, writer } from '@nozbe/watermelondb/decorators';

export default class CalmSession extends Model {
  static table = 'calm_sessions';

  @text('type') type!: string;
  @text('preset') preset!: string;
  @field('duration') duration!: number;
  @field('completed') completed!: boolean;
  @field('created_at') createdAt!: number;

  @readonly @date('created_at') createdAtDate!: Date;
}