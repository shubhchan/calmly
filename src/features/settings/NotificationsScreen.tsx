import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, Switch, Modal, Pressable, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/Card';
import { ScreenHeader, TactilePressable } from '../../components';
import { settingsRepository } from '../../database/repositories/settingsRepository';
import { notificationService, NotificationCategory } from '../../services/notifications';
import { useAppTheme } from '../../theme/ThemeContext';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { PopIn } from '../../components/interactive/PopIn';
import { BrandedLoader } from '../../components/interactive/LoadingState';
import { resolveTint } from '../../theme/tints';

const NOTIFICATION_CATEGORIES: { key: NotificationCategory; label: string; description: string; icon: any; color: string }[] = [
  { key: 'morningCheckIn', label: 'Morning Check-In', description: 'A gentle prompt to start your day mindfully', icon: 'sunny-outline', color: '#EB876D' },
  { key: 'journalReminder', label: 'Journal Reminder', description: 'Evening nudge to reflect on your day', icon: 'book-outline', color: '#877FC5' },
  { key: 'habitReminder', label: 'Habit Reminder', description: 'Friendly encouragement for your daily habits', icon: 'checkmark-circle-outline', color: '#5A955A' },
  { key: 'eveningReflection', label: 'Evening Reflection', description: 'Wind down with a brief mindful reflection', icon: 'moon-outline', color: '#6B9BCD' },
  { key: 'sleepRoutine', label: 'Sleep Routine', description: 'Prepare body and mind for restful sleep', icon: 'bed-outline', color: '#877FC5' },
  { key: 'weeklyReflection', label: 'Weekly Reflection', description: 'Sunday celebration of your progress', icon: 'calendar-outline', color: '#EB876D' },
];

const REMINDER_TIMES = ['06:00', '07:00', '08:00', '09:00', '12:00', '17:00', '18:00', '20:00', '21:00', '22:00'];

export function NotificationsScreen() {
  const { colors, isDark } = useAppTheme();
  const [masterEnabled, setMasterEnabled] = useState(false);
  const [categories, setCategories] = useState<Record<NotificationCategory, boolean>>({} as any);
  const [times, setTimes] = useState<Record<NotificationCategory, string>>({} as any);
  const [loading, setLoading] = useState(true);
  const [permission, setPermission] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const [timePickerFor, setTimePickerFor] = useState<NotificationCategory | null>(null);
  const skyTint = resolveTint(!!isDark, 'sky');

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
          'Not Available in This Build',
          'Scheduled reminders need native notifications support. Use a development build to receive reminders on this device.'
        );
        return;
      }
      if (enabled && permission !== 'granted') {
        const granted = await notificationService.requestPermissions();
        if (!granted) {
          setMasterEnabled(false);
          Alert.alert(
            'Permission Needed',
            'Calmly needs notification permission to send gentle reminders. You can enable it from your device settings.',
            [
              { text: 'Not Now', style: 'cancel' },
              { text: 'Open Settings', onPress: () => { Linking.openSettings?.(); } },
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
      Alert.alert('Reminders Are Off', 'Turn on "All Reminders" first, then try the test again.');
      return;
    }
    const scheduled = await notificationService.scheduleTestNotification(category);
    if (scheduled) {
      Alert.alert('Test Scheduled', 'You will receive a reminder in a few seconds.');
    } else {
      Alert.alert(
        "Couldn't Schedule Test",
        'Notifications are unavailable or the system permission is off. You can enable it from your device settings.',
        [
          { text: 'OK', style: 'cancel' },
          { text: 'Open Settings', onPress: () => { Linking.openSettings?.(); } },
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
      <ScreenHeader title="Mindful Reminders" />

      <PopIn index={0}>
        <Card tone="sky" style={styles.card}>
          <View style={styles.masterRow}>
            <View style={styles.masterInfo}>
              <Text style={[styles.masterLabel, { color: skyTint.text }]}>All Reminders</Text>
              <Text style={[styles.masterDesc, { color: skyTint.muted }]}>
                {!notificationService.isAvailable()
                  ? 'Reminders require a development build in this environment'
                  : permission === 'granted'
                  ? 'Master toggle for notifications'
                  : 'Turn on to allow system notifications'}
              </Text>
            </View>
            <Switch
              value={masterEnabled}
              onValueChange={handleMasterToggle}
              thumbColor="#FFFFFF"
              trackColor={{ false: skyTint.border, true: skyTint.accent }}
            />
          </View>
        </Card>
      </PopIn>

      <PopIn index={1}>
        <Card style={styles.card}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Categories</Text>
        <Text style={[styles.sectionDesc, { color: colors.text.secondary }]}>
          Invitational, non-guilt prompts calibrated for mindful presence.
        </Text>
        {(NOTIFICATION_CATEGORIES ?? []).map((cat, idx) => (
          <View
            key={cat.key}
            style={[
              styles.categoryItem,
              { borderBottomColor: colors.border.default },
              idx === NOTIFICATION_CATEGORIES.length - 1 && { borderBottomWidth: 0 },
            ]}
          >
            <View style={[styles.categoryIcon, { backgroundColor: cat.color + '18' }]}>
              <Ionicons name={cat.icon} size={22} color={cat.color} />
            </View>
            <View style={styles.categoryInfo}>
              <Text style={[styles.categoryLabel, { color: colors.text.primary }]}>{cat.label}</Text>
              <Text style={[styles.categoryDesc, { color: colors.text.tertiary }]}>{cat.description}</Text>
              <TactilePressable
                onPress={() => setTimePickerFor(cat.key)}
                hapticStyle="selection"
                style={[styles.timeChip, { backgroundColor: colors.background.secondary, borderColor: colors.border.default }]}
              >
                <Ionicons name="time-outline" size={13} color={colors.text.secondary} />
                <Text style={[styles.timeChipText, { color: colors.text.secondary }]}>
                  {(times ?? {})[cat.key] ?? '08:00'}
                </Text>
              </TactilePressable>
            </View>
            <View style={styles.categoryControls}>
              <TactilePressable
                onPress={() => handleTestNotification(cat.key)}
                style={[styles.testButton, { backgroundColor: colors.surface.default, borderColor: colors.border.default }]}
              >
                <Text style={[styles.testButtonText, { color: colors.primary.default }]}>Test</Text>
              </TactilePressable>
              <Switch
                value={(categories ?? {})[cat.key] && masterEnabled}
                onValueChange={(enabled) => handleCategoryToggle(cat.key, enabled)}
                thumbColor="#FFFFFF"
                trackColor={{ false: colors.border.default, true: colors.primary.default }}
                disabled={!masterEnabled}
              />
            </View>
          </View>
        ))}
        </Card>
      </PopIn>

      <PopIn index={2}>
        <Card variant="outlined" style={[styles.noteCard, { backgroundColor: colors.primary.default + '10', borderColor: colors.primary.default + '30' }]}>
          <View style={styles.noteContent}>
            <Ionicons name="information-circle-outline" size={20} color={colors.primary.default} />
            <Text style={[styles.noteText, { color: colors.text.secondary }]}>
              All notification messages use gentle, encouraging language. No aggressive streak warnings or guilt prompts.
            </Text>
          </View>
        </Card>
      </PopIn>

      <Modal
        visible={timePickerFor !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setTimePickerFor(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setTimePickerFor(null)} />
          <View style={[styles.timePickerContainer, { backgroundColor: colors.surface.default, borderColor: colors.border.default }]}>
            <Text style={[styles.pickerTitle, { color: colors.text.primary }]}>Reminder Time</Text>
            <View style={styles.timeGrid}>
              {REMINDER_TIMES.map((t) => {
                const selected = timePickerFor ? (times ?? {})[timePickerFor] === t : false;
                return (
                  <TactilePressable
                    key={t}
                    onPress={() => handleTimeSelect(t)}
                    hapticStyle="selection"
                    style={[
                      styles.timeButton,
                      { backgroundColor: colors.background.default, borderColor: colors.border.default },
                      selected && { backgroundColor: colors.primary.default, borderColor: colors.primary.default },
                    ]}
                  >
                    <Text
                      style={[
                        styles.timeButtonText,
                        { color: colors.text.primary },
                        selected && { color: '#FFFFFF', fontWeight: '700' },
                      ]}
                    >
                      {t}
                    </Text>
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
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 60, gap: 16 },
  card: { padding: 18, borderRadius: 20, gap: 12 },
  masterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  masterInfo: { flex: 1 },
  masterLabel: { fontSize: 16, fontWeight: '700' },
  masterDesc: { fontSize: 13, marginTop: 2 },
  sectionTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.2 },
  sectionDesc: { fontSize: 14, lineHeight: 20, marginBottom: 8 },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  categoryIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  categoryInfo: { flex: 1, gap: 3 },
  categoryLabel: { fontSize: 15, fontWeight: '600' },
  categoryDesc: { fontSize: 12, lineHeight: 17 },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 4,
  },
  timeChipText: { fontSize: 12, fontWeight: '600' },
  categoryControls: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  testButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  testButtonText: { fontSize: 12, fontWeight: '600' },
  noteCard: { padding: 16, borderRadius: 16 },
  noteContent: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  noteText: { flex: 1, fontSize: 13, lineHeight: 18 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 20, 28, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  timePickerContainer: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  pickerTitle: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  timeButton: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1 },
  timeButtonText: { fontSize: 13, fontWeight: '600' },
});
