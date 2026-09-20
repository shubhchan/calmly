import { Model } from '@nozbe/watermelondb';
import { field, text, date, readonly, writer } from '@nozbe/watermelondb/decorators';

export default class Reflection extends Model {
  static table = 'reflections';

  @text('type') type!: string;
  @text('period') period!: string;
  @text('content') content!: string;
  @field('mood_before') moodBefore!: number;
  @field('mood_after') moodAfter!: number;
  @field('created_at') createdAt!: number;

  @readonly @date('created_at') createdAtDate!: Date;
}