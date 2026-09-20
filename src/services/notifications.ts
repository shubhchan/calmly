import { useState, useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { settingsRepository } from '../database/repositories/settingsRepository';
import { getEncouragement } from '../utils/encouragement';

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
  trigger: Notifications.NotificationTriggerInput;
}

// setNotificationHandler touches native code at import time. On web (or a build
// without the notifications native module) it throws, which used to
// grey-screen the app before first paint. Guard it.
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch (error) {
  console.warn('Notifications handler setup failed (notifications disabled):', error);
}

export const notificationService = {
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') return false;

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
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

      const config = await settingsRepository.getNotificationConfig();
      if (!config.enabled) return;

      const notifications = this.generateNotifications(config);

      for (const notif of notifications) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: notif.title,
            body: notif.body,
            data: { category: notif.category },
          },
          trigger: notif.trigger,
        });
      }
    } catch (error) {
      console.warn('Failed to schedule notifications:', error);
    }
  },

  generateNotifications(config: any): ScheduledNotification[] {
    const notifications: ScheduledNotification[] = [];

    const categories: { key: NotificationCategory; label: string; cat: string }[] = [
      { key: 'morningCheckIn', label: 'Morning Check-In', cat: 'morning' },
      { key: 'journalReminder', label: 'Journal Reminder', cat: 'journal' },
      { key: 'habitReminder', label: 'Habit Reminder', cat: 'habit' },
      { key: 'eveningReflection', label: 'Evening Reflection', cat: 'journal' },
      { key: 'sleepRoutine', label: 'Sleep Routine', cat: 'calm' },
      { key: 'weeklyReflection', label: 'Weekly Reflection', cat: 'general' },
    ];

    categories.forEach(({ key, label, cat }) => {
      try {
        if (!config.categories[key]) return;
        if (!config.times[key]) return;

        const [hours, minutes] = config.times[key].split(':').map(Number);

        notifications.push({
          id: `${key}-daily`,
          category: key,
          title: `Time for ${label} 🌿`,
          body: getEncouragement(cat as any),
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: hours,
            minute: minutes,
          } as Notifications.DailyTriggerInput,
        });
      } catch (error) {
        console.warn(`Failed to generate notification for ${key}:`, error);
      }
    });

    return notifications;
  },

  async cancelAll(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.warn('Failed to cancel notifications:', error);
    }
  },

  async cancelCategory(category: NotificationCategory): Promise<void> {
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const toCancel = scheduled
        .filter(n => n.content.data?.category === category)
        .map(n => n.identifier);
      await Promise.all(toCancel.map(id => Notifications.cancelScheduledNotificationAsync(id)));
    } catch (error) {
      console.warn(`Failed to cancel ${category} notifications:`, error);
    }
  },

  async scheduleTestNotification(category: NotificationCategory): Promise<void> {
    try {
      const config = await settingsRepository.getNotificationConfig();
      if (!config.enabled) return;

      const notifications = this.generateNotifications(config);
      const target = notifications.find(n => n.category === category);

      if (target) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: target.title,
            body: target.body,
            data: { category: target.category, test: true },
          },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5 } as any,
        });
      }
    } catch (error) {
      console.warn('Failed to schedule test notification:', error);
    }
  },

  async getScheduledCount(): Promise<number> {
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      return scheduled.length;
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
      const { status } = await Notifications.getPermissionsAsync();
      setPermission(status);
    } catch {
      setPermission('undetermined');
    }
  };

  const loadScheduledCount = async () => {
    const count = await notificationService.getScheduledCount();
    setScheduledCount(count);
  };

  const requestPermission = async () => {
    const granted = await notificationService.requestPermissions();
    await checkPermission();
    if (granted) {
      await notificationService.scheduleAll();
      await loadScheduledCount();
    }
    return granted;
  };

  const rescheduleAll = async () => {
    await notificationService.scheduleAll();
    await loadScheduledCount();
  };

  const toggleCategory = async (category: NotificationCategory, enabled: boolean) => {
    await settingsRepository.updateNotificationConfig({
      [(category === 'morningCheckIn' ? 'morningCheckInCat' :
        category === 'journalReminder' ? 'journalReminderCat' :
        category === 'habitReminder' ? 'habitReminderCat' :
        category === 'eveningReflection' ? 'eveningReflectionCat' :
        category === 'sleepRoutine' ? 'sleepRoutineCat' :
        'weeklyReflectionCat')]: enabled,
    } as any);
    if (enabled) {
      await notificationService.scheduleAll();
    } else {
      await notificationService.cancelCategory(category);
    }
    await loadScheduledCount();
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
