import { Model } from '@nozbe/watermelondb';
import { field, text, date, readonly } from '@nozbe/watermelondb/decorators';

export default class UserSetting extends Model {
  static table = 'user_settings';

  @text('key') key!: string;
  @text('value') value!: string;
}