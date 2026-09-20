import { Model } from '@nozbe/watermelondb';
import { field, text, date, readonly, writer } from '@nozbe/watermelondb/decorators';

export default class Affirmation extends Model {
  static table = 'affirmations';

  @text('text') text!: string;
  @text('category') category!: string;
  @field('favorite') favorite!: boolean;
  @field('created_at') createdAt!: number;

  @readonly @date('created_at') createdAtDate!: Date;
}