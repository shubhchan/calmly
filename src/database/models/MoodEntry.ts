import { Model } from '@nozbe/watermelondb';
import { field, text, date, readonly, writer, children } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

export default class MoodEntry extends Model {
  static table = 'mood_entries';
  static associations: Associations = {};

  @text('mood') mood!: string;
  @field('intensity') intensity!: number;
  @field('stress') stress!: number;
  @text('energy') energy!: string;
  @text('context') context!: string;
  @text('needs') needs!: string;
  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;

  @readonly @date('created_at') createdAtDate!: Date;
  @readonly @date('updated_at') updatedAtDate!: Date;
}