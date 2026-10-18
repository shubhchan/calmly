import { database, databaseAvailable } from '..';
import { Q } from '@nozbe/watermelondb';
import { UserSetting } from '../models';

const getSettingsCollection = () => database.get<UserSetting>('user_settings');

const SETTINGS_FILE_NAME = 'calmly-settings.json';

// The JSON file store is authoritative for app settings. WatermelonDB used to
// be the only store, but when the native database module fails to initialise
// (stale dev build / missing JSI module) the repository silently wrote into a
// no-op database: PIN setup and toggles "saved" and then vanished on reload.
// Every write now lands in the settings file first (immune to database
// failures), and WatermelonDB is mirrored best-effort for exports/back-compat.
interface SettingsFile {
  exists: boolean;
  textSync(): string;
  create(options?: { overwrite?: boolean }): void;
  write(content: string): void;
  delete(): void;
}

let fileStoreUnavailable = false;

function getSettingsFile(): SettingsFile | null {
  if (fileStoreUnavailable) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { File, Paths } = require('expo-file-system');
    return new File(Paths.document, SETTINGS_FILE_NAME) as SettingsFile;
  } catch (error) {
    console.warn('Settings file store unavailable:', error);
    fileStoreUnavailable = true;
    return null;
  }
}

function readSettingsFromFile(): Partial<AppSettings> | null {
  const file = getSettingsFile();
  if (!file) return null;
  try {
    if (!file.exists) return null;
    const raw = file.textSync();
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (error) {
    console.warn('Failed to read settings file:', error);
    return null;
  }
}

function writeSettingsToFile(settings: AppSettings): boolean {
  const file = getSettingsFile();
  if (!file) return false;
  try {
    const json = JSON.stringify(settings);
    if (file.exists) {
      file.write(json);
    } else {
      file.create({ overwrite: true });
      file.write(json);
    }
    return true;
  } catch (error) {
    console.warn('Failed to write settings file:', error);
    return false;
  }
}

export function deleteSettingsFileStore(): void {
  try {
    const file = getSettingsFile();
    if (file?.exists) file.delete();
  } catch (error) {
    console.warn('Failed to delete settings file:', error);
  }
}

async function readSettingsFromDatabase(): Promise<Partial<AppSettings> | null> {
  if (!databaseAvailable) return null;
  try {
    const setting = await getSettingsCollection()
      .query(Q.where('key', 'app_settings'), Q.take(1))
      .fetch();
    if (setting.length > 0) {
      const parsed = JSON.parse(setting[0].value);
      return parsed && typeof parsed === 'object' ? parsed : null;
    }
    return null;
  } catch (error) {
    console.warn('Failed to read settings from database:', error);
    return null;
  }
}

async function writeSettingsToDatabase(settings: AppSettings): Promise<boolean> {
  if (!databaseAvailable) return false;
  try {
    // user_settings has only (key, value) columns — never touch
    // createdAt/updatedAt here (WatermelonDB throws on unknown fields).
    await database.write(async () => {
      const existing = await getSettingsCollection()
        .query(Q.where('key', 'app_settings'), Q.take(1))
        .fetch();
      if (existing.length > 0) {
        await existing[0].update((s: UserSetting) => {
          s.value = JSON.stringify(settings);
        });
      } else {
        await getSettingsCollection().create((s: UserSetting) => {
          s.key = 'app_settings';
          s.value = JSON.stringify(settings);
        });
      }
    });
    return true;
  } catch (error) {
    console.warn('Failed to write settings to database (file store still active):', error);
    return false;
  }
}

export interface AppSettings {
  biometricEnabled: boolean;
  pinEnabled: boolean;
  pinHash?: string;
  autoLockMinutes: number;
  hideContentInSwitcher: boolean;
  theme: 'light' | 'dark' | 'system';
  accent: 'sage' | 'lavender' | 'sky' | 'peach' | 'rose' | 'ocean';
  reducedMotion: boolean;
  hapticsEnabled: boolean;
  notificationsEnabled: boolean;
  onboardingComplete?: boolean;
  userName?: string;
  welcomeCardDismissed?: boolean;
  notificationTimes: {
    morningCheckIn: string;
    journalReminder: string;
    habitReminder: string;
    eveningReflection: string;
    sleepRoutine: string;
    weeklyReflection: string;
  };
  notificationCategories: {
    morningCheckIn: boolean;
    journalReminder: boolean;
    habitReminder: boolean;
    eveningReflection: boolean;
    sleepRoutine: boolean;
    weeklyReflection: boolean;
  };
}

const DEFAULT_SETTINGS: AppSettings = {
  biometricEnabled: false,
  pinEnabled: false,
  autoLockMinutes: 5,
  hideContentInSwitcher: true,
  theme: 'system',
  accent: 'sage',
  reducedMotion: false,
  hapticsEnabled: true,
  notificationsEnabled: true,
  welcomeCardDismissed: false,
  notificationTimes: {
    morningCheckIn: '08:00',
    journalReminder: '20:00',
    habitReminder: '09:00',
    eveningReflection: '21:00',
    sleepRoutine: '22:00',
    weeklyReflection: '10:00',
  },
  notificationCategories: {
    morningCheckIn: true,
    journalReminder: true,
    habitReminder: true,
    eveningReflection: true,
    sleepRoutine: true,
    weeklyReflection: true,
  },
};

export const settingsRepository = {
  async getSettings(): Promise<AppSettings> {
    const fromFile = readSettingsFromFile();
    if (fromFile) return { ...DEFAULT_SETTINGS, ...fromFile };

    const fromDatabase = await readSettingsFromDatabase();
    if (fromDatabase) {
      // Hydrate the file store so settings survive future database breakage.
      writeSettingsToFile({ ...DEFAULT_SETTINGS, ...fromDatabase });
      return { ...DEFAULT_SETTINGS, ...fromDatabase };
    }

    return DEFAULT_SETTINGS;
  },

  async updateSettings(data: Partial<AppSettings>) {
    const current = await this.getSettings();
    const updated = { ...current, ...data };

    const fileOk = writeSettingsToFile(updated);
    const databaseOk = await writeSettingsToDatabase(updated);

    if (!fileOk && !databaseOk) {
      throw new Error('Settings could not be persisted: no storage backend is available.');
    }
  },

  async setPin(pin: string) {
    const hash = await this.hashPin(pin);
    await this.updateSettings({ pinEnabled: true, pinHash: hash });
  },

  async verifyPin(pin: string): Promise<boolean> {
    const settings = await this.getSettings();
    if (!settings.pinHash) return false;
    const hash = await this.hashPin(pin);
    return hash === settings.pinHash;
  },

  async removePin() {
    await this.updateSettings({ pinEnabled: false, pinHash: undefined });
  },

  // Pure-JS hash (cyrb53 + salt). The old implementation used
  // crypto.subtle.digest + TextEncoder, neither of which exists on Hermes /
  // React Native — calling it threw and broke PIN setup in release builds.
  // A device-local PIN hash doesn't need WebCrypto; determinism is what matters.
  async hashPin(pin: string): Promise<string> {
    const input = `calmly_salt_2024:${pin}`;
    let h1 = 0xdeadbeef;
    let h2 = 0x41c6ce57;
    for (let i = 0; i < input.length; i++) {
      const ch = input.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
  },

  async getNotificationConfig() {
    const settings = await this.getSettings();
    return {
      enabled: settings.notificationsEnabled,
      times: settings.notificationTimes,
      categories: settings.notificationCategories,
    };
  },

  // Loose record type: callers pass computed keys (e.g. { morningCheckInCat: x }
  // or { morningCheckIn: '08:00' }). The old intersection type collapsed to
  // `never`, making every call a type error.
  async updateNotificationConfig(config: Record<string, any>) {
    const settings = await this.getSettings();
    const updated: AppSettings = {
      ...settings,
      notificationTimes: { ...settings.notificationTimes },
      notificationCategories: { ...settings.notificationCategories },
    };
    if (config.enabled !== undefined) updated.notificationsEnabled = config.enabled;
    if (config.morningCheckIn !== undefined) updated.notificationTimes.morningCheckIn = config.morningCheckIn;
    if (config.journalReminder !== undefined) updated.notificationTimes.journalReminder = config.journalReminder;
    if (config.habitReminder !== undefined) updated.notificationTimes.habitReminder = config.habitReminder;
    if (config.eveningReflection !== undefined) updated.notificationTimes.eveningReflection = config.eveningReflection;
    if (config.sleepRoutine !== undefined) updated.notificationTimes.sleepRoutine = config.sleepRoutine;
    if (config.weeklyReflection !== undefined) updated.notificationTimes.weeklyReflection = config.weeklyReflection;
    if (config.morningCheckInCat !== undefined) updated.notificationCategories.morningCheckIn = config.morningCheckInCat;
    if (config.journalReminderCat !== undefined) updated.notificationCategories.journalReminder = config.journalReminderCat;
    if (config.habitReminderCat !== undefined) updated.notificationCategories.habitReminder = config.habitReminderCat;
    if (config.eveningReflectionCat !== undefined) updated.notificationCategories.eveningReflection = config.eveningReflectionCat;
    if (config.sleepRoutineCat !== undefined) updated.notificationCategories.sleepRoutine = config.sleepRoutineCat;
    if (config.weeklyReflectionCat !== undefined) updated.notificationCategories.weeklyReflection = config.weeklyReflectionCat;
    return this.updateSettings(updated);
  },
};
