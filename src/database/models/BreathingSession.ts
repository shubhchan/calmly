import { Model } from '@nozbe/watermelondb';
import { field, text, date, readonly, writer } from '@nozbe/watermelondb/decorators';

export default class BreathingSession extends Model {
  static table = 'breathing_sessions';

  @text('preset') preset!: string;
  @field('duration') duration!: number;
  @field('cycles_completed') cyclesCompleted!: number;
  @field('created_at') createdAt!: number;

  @readonly @date('created_at') createdAtDate!: Date;
}