import { Model } from '@nozbe/watermelondb';
import { field, text, date, readonly, writer } from '@nozbe/watermelondb/decorators';

export default class JournalEntry extends Model {
  static table = 'journal_entries';

  @text('type') type!: string;
  @text('title') title!: string;
  @text('body') body!: string;
  @text('mood') mood!: string;
  @text('tags') tags!: string;
  @field('favorite') favorite!: boolean;
  @text('image_uri') imageUri!: string;
  @text('audio_uri') audioUri!: string;
  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;

  @readonly @date('created_at') createdAtDate!: Date;
  @readonly @date('updated_at') updatedAtDate!: Date;
}