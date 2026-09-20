import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator, Share } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/Card';
import { PrimaryButton } from '../../components/PrimaryButton';

type NavigationProp = NativeStackScreenProps<RootStackParamList, 'DataManagement'>['navigation'];

const DATA_TYPES = [
  { key: 'moods', label: 'Mood Entries', icon: 'happy' },
  { key: 'journals', label: 'Journal Entries', icon: 'book' },
  { key: 'habits', label: 'Habits', icon: 'checkbox' },
  { key: 'completions', label: 'Habit Completions', icon: 'checkmark-circle' },
  { key: 'gratitude', label: 'Gratitude', icon: 'heart' },
  { key: 'positiveMoments', label: 'Good Things', icon: 'sparkles' },
  { key: 'calm', label: 'Calm Sessions', icon: 'meditation' },
  { key: 'breathing', label: 'Breathing Sessions', icon: 'air' },
];

export function DataManagementScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleExportAll = useCallback(async () => {
    setExporting(true);
    try {
      const { database } = require('../../database');
      const { MoodEntry } = require('../../database/models/MoodEntry');
      const { JournalEntry } = require('../../database/models/JournalEntry');
      const { Habit } = require('../../database/models/Habit');
      const { HabitCompletion } = require('../../database/models/HabitCompletion');
      const { GratitudeEntry } = require('../../database/models/GratitudeEntry');
      const { PositiveMoment } = require('../../database/models/PositiveMoment');
      const { CalmSession } = require('../../database/models/CalmSession');
      const { BreathingSession } = require('../../database/models/BreathingSession');
      const { MeditationSession } = require('../../database/models/MeditationSession');
      const { SleepEntry } = require('../../database/models/SleepEntry');
      const { Reflection } = require('../../database/models/Reflection');
      const { Affirmation } = require('../../database/models/Affirmation');
      const { Favorite } = require('../../database/models/Favorite');
      const { Tag } = require('../../database/models/Tag');
      const { Routine } = require('../../database/models/Routine');
      const { RoutineItem } = require('../../database/models/RoutineItem');
      const { Goal } = require('../../database/models/Goal');

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

      const json = JSON.stringify(exportData, null, 2);
      
      await Share.share({
        title: 'Calmly Data Export',
        message: json,
      });
    } catch (error) {
      console.error('Export failed:', error);
      Alert.alert('Export Failed', 'Could not export data. Please try again.');
    } finally {
      setExporting(false);
    }
  }, []);

  const handleDeleteAll = useCallback(() => {
    Alert.alert(
      'Delete ALL Data?',
      'This will permanently delete EVERYTHING: mood entries, journals, habits, gratitudes, calm sessions, affirmations, and all settings. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            setDeleting('all');
            try {
              const { database } = require('../../database');
              await database?.write?.(async () => {
                const collections = [
                  'mood_entries', 'journal_entries', 'habits', 'habit_completions',
                  'gratitude_entries', 'positive_moments', 'calm_sessions', 'breathing_sessions',
                  'meditation_sessions', 'sleep_entries', 'reflections', 'affirmations',
                  'favorites', 'tags', 'routines', 'routine_items', 'goals', 'user_settings',
                ];
                await Promise.all(
                  collections.map(name => database?.get?.(name)?.query?.()?.fetch?.().then((items: any[]) => 
                    Promise.all((items ?? []).map((item: any) => item?.destroyPermanently?.()))
                  ))
                );
              });
              Alert.alert('Done', 'All data has been deleted. The app will now restart.');
              navigation.goBack();
            } catch (error) {
              console.error('Delete failed:', error);
              Alert.alert('Error', 'Failed to delete data.');
            } finally {
              setDeleting(null);
            }
          },
        },
      ]
    );
  }, [navigation]);

  const handleDeleteType = useCallback((type: string) => {
    const typeInfo = (DATA_TYPES ?? []).find(t => t?.key === type);
    Alert.alert(
      `Delete ${typeInfo?.label ?? 'data'}?`,
      `This will permanently delete all ${(typeInfo?.label ?? 'data').toLowerCase()}. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(type);
            try {
              const { database } = require('../../database');
              const collectionMap: Record<string, string> = {
                moods: 'mood_entries',
                journals: 'journal_entries',
                habits: 'habits',
                completions: 'habit_completions',
                gratitude: 'gratitude_entries',
                positiveMoments: 'positive_moments',
                calm: 'calm_sessions',
                breathing: 'breathing_sessions',
              };
              const collectionName = (collectionMap ?? {})[type];
              if (collectionName) {
                await database?.write?.(async () => {
                  const items = (await database?.get?.(collectionName)?.query?.()?.fetch?.()) ?? [];
                  await Promise.all((items ?? []).map((item: any) => item?.destroyPermanently?.()));
                });
                Alert.alert('Done', `${typeInfo?.label ?? 'Data'} deleted.`);
              }
            } catch (error) {
              console.error('Delete failed:', error);
              Alert.alert('Error', 'Failed to delete data.');
            } finally {
              setDeleting(null);
            }
          },
        },
      ]
    );
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#1E232E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Data Management</Text>
        <View style={styles.headerSpacer} />
      </View>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Export Data</Text>
        <Text style={styles.sectionDesc}>
          Download a complete backup of all your Calmly data as a JSON file.
        </Text>
        <PrimaryButton
          onPress={handleExportAll}
          loading={exporting}
          title={exporting ? 'Preparing...' : 'Export All Data'}
          style={styles.exportButton}
          leftIcon={<Ionicons name="download" size={20} color="white" />}
        />
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Delete by Category</Text>
        <Text style={styles.sectionDesc}>
          Selectively remove specific types of data while keeping the rest.
        </Text>
        <View style={styles.typeList}>
          {(DATA_TYPES ?? []).map((type) => (
            <TouchableOpacity
              key={type?.key ?? Math.random().toString()}
              onPress={() => type?.key && handleDeleteType(type.key)}
              disabled={!!deleting}
              style={[
                styles.typeItem,
                deleting === type?.key && styles.typeItemDeleting,
              ]}
              activeOpacity={0.8}
            >
              <View style={[
                styles.typeIcon,
                deleting === type?.key && styles.typeIconDeleting,
              ]}>
                <Ionicons name={(type?.icon ?? 'help') as any} size={22} color={deleting === type?.key ? 'white' : '#5A955A'} />
              </View>
              <Text style={[
                styles.typeLabel,
                deleting === type?.key && styles.typeLabelDeleting,
              ]}>
                {type?.label ?? ''}
              </Text>
              {deleting === type?.key && (
                <ActivityIndicator size="small" color="white" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      <Card variant="outlined" style={styles.dangerCard}>
        <View style={styles.dangerContent}>
          <Ionicons name="warning" size={32} color="#EB697F" />
          <View style={styles.dangerText}>
            <Text style={styles.dangerTitle}>Danger Zone</Text>
            <Text style={styles.dangerDesc}>
              Irreversible actions. Once deleted, data cannot be recovered.
            </Text>
          </View>
        </View>
        <PrimaryButton
          onPress={handleDeleteAll}
          loading={deleting === 'all'}
          title={deleting === 'all' ? 'Deleting...' : 'Delete All Data'}
          variant="ghost"
          style={styles.dangerButton}
          fullWidth={false}
        />
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
  card: { marginBottom: 16, gap: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '600', color: '#1E232E' },
  sectionDesc: { fontSize: 14, color: '#34415A', lineHeight: 20, marginBottom: 12 },
  exportButton: { marginTop: 4 },
  typeList: { gap: 10 },
  typeItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E4DEBC' },
  typeItemDeleting: { opacity: 0.7 },
  typeIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(143, 188, 143, 0.1)' },
  typeIconDeleting: { backgroundColor: '#EB697F' },
  typeLabel: { fontSize: 16, fontWeight: '500', color: '#1E232E', flex: 1 },
  typeLabelDeleting: { color: 'white' },
  dangerCard: { borderColor: '#EB697F', borderWidth: 1, backgroundColor: 'rgba(235, 105, 127, 0.05)' },
  dangerContent: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  dangerText: { flex: 1 },
  dangerTitle: { fontSize: 16, fontWeight: '600', color: '#EB697F' },
  dangerDesc: { fontSize: 13, color: '#425474', marginTop: 2 },
  dangerButton: { alignSelf: 'center', borderColor: '#EB697F' },
});