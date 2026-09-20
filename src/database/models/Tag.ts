import { Model } from '@nozbe/watermelondb';
import { field, text, date, readonly, writer } from '@nozbe/watermelondb/decorators';

export default class Tag extends Model {
  static table = 'tags';

  @text('name') name!: string;
  @text('color') color!: string;
  @field('created_at') createdAt!: number;

  @readonly @date('created_at') createdAtDate!: Date;
}