import { Model } from '@nozbe/watermelondb';
import { field, text, date, readonly, writer } from '@nozbe/watermelondb/decorators';

export default class PositiveMoment extends Model {
  static table = 'positive_moments';

  @text('text') text!: string;
  @text('mood') mood!: string;
  @text('tags') tags!: string;
  @field('favorite') favorite!: boolean;
  @field('resurfaced_at') resurfacedAt!: number;
  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;

  @readonly @date('created_at') createdAtDate!: Date;
  @readonly @date('updated_at') updatedAtDate!: Date;
  @readonly @date('resurfaced_at') resurfacedAtDate!: Date;
}