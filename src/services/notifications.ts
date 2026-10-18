import { useState, useEffect } from 'react';
import type * as NotificationsTypes from 'expo-notifications';
import { Platform } from 'react-native';
import { settingsRepository } from '../database/repositories/settingsRepository';
import { getEncouragement } from '../utils/encouragement';

// Remote push needs a development build on Android since SDK 53; local
// scheduled reminders keep working. The package root eagerly imports every
// feature module (push, topics, ...) and a single missing native module makes
// the whole import throw — so only the pieces local reminders need are loaded,
// each guarded, and a failure can never grey-screen the app.
type NotificationsModule = typeof NotificationsTypes;

// Android 8+ requires notifications to belong to a channel or they get
// silently routed to the system fallback channel (no status-bar icon, no
// sound) — which is why scheduled reminders looked "delivered but invisible".
const ANDROID_CHANNEL_ID = 'mindful-reminders';
let channelReady = false;

let cached: NotificationsModule | null | undefined;

function assembleNotificationsModule(): NotificationsModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const core = require('expo-modules-core');
    const scheduler = core?.requireOptionalNativeModule?.('ExpoNotificationScheduler');
    if (!scheduler) {
      console.warn('Notifications unavailable (native module missing in this build, disabled).');
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const NotificationsHandler = require('expo-notifications/build/NotificationsHandler');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const NotificationPermissions = require('expo-notifications/build/NotificationPermissions');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const scheduling = require('expo-notifications/build/scheduleNotificationAsync');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const scheduled = require('expo-notifications/build/getAllScheduledNotificationsAsync');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const cancel = require('expo-notifications/build/cancelScheduledNotificationAsync');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const cancelAll = require('expo-notifications/build/cancelAllScheduledNotificationsAsync');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const types = require('expo-notifications/build/Notifications.types');

    // Channel support is loaded separately: if the native channel manager is
    // missing from the build, scheduling must still work.
    let channelAsync: any = null;
    let channelTypes: any = null;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      channelAsync = require('expo-notifications/build/setNotificationChannelAsync');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      channelTypes = require('expo-notifications/build/NotificationChannelManager.types');
    } catch (error) {
      console.warn('Notification channel support unavailable (reminders still schedule):', error);
    }

    const mod = {
      setNotificationHandler: NotificationsHandler?.setNotificationHandler,
      getPermissionsAsync: NotificationPermissions?.getPermissionsAsync,
      requestPermissionsAsync: NotificationPermissions?.requestPermissionsAsync,
      scheduleNotificationAsync: scheduling?.scheduleNotificationAsync,
      getAllScheduledNotificationsAsync: scheduled?.getAllScheduledNotificationsAsync,
      cancelScheduledNotificationAsync: cancel?.cancelScheduledNotificationAsync,
      cancelAllScheduledNotificationsAsync: cancelAll?.cancelAllScheduledNotificationsAsync,
      setNotificationChannelAsync: channelAsync?.setNotificationChannelAsync,
      AndroidImportance: channelTypes?.AndroidImportance,
      SchedulableTriggerInputTypes: types?.SchedulableTriggerInputTypes,
    } as unknown as NotificationsModule;

    if (!mod.scheduleNotificationAsync || !mod.SchedulableTriggerInputTypes) {
      console.warn('Notifications unavailable (module incomplete, disabled).');
      return null;
    }
    return mod;
  } catch (error) {
    console.warn('Notifications unavailable in this build (disabled):', error);
    return null;
  }
}

async function ensureAndroidChannel(mod: NotificationsModule): Promise<void> {
  if (Platform.OS !== 'android' || channelReady) return;
  try {
    if (!mod.setNotificationChannelAsync || !mod.AndroidImportance) return;
    await mod.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: 'Mindful Reminders',
      description: 'Gentle check-ins, journaling nudges, and habit reminders',
      importance: mod.AndroidImportance.DEFAULT,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
    });
    channelReady = true;
  } catch (error) {
    console.warn('Failed to create notification channel (reminders still schedule):', error);
  }
}

function getNotifications(): NotificationsModule | null {
  if (cached !== undefined) return cached;
  const mod = assembleNotificationsModule();
  if (!mod) {
    cached = null;
    return cached;
  }
  try {
    mod.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (error) {
    console.warn('Notification handler setup failed (scheduling still works):', error);
  }
  void ensureAndroidChannel(mod);
  cached = mod;
  return cached;
}

function isNotificationsAvailable(): boolean {
  return getNotifications() !== null;
}

export type NotificationCategory =
  | 'morningCheckIn'
  | 'journalReminder'
  | 'habitReminder'
  | 'eveningReflection'
  | 'sleepRoutine'
  | 'weeklyReflection';

export interface ScheduledNotification {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  trigger: NotificationsTypes.NotificationTriggerInput;
}

// setNotificationHandler is installed lazily inside getNotifications() above,
// guarded so a missing native module can never grey-screen the app at import.

export const notificationService = {
  isAvailable(): boolean {
    return isNotificationsAvailable();
  },

  async getPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
    try {
      const mod = getNotifications();
      if (!mod) return 'undetermined';
      const { status } = await mod.getPermissionsAsync();
      return status ?? 'undetermined';
    } catch {
      return 'undetermined';
    }
  },

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') return false;

    try {
      const mod = getNotifications();
      if (!mod) return false;
      const { status: existingStatus } = await mod.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await mod.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: false,
            allowSound: false,
          },
        });
        finalStatus = status;
      }

      return finalStatus === 'granted';
    } catch (error) {
      console.warn('Notification permission request failed:', error);
      return false;
    }
  },

  async scheduleAll(): Promise<void> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return;

      const scheduler = getNotifications();
      if (!scheduler) return;
      await ensureAndroidChannel(scheduler);

      await this.cancelAll();

      const config = (await settingsRepository?.getNotificationConfig?.()) ?? {};
      if (!config?.enabled) return;

      const notifications = this.generateNotifications(config ?? {});

      for (const notif of (notifications ?? [])) {
        if (!notif?.title || !notif?.trigger) continue;
        const mod = getNotifications();
        if (!mod) return;
        await mod.scheduleNotificationAsync({
          content: {
            title: notif.title ?? '',
            body: notif.body ?? '',
            data: { category: notif.category ?? 'general' },
          },
          trigger: notif.trigger,
        });
      }

      await this.syncHabitReminders();
    } catch (error) {
      console.warn('Failed to schedule notifications:', error);
    }
  },

  generateNotifications(config: any): ScheduledNotification[] {
    try {
      if (!config) return [];
      const mod = getNotifications();
      if (!mod) return [];
      const notifications: ScheduledNotification[] = [];

      const categories: { key: NotificationCategory; label: string; cat: string }[] = [
        { key: 'morningCheckIn', label: 'Morning Check-In', cat: 'morning' },
        { key: 'journalReminder', label: 'Journal Reminder', cat: 'journal' },
        { key: 'habitReminder', label: 'Habit Reminder', cat: 'habit' },
        { key: 'eveningReflection', label: 'Evening Reflection', cat: 'journal' },
        { key: 'sleepRoutine', label: 'Sleep Routine', cat: 'calm' },
        { key: 'weeklyReflection', label: 'Weekly Reflection', cat: 'general' },
      ];

      (categories ?? []).forEach(({ key, label, cat }) => {
        try {
          if (!config?.categories?.[key]) return;
          const timeStr = config?.times?.[key];
          if (!timeStr) return;

          const [hoursRaw, minutesRaw] = (timeStr?.split?.(':') ?? []).map(Number);
          const hours = Number.isFinite(hoursRaw) ? hoursRaw : 8;
          const minutes = Number.isFinite(minutesRaw) ? minutesRaw : 0;

          notifications.push({
            id: `${key ?? 'general'}-daily`,
            category: key,
            title: `Time for ${label ?? key}`,
            body: getEncouragement((cat ?? 'general') as any) ?? '',
            trigger: {
              type: mod.SchedulableTriggerInputTypes.DAILY,
              hour: hours,
              minute: minutes,
              channelId: ANDROID_CHANNEL_ID,
            } as NotificationsTypes.DailyTriggerInput,
          });
        } catch (error) {
          console.warn(`Failed to generate notification for ${key}:`, error);
        }
      });

      return notifications ?? [];
    } catch (error) {
      console.warn('Failed to generate notifications:', error);
      return [];
    }
  },

  async cancelAll(): Promise<void> {
    try {
      const mod = getNotifications();
      if (!mod) return;
      await mod.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.warn('Failed to cancel notifications:', error);
    }
  },

  async cancelCategory(category: NotificationCategory): Promise<void> {
    try {
      const mod = getNotifications();
      if (!mod) return;
      const scheduled = (await mod.getAllScheduledNotificationsAsync()) ?? [];
      const toCancel = (scheduled ?? [])
        .filter(n => n?.content?.data?.category === category)
        .map(n => n?.identifier)
        .filter(Boolean);
      await Promise.all((toCancel ?? []).map(id => mod.cancelScheduledNotificationAsync(id)));
    } catch (error) {
      console.warn(`Failed to cancel ${category} notifications:`, error);
    }
  },

  async syncHabitReminders(): Promise<void> {
    try {
      const mod = getNotifications();
      if (!mod) return;

      await ensureAndroidChannel(mod);

      const scheduled = (await mod.getAllScheduledNotificationsAsync()) ?? [];
      const stale = (scheduled ?? []).filter(n => n?.content?.data?.kind === 'habit');
      await Promise.all((stale ?? []).map(n => mod.cancelScheduledNotificationAsync(n.identifier)));

      const config = (await settingsRepository?.getNotificationConfig?.()) ?? {};
      if (!config?.enabled || !config?.categories?.habitReminder) return;

      const status = await this.getPermissionStatus();
      if (status !== 'granted') return;

      let habits: any[] = [];
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { habitRepository } = require('../database/repositories/habitRepository');
        habits = (await habitRepository?.getAll?.(false)) ?? [];
      } catch {
        return;
      }

      for (const habit of (habits ?? [])) {
        if (!habit?.id) continue;
        const timeStr = habit?.reminderTime;
        if (!timeStr || typeof timeStr !== 'string') continue;
        const [hoursRaw, minutesRaw] = timeStr.split(':').map(Number);
        if (!Number.isFinite(hoursRaw) || !Number.isFinite(minutesRaw)) continue;
        try {
          await mod.scheduleNotificationAsync({
            identifier: `habit-reminder-${habit.id}`,
            content: {
              title: `${habit?.name ?? 'Your habit'} — gentle reminder`,
              body: `A small moment for “${habit?.name ?? 'your habit'}” whenever you're ready.`,
              data: { category: 'habitReminder', kind: 'habit', habitId: habit.id },
            },
            trigger: {
              type: mod.SchedulableTriggerInputTypes.DAILY,
              hour: hoursRaw,
              minute: minutesRaw,
              channelId: ANDROID_CHANNEL_ID,
            } as any,
          });
        } catch (error) {
          console.warn('Failed to schedule habit reminder:', error);
        }
      }
    } catch (error) {
      console.warn('Failed to sync habit reminders:', error);
    }
  },

  async scheduleTestNotification(category: NotificationCategory): Promise<boolean> {
    try {
      const mod = getNotifications();
      if (!mod) return false;

      const granted = await this.requestPermissions();
      if (!granted) return false;

      await ensureAndroidChannel(mod);

      const config = (await settingsRepository?.getNotificationConfig?.()) ?? {};
      const notifications = this.generateNotifications(config ?? {}) ?? [];
      const target = (notifications ?? []).find(n => n?.category === category);

      await mod.scheduleNotificationAsync({
        content: {
          title: target?.title ?? 'Calmly Reminder',
          body: target?.body ?? 'A gentle moment to check in with yourself.',
          data: { category: target?.category ?? category, test: true },
        },
        trigger: {
          type: mod.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 5,
          channelId: ANDROID_CHANNEL_ID,
        } as any,
      });
      return true;
    } catch (error) {
      console.warn('Failed to schedule test notification:', error);
      return false;
    }
  },

  async getScheduledCount(): Promise<number> {
    try {
      const mod = getNotifications();
      if (!mod) return 0;
      const scheduled = (await mod.getAllScheduledNotificationsAsync()) ?? [];
      return (scheduled ?? []).length ?? 0;
    } catch {
      return 0;
    }
  },
};

export function useNotifications() {
  const [permission, setPermission] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const [scheduledCount, setScheduledCount] = useState(0);

  useEffect(() => {
    checkPermission();
    loadScheduledCount();
  }, []);

  const checkPermission = async () => {
    try {
      const status = await notificationService.getPermissionStatus();
      setPermission(status);
    } catch {
      setPermission('undetermined');
    }
  };

  const loadScheduledCount = async () => {
    try {
      const count = (await notificationService?.getScheduledCount?.()) ?? 0;
      setScheduledCount(count ?? 0);
    } catch {
      setScheduledCount(0);
    }
  };

  const requestPermission = async () => {
    try {
      const granted = (await notificationService?.requestPermissions?.()) ?? false;
      await checkPermission();
      if (granted) {
        await notificationService?.scheduleAll?.();
        await loadScheduledCount();
      }
      return granted ?? false;
    } catch {
      return false;
    }
  };

  const rescheduleAll = async () => {
    try {
      await notificationService?.scheduleAll?.();
      await loadScheduledCount();
    } catch (error) {
      console.warn('Failed to reschedule notifications:', error);
    }
  };

  const toggleCategory = async (category: NotificationCategory, enabled: boolean) => {
    try {
      await settingsRepository?.updateNotificationConfig?.({
        [(category === 'morningCheckIn' ? 'morningCheckInCat' :
          category === 'journalReminder' ? 'journalReminderCat' :
          category === 'habitReminder' ? 'habitReminderCat' :
          category === 'eveningReflection' ? 'eveningReflectionCat' :
          category === 'sleepRoutine' ? 'sleepRoutineCat' :
          'weeklyReflectionCat')]: enabled ?? false,
      } as any);
      if (enabled) {
        await notificationService?.scheduleAll?.();
      } else {
        await notificationService?.cancelCategory?.(category);
      }
      await loadScheduledCount();
    } catch (error) {
      console.warn('Failed to toggle notification category:', error);
    }
  };

  return {
    permission,
    scheduledCount,
    requestPermission,
    rescheduleAll,
    toggleCategory,
    scheduleTest: notificationService.scheduleTestNotification,
  };
}
