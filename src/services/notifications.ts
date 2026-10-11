import { useState, useEffect } from 'react';
import type * as NotificationsTypes from 'expo-notifications';
import { Platform } from 'react-native';
import { settingsRepository } from '../database/repositories/settingsRepository';
import { getEncouragement } from '../utils/encouragement';

// expo-notifications cannot be statically imported on Android Expo Go.
// Its index pulls in DevicePushTokenAutoRegistration.fx, which calls
// addPushTokenListener -> warnOfExpoGoPushUsage() at module scope and throws
// "removed from Expo Go with SDK 53" (Expo SDK v57: remote push requires a
// development build; local notifications remain available in Expo Go).
// So we lazy-require inside try/catch and fall back to a disabled stub.
type NotificationsModule = typeof NotificationsTypes;

let cached: NotificationsModule | null | undefined;

function getNotifications(): NotificationsModule | null {
  if (cached !== undefined) return cached;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('expo-notifications') as NotificationsModule;
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
      console.warn('Notifications handler setup failed (notifications disabled):', error);
    }
    cached = mod;
  } catch (error) {
    console.warn('Notifications unavailable (Expo Go or missing native build, disabled):', error);
    cached = null;
  }
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

  async scheduleTestNotification(category: NotificationCategory): Promise<void> {
    try {
      const config = (await settingsRepository?.getNotificationConfig?.()) ?? {};
      if (!config?.enabled) return;

      const notifications = this.generateNotifications(config ?? {}) ?? [];
      const target = (notifications ?? []).find(n => n?.category === category);

      if (target) {
        const mod = getNotifications();
        if (!mod) return;
        await mod.scheduleNotificationAsync({
          content: {
            title: target?.title ?? '',
            body: target?.body ?? '',
            data: { category: target?.category ?? category, test: true },
          },
          trigger: { type: mod.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5 } as any,
        });
      }
    } catch (error) {
      console.warn('Failed to schedule test notification:', error);
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
