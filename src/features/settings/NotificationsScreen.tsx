import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Switch, Modal, Pressable, Linking } from 'react-native';
import { Alert } from '../../services/appAlert';
import { Ionicons } from '@expo/vector-icons';
import { AppText, ScreenHeader, TactilePressable } from '../../components';
import { settingsRepository } from '../../database/repositories/settingsRepository';
import { notificationService, NotificationCategory } from '../../services/notifications';
import { useAppTheme } from '../../theme/ThemeContext';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { PopIn } from '../../components/interactive/PopIn';
import { BrandedLoader } from '../../components/interactive/LoadingState';

const NOTIFICATION_CATEGORIES: {
  key: NotificationCategory;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: 'morningCheckIn', label: 'Morning check-in', description: 'A gentle prompt to start the day', icon: 'sunny-outline' },
  { key: 'journalReminder', label: 'Journal reminder', description: 'An evening nudge to reflect', icon: 'book-outline' },
  { key: 'habitReminder', label: 'Habit reminder', description: 'A quiet nudge for daily habits', icon: 'checkmark-circle-outline' },
  { key: 'eveningReflection', label: 'Evening reflection', description: 'Wind down with a short pause', icon: 'moon-outline' },
  { key: 'sleepRoutine', label: 'Sleep routine', description: 'Prepare the body for rest', icon: 'bed-outline' },
  { key: 'weeklyReflection', label: 'Weekly reflection', description: 'A Sunday note on your progress', icon: 'calendar-outline' },
];

const REMINDER_TIMES = ['06:00', '07:00', '08:00', '09:00', '12:00', '17:00', '18:00', '20:00', '21:00', '22:00'];

/**
 * Notifications — one master switch, then one row per reminder.
 *
 * Each row is a name, a short reason, a time and a switch. Times open in a
 * small sheet. Nothing shouts.
 */
export function NotificationsScreen() {
  const { colors } = useAppTheme();
  const [masterEnabled, setMasterEnabled] = useState(false);
  const [categories, setCategories] = useState<Record<NotificationCategory, boolean>>({} as any);
  const [times, setTimes] = useState<Record<NotificationCategory, string>>({} as any);
  const [loading, setLoading] = useState(true);
  const [permission, setPermission] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const [timePickerFor, setTimePickerFor] = useState<NotificationCategory | null>(null);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const status = await notificationService.getPermissionStatus();
      setPermission(status ?? 'undetermined');

      const config = (await settingsRepository?.getNotificationConfig?.()) ?? {};
      setMasterEnabled(config?.enabled ?? false);

      NOTIFICATION_CATEGORIES.forEach((cat) => {
        setCategories((prev) => ({ ...(prev ?? {}), [cat?.key]: config?.categories?.[cat?.key] ?? false }));
        setTimes((prev) => ({ ...(prev ?? {}), [cat?.key]: config?.times?.[cat?.key] ?? '08:00' }));
      });
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleMasterToggle = async (enabled: boolean) => {
    try {
      if (enabled && !notificationService.isAvailable()) {
        setMasterEnabled(false);
        Alert.alert(
          'Not available in this build',
          'Scheduled reminders need native notifications support. Use a development build to receive reminders on this device.'
        );
        return;
      }
      if (enabled && permission !== 'granted') {
        const granted = await notificationService.requestPermissions();
        if (!granted) {
          setMasterEnabled(false);
          Alert.alert(
            'Permission needed',
            'Calmly needs notification permission to send gentle reminders. You can enable it from your device settings.',
            [
              { text: 'Not now', style: 'cancel' },
              { text: 'Open settings', onPress: () => { Linking.openSettings?.(); } },
            ]
          );
          return;
        }
        setPermission('granted');
      }
      setMasterEnabled(enabled ?? false);
      await settingsRepository?.updateNotificationConfig?.({ enabled: enabled ?? false });
      if (enabled) {
        await notificationService?.scheduleAll?.();
      } else {
        await notificationService?.cancelAll?.();
      }
    } catch (error) {
      console.error('Failed to toggle master:', error);
      setMasterEnabled(!enabled);
    }
  };

  const handleCategoryToggle = async (category: NotificationCategory, enabled: boolean) => {
    try {
      setCategories((prev) => ({ ...prev, [category]: enabled }));
      await settingsRepository.updateNotificationConfig({
        [category === 'morningCheckIn'
          ? 'morningCheckInCat'
          : category === 'journalReminder'
          ? 'journalReminderCat'
          : category === 'habitReminder'
          ? 'habitReminderCat'
          : category === 'eveningReflection'
          ? 'eveningReflectionCat'
          : category === 'sleepRoutine'
          ? 'sleepRoutineCat'
          : 'weeklyReflectionCat']: enabled,
      });
      if (enabled && masterEnabled) {
        await notificationService.scheduleAll();
      } else {
        await notificationService.cancelCategory(category);
      }
    } catch (error) {
      console.error('Failed to toggle category:', error);
      setCategories((prev) => ({ ...prev, [category]: !enabled }));
    }
  };

  const handleTimeSelect = async (time: string) => {
    const category = timePickerFor;
    setTimePickerFor(null);
    if (!category) return;
    try {
      setTimes((prev) => ({ ...(prev ?? {}), [category]: time }));
      await settingsRepository.updateNotificationConfig({ [category]: time });
      if (masterEnabled && permission === 'granted') {
        await notificationService.scheduleAll();
      }
    } catch (error) {
      console.error('Failed to update reminder time:', error);
    }
  };

  const handleTestNotification = async (category: NotificationCategory) => {
    if (!masterEnabled) {
      Alert.alert('Reminders are off', 'Turn on reminders first, then try the test again.');
      return;
    }
    const scheduled = await notificationService.scheduleTestNotification(category);
    if (scheduled) {
      Alert.alert('Test scheduled', 'You will receive a reminder in a few seconds.');
    } else {
      Alert.alert(
        'Could not schedule the test',
        'Notifications are unavailable or the system permission is off. You can enable it from your device settings.',
        [
          { text: 'OK', style: 'cancel' },
          { text: 'Open settings', onPress: () => { Linking.openSettings?.(); } },
        ]
      );
    }
  };

  if (loading) {
    return (
      <ScreenContainer contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center' }}>
        <BrandedLoader label="Loading reminders" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <ScreenHeader title="Reminders" />

      <PopIn index={0}>
        <View style={[styles.masterRow, { backgroundColor: colors.surface.selected }]}>
          <View style={{ flex: 1 }}>
            <AppText variant="bodyLarge">All reminders</AppText>
            <AppText variant="caption" tone="secondary" style={{ marginTop: 2 }}>
              {!notificationService.isAvailable()
                ? 'Requires a development build'
                : permission === 'granted'
                ? 'Master switch for every reminder'
                : 'Turn on to allow system notifications'}
            </AppText>
          </View>
          <Switch
            value={masterEnabled}
            onValueChange={handleMasterToggle}
            thumbColor={colors.primary.foreground}
            trackColor={{ false: colors.border.strong, true: colors.primary.default }}
          />
        </View>
      </PopIn>

      <PopIn index={1}>
        <View style={{ marginTop: 32 }}>
          <AppText variant="overline" tone="tertiary">
            Reminders
          </AppText>
          <AppText variant="bodySmall" tone="secondary" style={{ marginTop: 4 }}>
            Invitations, not obligations.
          </AppText>

          {(NOTIFICATION_CATEGORIES ?? []).map((cat, idx) => (
            <View
              key={cat.key}
              style={[
                styles.categoryItem,
                {
                  borderTopColor: colors.border.default,
                  borderTopWidth: idx === 0 ? 0 : 1,
                  opacity: masterEnabled ? 1 : 0.55,
                },
              ]}
            >
              <Ionicons name={cat.icon} size={19} color={colors.text.secondary} style={{ marginTop: 3 }} />
              <View style={{ flex: 1 }}>
                <AppText variant="body" tone="primary">
                  {cat.label}
                </AppText>
                <AppText variant="caption" tone="tertiary" style={{ marginTop: 2 }}>
                  {cat.description}
                </AppText>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 8 }}>
                  <TactilePressable
                    onPress={() => setTimePickerFor(cat.key)}
                    hapticStyle="selection"
                    accessibilityRole="button"
                    accessibilityLabel={`Change time for ${cat.label}`}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}
                  >
                    <Ionicons name="time-outline" size={13} color={colors.primary.default} />
                    <AppText variant="caption" tone="link">
                      {(times ?? {})[cat.key] ?? '08:00'}
                    </AppText>
                  </TactilePressable>
                  <TactilePressable
                    onPress={() => handleTestNotification(cat.key)}
                    accessibilityRole="button"
                    accessibilityLabel={`Send a test for ${cat.label}`}
                    disabled={!masterEnabled}
                  >
                    <AppText variant="caption" tone="tertiary">
                      Send a test
                    </AppText>
                  </TactilePressable>
                </View>
              </View>
              <Switch
                value={!!(categories ?? {})[cat.key] && masterEnabled}
                onValueChange={(enabled) => handleCategoryToggle(cat.key, enabled)}
                thumbColor={colors.primary.foreground}
                trackColor={{ false: colors.border.strong, true: colors.primary.default }}
                disabled={!masterEnabled}
              />
            </View>
          ))}
        </View>
      </PopIn>

      <PopIn index={2}>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 32, alignItems: 'flex-start' }}>
          <Ionicons name="information-circle-outline" size={17} color={colors.text.tertiary} style={{ marginTop: 1 }} />
          <AppText variant="caption" tone="tertiary" style={{ flex: 1, lineHeight: 18 }}>
            Every message uses gentle language. No streak warnings and no guilt.
          </AppText>
        </View>
      </PopIn>

      <Modal
        visible={timePickerFor !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setTimePickerFor(null)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay.scrim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setTimePickerFor(null)} />
          <View style={[styles.timePickerContainer, { backgroundColor: colors.surface.default }]}>
            <AppText variant="h3" center>
              Reminder time
            </AppText>
            <View style={styles.timeGrid}>
              {REMINDER_TIMES.map((t) => {
                const selected = timePickerFor ? (times ?? {})[timePickerFor] === t : false;
                return (
                  <TactilePressable
                    key={t}
                    onPress={() => handleTimeSelect(t)}
                    hapticStyle="selection"
                    accessibilityRole="button"
                    accessibilityLabel={`Set reminder for ${t}`}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 9,
                      borderRadius: 12,
                      backgroundColor: selected ? colors.primary.default : colors.surface.muted,
                    }}
                  >
                    <AppText variant="label" tone={selected ? 'onPrimary' : 'secondary'}>
                      {t}
                    </AppText>
                  </TactilePressable>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 56 },
  masterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 18,
    borderRadius: 20,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 16,
  },
  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  timePickerContainer: {
    width: '100%',
    borderRadius: 28,
    padding: 22,
    gap: 18,
  },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
});
