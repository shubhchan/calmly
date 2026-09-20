import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, Switch, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/Card';
import { PrimaryButton } from '../../components/PrimaryButton';
import { settingsRepository } from '../../database/repositories/settingsRepository';
import { notificationService, NotificationCategory } from '../../services/notifications';

type NavigationProp = NativeStackScreenProps<RootStackParamList, 'Notifications'>['navigation'];

const NOTIFICATION_CATEGORIES: { key: NotificationCategory; label: string; description: string; icon: string; color: string }[] = [
  { key: 'morningCheckIn', label: 'Morning Check-In', description: 'A gentle prompt to start your day mindfully', icon: 'sunny', color: '#F5C6A5' },
  { key: 'journalReminder', label: 'Journal Reminder', description: 'Evening nudge to reflect on your day', icon: 'book', color: '#877FC5' },
  { key: 'habitReminder', label: 'Habit Reminder', description: 'Friendly reminders for your daily habits', icon: 'checkbox', color: '#5A955A' },
  { key: 'eveningReflection', label: 'Evening Reflection', description: 'Wind down with a brief reflection', icon: 'moon', color: '#6B9BCD' },
  { key: 'sleepRoutine', label: 'Sleep Routine', description: 'Prepare for restful sleep', icon: 'bed', color: '#877FC5' },
  { key: 'weeklyReflection', label: 'Weekly Reflection', description: 'Sunday check-in on your progress', icon: 'calendar', color: '#EB876D' },
];

export function NotificationsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [masterEnabled, setMasterEnabled] = useState(false);
  const [categories, setCategories] = useState<Record<NotificationCategory, boolean>>({} as any);
  const [times, setTimes] = useState<Record<NotificationCategory, string>>({} as any);
  const [loading, setLoading] = useState(true);
  const [permission, setPermission] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const { status } = (await require('expo-notifications')?.getPermissionsAsync?.()) ?? {};
      setPermission(status ?? 'undetermined');
      
      const config = (await settingsRepository?.getNotificationConfig?.()) ?? {};
      setMasterEnabled(config?.enabled ?? false);
      
      NOTIFICATION_CATEGORIES.forEach(cat => {
        setCategories(prev => ({ ...(prev ?? {}), [cat?.key]: config?.categories?.[cat?.key] ?? false }));
        setTimes(prev => ({ ...(prev ?? {}), [cat?.key]: config?.times?.[cat?.key] ?? '08:00' }));
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
    setCategories(prev => ({ ...prev, [category]: enabled }));
    await settingsRepository.updateNotificationConfig({
      [category === 'morningCheckIn' ? 'morningCheckInCat' :
       category === 'journalReminder' ? 'journalReminderCat' :
       category === 'habitReminder' ? 'habitReminderCat' :
       category === 'eveningReflection' ? 'eveningReflectionCat' :
       category === 'sleepRoutine' ? 'sleepRoutineCat' :
       'weeklyReflectionCat']: enabled,
    });
    if (enabled && masterEnabled) {
      await notificationService.scheduleAll();
    } else {
      await notificationService.cancelCategory(category);
    }
  };

  const handleTimeChange = async (category: NotificationCategory, time: string) => {
    setTimes(prev => ({ ...prev, [category]: time }));
    await settingsRepository.updateNotificationConfig({
      [category]: time,
    });
    if (masterEnabled && categories[category]) {
      await notificationService.scheduleAll();
    }
  };

  const handleTestNotification = async (category: NotificationCategory) => {
    await notificationService.scheduleTestNotification(category);
    Alert.alert('Test Sent', 'Check your notifications in a few seconds!');
  };

  const handlePermissionPress = async () => {
    if (permission === 'denied') {
      Alert.alert(
        'Permission Required',
        'Please enable notifications in your device settings to receive reminders.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => require('expo-linking')?.openSettings?.() },
        ]
      );
    } else {
      await notificationService.requestPermissions();
      loadSettings();
    }
  };

  const renderTimePicker = (category: NotificationCategory) => (
    <TouchableOpacity
      onPress={() => {
        // `prompt()` is web-only and undefined on iOS/Android (ReferenceError in
        // release builds). Offer preset times via a native dialog instead.
        const current = (times ?? {})[category] ?? '08:00';
        const presets = ['07:00', '08:00', '09:00', '12:00', '18:00', '20:00', '21:00', '22:00'];
        Alert.alert(
          'Reminder time',
          `Current: ${current}. Pick a new time:`,
          [
            ...presets
              .filter((t) => t !== current)
              .slice(0, 4)
              .map((t) => ({
                text: t,
                onPress: () => handleTimeChange(category, t),
              })),
            { text: 'Cancel', style: 'cancel' },
          ]
        );
      }}
      style={styles.timeButton}
    >
      <Text style={styles.timeButtonText}>{(times ?? {})[category] ?? '--:--'}</Text>
      <Ionicons name="time" size={20} color="#425474" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#5A955A" style={{ marginTop: 100 }} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (navigation as any)?.goBack?.()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#1E232E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerSpacer} />
      </View>

      {permission !== 'granted' && (
        <Card variant="outlined" style={styles.permissionCard}>
          <View style={styles.permissionContent}>
            <Ionicons name="notifications-off" size={32} color="#EB876D" />
            <View style={styles.permissionText}>
              <Text style={styles.permissionTitle}>Notifications Disabled</Text>
              <Text style={styles.permissionDesc}>
                Enable notifications to receive gentle reminders and check-ins.
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={handlePermissionPress} style={styles.permissionButton}>
            <Text style={styles.permissionButtonText}>
              {permission === 'denied' ? 'Open Settings' : 'Enable Notifications'}
            </Text>
          </TouchableOpacity>
        </Card>
      )}

      <Card style={styles.card}>
        <View style={styles.masterRow}>
          <View style={styles.masterInfo}>
            <Text style={styles.masterLabel}>All Notifications</Text>
            <Text style={styles.masterDesc}>Master switch for all reminders</Text>
          </View>
          <Switch
            value={masterEnabled}
            onValueChange={handleMasterToggle}
            thumbColor={masterEnabled ? '#5A955A' : '#425474'}
            trackColor={{ false: '#E4DEBC', true: '#5A955A' }}
            disabled={permission !== 'granted'}
          />
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Reminder Categories</Text>
        <Text style={styles.sectionDesc}>
          Customize which reminders you receive and when. All copy is invitational, never guilt-based.
        </Text>
        {(NOTIFICATION_CATEGORIES ?? []).map((cat) => (
          <View key={cat?.key ?? Math.random().toString()} style={styles.categoryItem}>
            <View style={[styles.categoryIcon, { backgroundColor: (cat?.color ?? '#5A955A') + '20' }]}>
              <Ionicons name={(cat?.icon ?? 'notifications') as any} size={22} color={cat?.color ?? '#5A955A'} />
            </View>
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryLabel}>{cat?.label ?? ''}</Text>
              <Text style={styles.categoryDesc}>{cat?.description ?? ''}</Text>
            </View>
            <View style={styles.categoryControls}>
              <TouchableOpacity onPress={() => cat?.key && handleTestNotification(cat.key)} style={styles.testButton}>
                <Text style={styles.testButtonText}>Test</Text>
              </TouchableOpacity>
              {cat?.key ? renderTimePicker(cat.key) : null}
              <Switch
                value={(categories ?? {})[cat?.key] && masterEnabled}
                onValueChange={enabled => cat?.key && handleCategoryToggle(cat.key, enabled)}
                thumbColor={(categories ?? {})[cat?.key] ? '#5A955A' : '#425474'}
                trackColor={{ false: '#E4DEBC', true: '#5A955A' }}
                disabled={!masterEnabled || permission !== 'granted'}
              />
            </View>
          </View>
        ))}
      </Card>

      <Card variant="outlined" style={styles.noteCard}>
        <View style={styles.noteContent}>
          <Ionicons name="information-circle" size={20} color="#6B9BCD" />
          <Text style={styles.noteText}>
            All notifications use encouraging, non-guilt-based language. 
            Times use 24-hour format. Changes apply immediately.
          </Text>
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFBF7' },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '600', color: '#1E232E', textAlign: 'center' },
  headerSpacer: { width: 44 },
  permissionCard: { backgroundColor: 'rgba(235, 135, 109, 0.1)', borderColor: '#EB876D' },
  permissionContent: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  permissionText: { flex: 1, gap: 2 },
  permissionTitle: { fontSize: 16, fontWeight: '600', color: '#1E232E' },
  permissionDesc: { fontSize: 14, color: '#34415A' },
  permissionButton: { alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: '#EB876D' },
  permissionButtonText: { fontSize: 14, fontWeight: '600', color: 'white' },
  card: { marginBottom: 16, gap: 12 },
  masterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  masterInfo: { flex: 1 },
  masterLabel: { fontSize: 16, fontWeight: '600', color: '#1E232E' },
  masterDesc: { fontSize: 13, color: '#425474', marginTop: 2 },
  sectionTitle: { fontSize: 17, fontWeight: '600', color: '#1E232E', marginBottom: 4 },
  sectionDesc: { fontSize: 14, color: '#34415A', lineHeight: 20, marginBottom: 16 },
  categoryItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E4DEBC' },
  categoryIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  categoryInfo: { flex: 1, gap: 2 },
  categoryLabel: { fontSize: 16, fontWeight: '500', color: '#1E232E' },
  categoryDesc: { fontSize: 13, color: '#425474' },
  categoryControls: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  testButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E4DEBC' },
  testButtonText: { fontSize: 12, fontWeight: '600', color: '#5A955A' },
  timeButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E4DEBC' },
  timeButtonText: { fontSize: 14, fontWeight: '500', color: '#1E232E', fontFamily: 'monospace', minWidth: 60 },
  noteCard: { backgroundColor: 'rgba(107, 155, 205, 0.1)', borderColor: '#6B9BCD' },
  noteContent: { flexDirection: 'row', gap: 8 },
  noteText: { flex: 1, fontSize: 13, color: '#34415A', lineHeight: 18 },
});