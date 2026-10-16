import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/Card';
import { settingsRepository } from '../../database/repositories/settingsRepository';
import { notificationService, NotificationCategory } from '../../services/notifications';
import { useThemeColors } from '../../theme/ThemeContext';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { PopIn } from '../../components/interactive/PopIn';
import { BrandedLoader } from '../../components/interactive/LoadingState';
import { resolveTint } from '../../theme/tints';

type NavigationProp = NativeStackScreenProps<RootStackParamList, 'Notifications'>['navigation'];

const NOTIFICATION_CATEGORIES: { key: NotificationCategory; label: string; description: string; icon: any; color: string }[] = [
  { key: 'morningCheckIn', label: 'Morning Check-In', description: 'A gentle prompt to start your day mindfully', icon: 'sunny-outline', color: '#EB876D' },
  { key: 'journalReminder', label: 'Journal Reminder', description: 'Evening nudge to reflect on your day', icon: 'book-outline', color: '#877FC5' },
  { key: 'habitReminder', label: 'Habit Reminder', description: 'Friendly encouragement for your daily habits', icon: 'checkmark-circle-outline', color: '#5A955A' },
  { key: 'eveningReflection', label: 'Evening Reflection', description: 'Wind down with a brief mindful reflection', icon: 'moon-outline', color: '#6B9BCD' },
  { key: 'sleepRoutine', label: 'Sleep Routine', description: 'Prepare body and mind for restful sleep', icon: 'bed-outline', color: '#877FC5' },
  { key: 'weeklyReflection', label: 'Weekly Reflection', description: 'Sunday celebration of your progress', icon: 'calendar-outline', color: '#EB876D' },
];

export function NotificationsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const colors = useThemeColors();
  const [masterEnabled, setMasterEnabled] = useState(false);
  const [categories, setCategories] = useState<Record<NotificationCategory, boolean>>({} as any);
  const [times, setTimes] = useState<Record<NotificationCategory, string>>({} as any);
  const [loading, setLoading] = useState(true);
  const [permission, setPermission] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const skyTint = resolveTint(!!colors.isDark, 'sky');

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
      setMasterEnabled(enabled ?? false);
      await settingsRepository?.updateNotificationConfig?.({ enabled: enabled ?? false });
      if (enabled) {
        await notificationService?.scheduleAll?.();
      } else {
        await notificationService?.cancelAll?.();
      }
    } catch (error) {
      console.error('Failed to toggle master:', error);
    }
  };

  const handleCategoryToggle = async (category: NotificationCategory, enabled: boolean) => {
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
  };

  const handleTestNotification = async (category: NotificationCategory) => {
    await notificationService.scheduleTestNotification(category);
    Alert.alert('Test Scheduled', 'You will receive a notification in a few seconds!');
  };

  if (loading) {
    return (
      <ScreenContainer scroll={false} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <BrandedLoader label="Loading reminders" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => (navigation as any)?.goBack?.()}
          style={[styles.backButton, { backgroundColor: colors.bgCard, borderColor: colors.borderLight }]}
          hitSlop={10}
        >
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Mindful Reminders</Text>
        <View style={{ width: 40 }} />
      </View>

      <PopIn index={0}>
        <Card tone="sky" style={styles.card}>
          <View style={styles.masterRow}>
            <View style={styles.masterInfo}>
              <Text style={[styles.masterLabel, { color: skyTint.text }]}>All Reminders</Text>
              <Text style={[styles.masterDesc, { color: skyTint.muted }]}>Master toggle for notifications</Text>
            </View>
            <Switch
              value={masterEnabled}
              onValueChange={handleMasterToggle}
              thumbColor="#FFFFFF"
              trackColor={{ false: skyTint.border, true: skyTint.accent }}
              disabled={permission !== 'granted'}
            />
          </View>
        </Card>
      </PopIn>

      <PopIn index={1}>
        <Card style={styles.card}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Categories</Text>
        <Text style={[styles.sectionDesc, { color: colors.textSecondary }]}>
          Invitational, non-guilt prompts calibrated for mindful presence.
        </Text>
        {(NOTIFICATION_CATEGORIES ?? []).map((cat, idx) => (
          <View
            key={cat.key}
            style={[
              styles.categoryItem,
              { borderBottomColor: colors.borderLight },
              idx === NOTIFICATION_CATEGORIES.length - 1 && { borderBottomWidth: 0 },
            ]}
          >
            <View style={[styles.categoryIcon, { backgroundColor: cat.color + '18' }]}>
              <Ionicons name={cat.icon} size={22} color={cat.color} />
            </View>
            <View style={styles.categoryInfo}>
              <Text style={[styles.categoryLabel, { color: colors.textPrimary }]}>{cat.label}</Text>
              <Text style={[styles.categoryDesc, { color: colors.textTertiary }]}>{cat.description}</Text>
            </View>
            <View style={styles.categoryControls}>
              <TouchableOpacity
                onPress={() => handleTestNotification(cat.key)}
                style={[styles.testButton, { backgroundColor: colors.bgCard, borderColor: colors.borderLight }]}
              >
                <Text style={[styles.testButtonText, { color: colors.accentPrimary }]}>Test</Text>
              </TouchableOpacity>
              <Switch
                value={(categories ?? {})[cat.key] && masterEnabled}
                onValueChange={(enabled) => handleCategoryToggle(cat.key, enabled)}
                thumbColor="#FFFFFF"
                trackColor={{ false: colors.borderLight, true: colors.accentPrimary }}
                disabled={!masterEnabled || permission !== 'granted'}
              />
            </View>
          </View>
        ))}
        </Card>
      </PopIn>

      <PopIn index={2}>
        <Card variant="outlined" style={[styles.noteCard, { backgroundColor: colors.accentPrimary + '10', borderColor: colors.accentPrimary + '30' }]}>
          <View style={styles.noteContent}>
            <Ionicons name="information-circle-outline" size={20} color={colors.accentPrimary} />
            <Text style={[styles.noteText, { color: colors.textSecondary }]}>
              All notification messages use gentle, encouraging language. No aggressive streak warnings or guilt prompts.
            </Text>
          </View>
        </Card>
      </PopIn>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 60, gap: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },
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
});