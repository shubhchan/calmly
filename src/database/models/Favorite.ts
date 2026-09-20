import { Model } from '@nozbe/watermelondb';
import { field, text, date, readonly, writer } from '@nozbe/watermelondb/decorators';

export default class Favorite extends Model {
  static table = 'favorites';

  @text('item_type') itemType!: string;
  @text('item_id') itemId!: string;
  @field('created_at') createdAt!: number;

  @readonly @date('created_at') createdAtDate!: Date;
}