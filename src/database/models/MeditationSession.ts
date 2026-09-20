import { Model } from '@nozbe/watermelondb';
import { field, text, date, readonly, writer } from '@nozbe/watermelondb/decorators';

export default class MeditationSession extends Model {
  static table = 'meditation_sessions';

  @text('title') title!: string;
  @field('duration') duration!: number;
  @field('completed') completed!: boolean;
  @field('created_at') createdAt!: number;

  @readonly @date('created_at') createdAtDate!: Date;
}