import { Model } from '@nozbe/watermelondb';
import { field, text, date, readonly, writer } from '@nozbe/watermelondb/decorators';

export default class GratitudeEntry extends Model {
  static table = 'gratitude_entries';

  @text('text') text!: string;
  @text('mood') mood!: string;
  @text('tags') tags!: string;
  @text('image_uri') imageUri!: string;
  @field('favorite') favorite!: boolean;
  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;

  @readonly @date('created_at') createdAtDate!: Date;
  @readonly @date('updated_at') updatedAtDate!: Date;
}