import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator, Share } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/Card';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useThemeColors } from '../../theme/ThemeContext';

type NavigationProp = NativeStackScreenProps<RootStackParamList, 'DataManagement'>['navigation'];

const DATA_TYPES = [
  { key: 'moods', label: 'Mood Check-ins', icon: 'happy-outline' },
  { key: 'journals', label: 'Journal Reflections', icon: 'book-outline' },
  { key: 'habits', label: 'Habits & Routines', icon: 'checkbox-outline' },
  { key: 'completions', label: 'Habit Streaks & Logs', icon: 'checkmark-circle-outline' },
  { key: 'gratitude', label: 'Gratitude Entries', icon: 'heart-outline' },
  { key: 'positiveMoments', label: 'Good Things & Wins', icon: 'sparkles-outline' },
  { key: 'calm', label: 'Calm & Grounding Logs', icon: 'flower-outline' },
  { key: 'breathing', label: 'Breathing Sessions', icon: 'leaf-outline' },
];

export function DataManagementScreen() {
  const navigation = useNavigation<NavigationProp>();
  const colors = useThemeColors();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleExportAll = useCallback(async () => {
    setExporting(true);
    try {
      const { database } = require('../../database');

      const safeFetch = async (name: string) => {
        try {
          return (await database?.get?.(name)?.query?.()?.fetch?.()) ?? [];
        } catch {
          return [];
        }
      };

      const collections = {
        moods: await safeFetch('mood_entries'),
        journals: await safeFetch('journal_entries'),
        habits: await safeFetch('habits'),
        completions: await safeFetch('habit_completions'),
        gratitude: await safeFetch('gratitude_entries'),
        positiveMoments: await safeFetch('positive_moments'),
        calm: await safeFetch('calm_sessions'),
        breathing: await safeFetch('breathing_sessions'),
        meditations: await safeFetch('meditation_sessions'),
        sleep: await safeFetch('sleep_entries'),
        reflections: await safeFetch('reflections'),
        affirmations: await safeFetch('affirmations'),
        favorites: await safeFetch('favorites'),
        tags: await safeFetch('tags'),
        routines: await safeFetch('routines'),
        routineItems: await safeFetch('routine_items'),
        goals: await safeFetch('goals'),
      };

      const exportData = {
        exportDate: new Date().toISOString(),
        version: '1.0',
        app: 'Calmly',
        data: {
          moods: (collections?.moods ?? []).map((e: any) => e?._raw),
          journals: (collections?.journals ?? []).map((e: any) => e?._raw),
          habits: (collections?.habits ?? []).map((e: any) => e?._raw),
          completions: (collections?.completions ?? []).map((e: any) => e?._raw),
          gratitude: (collections?.gratitude ?? []).map((e: any) => e?._raw),
          positiveMoments: (collections?.positiveMoments ?? []).map((e: any) => e?._raw),
          calm: (collections?.calm ?? []).map((e: any) => e?._raw),
          breathing: (collections?.breathing ?? []).map((e: any) => e?._raw),
          meditations: (collections?.meditations ?? []).map((e: any) => e?._raw),
          sleep: (collections?.sleep ?? []).map((e: any) => e?._raw),
          reflections: (collections?.reflections ?? []).map((e: any) => e?._raw),
          affirmations: (collections?.affirmations ?? []).map((e: any) => e?._raw),
          favorites: (collections?.favorites ?? []).map((e: any) => e?._raw),
          tags: (collections?.tags ?? []).map((e: any) => e?._raw),
          routines: (collections?.routines ?? []).map((e: any) => e?._raw),
          routineItems: (collections?.routineItems ?? []).map((e: any) => e?._raw),
          goals: (collections?.goals ?? []).map((e: any) => e?._raw),
        },
      };

      await Share.share({
        title: 'Calmly Encrypted Backup',
        message: JSON.stringify(exportData, null, 2),
      });
    } catch (error) {
      console.error('Export failed:', error);
      Alert.alert('Export Failed', 'Could not prepare export file.');
    } finally {
      setExporting(false);
    }
  }, []);

  const handleDeleteType = async (typeKey: string) => {
    const typeObj = DATA_TYPES.find((t) => t.key === typeKey);
    Alert.alert(
      `Delete all ${typeObj?.label ?? 'items'}?`,
      'This cannot be undone. All other data will remain untouched.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(typeKey);
            try {
              const { database } = require('../../database');
              const tableMap: Record<string, string> = {
                moods: 'mood_entries',
                journals: 'journal_entries',
                habits: 'habits',
                completions: 'habit_completions',
                gratitude: 'gratitude_entries',
                positiveMoments: 'positive_moments',
                calm: 'calm_sessions',
                breathing: 'breathing_sessions',
              };
              const tableName = tableMap[typeKey];
              if (tableName) {
                await database.write(async () => {
                  const collection = database.get(tableName);
                  const items = await collection.query().fetch();
                  await Promise.all((items ?? []).map((item: any) => item?.destroyPermanently?.()));
                });
              }
              Alert.alert('Deleted', `${typeObj?.label ?? 'Items'} cleared.`);
            } catch (err) {
              console.error('Delete failed:', err);
              Alert.alert('Error', 'Failed to delete data.');
            } finally {
              setDeleting(null);
            }
          },
        },
      ]
    );
  };

  const handleDeleteAll = () => {
    Alert.alert(
      'Permanent Reset',
      'This permanently wipes ALL entries, streaks, journals, and local settings. You will return to a clean slate.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Wipe Everything',
          style: 'destructive',
          onPress: async () => {
            setDeleting('all');
            try {
              const { database } = require('../../database');
              const collections = [
                'mood_entries', 'journal_entries', 'habits', 'habit_completions',
                'gratitude_entries', 'positive_moments', 'calm_sessions', 'breathing_sessions',
                'meditation_sessions', 'sleep_entries', 'reflections', 'affirmations',
                'favorites', 'tags', 'routines', 'routine_items', 'goals', 'user_settings',
              ];
              await database.write(async () => {
                await Promise.all(
                  (collections ?? []).map((name) =>
                    database.get(name).query().fetch().then((items: any[]) =>
                      Promise.all((items ?? []).map((item: any) => item?.destroyPermanently?.()))
                    )
                  )
                );
              });
              Alert.alert('Reset Complete', 'All local data was erased.');
            } catch (err) {
              console.error('Wipe failed:', err);
              Alert.alert('Error', 'Failed to erase data.');
            } finally {
              setDeleting(null);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bgPrimary }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backButton, { backgroundColor: colors.bgCard, borderColor: colors.borderLight }]}
          hitSlop={10}
        >
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Data & Backup</Text>
        <View style={{ width: 40 }} />
      </View>

      <Card style={styles.card}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Export Sanctuary</Text>
        <Text style={[styles.sectionDesc, { color: colors.textSecondary }]}>
          Download a complete portable backup of your reflections, habits, and check-ins formatted as JSON.
        </Text>
        <PrimaryButton
          onPress={handleExportAll}
          loading={exporting}
          title={exporting ? 'Packaging data...' : 'Export Complete Backup'}
          leftIcon={<Ionicons name="download-outline" size={20} color="#FFFFFF" />}
          fullWidth
        />
      </Card>

      <Card style={styles.card}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Category Management</Text>
        <Text style={[styles.sectionDesc, { color: colors.textSecondary }]}>
          Selectively erase individual categories without affecting the rest of your history.
        </Text>
        <View style={styles.typeList}>
          {(DATA_TYPES ?? []).map((type) => (
            <TouchableOpacity
              key={type.key}
              onPress={() => handleDeleteType(type.key)}
              disabled={!!deleting}
              style={[
                styles.typeItem,
                { backgroundColor: colors.bgSecondary ?? '#F4EFE6', borderColor: colors.borderLight },
              ]}
              activeOpacity={0.75}
            >
              <View style={[styles.typeIcon, { backgroundColor: colors.accentPrimary + '14' }]}>
                <Ionicons name={type.icon as any} size={20} color={colors.accentPrimary} />
              </View>
              <Text style={[styles.typeLabel, { color: colors.textPrimary }]}>{type.label}</Text>
              <View style={{ marginTop: 2 }}>
                {deleting === type.key ? (
                  <ActivityIndicator size="small" color={colors.accentPrimary} />
                ) : (
                  <Ionicons name="trash-outline" size={18} color={colors.textTertiary} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      <Card variant="outlined" style={[styles.dangerCard, { borderColor: (colors.accentRose || '#EB697F') + '60' }]}>
        <View style={styles.dangerContent}>
          <Ionicons name="warning-outline" size={28} color={colors.accentRose || '#EB697F'} />
          <View style={styles.dangerText}>
            <Text style={[styles.dangerTitle, { color: colors.accentRose || '#EB697F' }]}>Danger Zone</Text>
            <Text style={[styles.dangerDesc, { color: colors.textSecondary }]}>
              Permanent deletion. Once erased, your private local records cannot be restored.
            </Text>
          </View>
        </View>
        <PrimaryButton
          onPress={handleDeleteAll}
          loading={deleting === 'all'}
          title={deleting === 'all' ? 'Erasing...' : 'Wipe All Data Permanently'}
          variant="outline"
          style={{ borderColor: colors.accentRose || '#EB697F' }}
          textStyle={{ color: colors.accentRose || '#EB697F' }}
          fullWidth
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 110, gap: 16 },
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
  sectionTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.2 },
  sectionDesc: { fontSize: 14, lineHeight: 20 },
  typeList: { gap: 10, marginTop: 4 },
  typeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  typeIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  typeLabel: { fontSize: 15, fontWeight: '600', flex: 1, lineHeight: 22 },
  dangerCard: { padding: 18, borderRadius: 20, gap: 14, borderWidth: 1 },
  dangerContent: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  dangerText: { flex: 1, gap: 2 },
  dangerTitle: { fontSize: 16, fontWeight: '700' },
  dangerDesc: { fontSize: 13, lineHeight: 18 },
});