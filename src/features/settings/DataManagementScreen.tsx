import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Share } from 'react-native';
import { Alert } from '../../services/appAlert';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme/ThemeContext';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { AppText, Button, ScreenHeader, TactilePressable } from '../../components';
import { PopIn } from '../../components/interactive/PopIn';
import { deleteSettingsFileStore } from '../../database/repositories/settingsRepository';
import { moodRepository } from '../../database/repositories/moodRepository';
import { journalRepository } from '../../database/repositories/journalRepository';

const DATA_TYPES: { key: string; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'moods', label: 'Mood check-ins', icon: 'happy-outline' },
  { key: 'journals', label: 'Journal reflections', icon: 'book-outline' },
  { key: 'habits', label: 'Habits and routines', icon: 'checkbox-outline' },
  { key: 'completions', label: 'Habit streaks and logs', icon: 'checkmark-circle-outline' },
  { key: 'gratitude', label: 'Gratitude entries', icon: 'heart-outline' },
  { key: 'positiveMoments', label: 'Good things and wins', icon: 'sparkles-outline' },
  { key: 'calm', label: 'Calm and grounding logs', icon: 'flower-outline' },
  { key: 'breathing', label: 'Breathing sessions', icon: 'leaf-outline' },
];

/**
 * Data and backup — take a copy, or clear one category at a time.
 *
 * Export is the first and largest action. Categories read as hairline rows so
 * the page stays calm even though every row can delete something.
 */
export function DataManagementScreen() {
  const { colors } = useAppTheme();
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
        moods: await moodRepository.getAll(),
        journals: await journalRepository.getAll(),
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
          moods: (collections?.moods ?? []).map((e: any) => e?._raw ?? e),
          journals: (collections?.journals ?? []).map((e: any) => e?._raw ?? e),
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

      // Hand the backup over as a file. Sharing a multi-megabyte string through
      // the Android share sheet used to blow the Binder transaction limit and
      // crash the app natively (TransactionTooLargeException).
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { File: BackupFile, Paths } = require('expo-file-system');
        const file = new BackupFile(Paths.cache, `calmly-backup-${Date.now()}.json`);
        try {
          file.create({ overwrite: true });
        } catch {}
        file.write(json);

        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const Sharing = require('expo-sharing');
        const canShare = (await Sharing?.isAvailableAsync?.()) ?? false;
        if (canShare) {
          await Sharing.shareAsync(file.uri, {
            mimeType: 'application/json',
            dialogTitle: 'Calmly Backup',
            UTI: 'public.json',
          });
          return;
        }
      } catch (error) {
        console.warn('File export unavailable, falling back to text share:', error);
      }

      // Fallbacks for environments without the file-sharing modules: small
      // payloads are safe to pass through the share sheet as text, larger ones
      // go to the clipboard instead of risking another native crash.
      if (json.length <= 100000) {
        await Share.share({
          title: 'Calmly Backup',
          message: json,
        });
      } else {
        await Clipboard.setStringAsync(json);
        Alert.alert('Backup Copied', 'Your backup is large, so it was copied to the clipboard instead of the share sheet.');
      }
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
              if (typeKey === 'moods') await moodRepository.clearFallback();
              if (typeKey === 'journals') await journalRepository.clearFallback();
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
              await Promise.all([moodRepository.clearFallback(), journalRepository.clearFallback()]);
              deleteSettingsFileStore();
              Alert.alert('Reset Complete', 'All local data was erased. Cloud snapshots must be deleted separately in Google Drive.');
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
    <ScreenContainer contentContainerStyle={styles.content}>
      <ScreenHeader title="Data & backup" />

      <PopIn index={0}>
        <View style={[styles.exportPlate, { backgroundColor: colors.primary.subtle }]}>
          <Ionicons name="download-outline" size={22} color={colors.primary.default} />
          <View style={{ flex: 1 }}>
            <AppText variant="title">Export everything</AppText>
            <AppText variant="bodySmall" tone="secondary" style={{ marginTop: 4 }}>
              A complete, portable JSON copy of your reflections, habits and check-ins.
            </AppText>
          </View>
        </View>
        <Button
          onPress={handleExportAll}
          loading={exporting}
          title={exporting ? 'Packaging data…' : 'Export backup'}
          variant="primary"
          size="lg"
          fullWidth
          style={{ marginTop: 14 }}
          leftIcon={(color) => <Ionicons name="download-outline" size={18} color={color} />}
        />
      </PopIn>

      <PopIn index={1}>
        <View style={{ marginTop: 32 }}>
          <AppText variant="overline" tone="tertiary">
            Clear one category
          </AppText>
          <AppText variant="bodySmall" tone="secondary" style={{ marginTop: 4 }}>
            Remove a single kind of history. Everything else stays as it is.
          </AppText>

          <View style={{ marginTop: 8 }}>
            {(DATA_TYPES ?? []).map((type, index) => (
              <View
                key={type.key}
                style={[
                  styles.typeRow,
                  { borderTopColor: colors.border.default, borderTopWidth: index === 0 ? 0 : StyleSheet.hairlineWidth },
                ]}
              >
                <TactilePressable
                  onPress={() => handleDeleteType(type.key)}
                  disabled={!!deleting}
                  scaleDownTo={0.99}
                  hapticStyle="light"
                  accessibilityRole="button"
                  accessibilityLabel={`Delete all ${type.label}`}
                  style={styles.typeRowInner}
                >
                  <Ionicons name={type.icon} size={19} color={colors.text.secondary} />
                  <AppText variant="body" style={{ flex: 1 }}>
                    {type.label}
                  </AppText>
                  {deleting === type.key ? (
                    <ActivityIndicator size="small" color={colors.primary.default} />
                  ) : (
                    <Ionicons name="trash-outline" size={17} color={colors.text.tertiary} />
                  )}
                </TactilePressable>
              </View>
            ))}
          </View>
        </View>
      </PopIn>

      <PopIn index={2}>
        <View style={{ marginTop: 32 }}>
          <AppText variant="overline" tone="tertiary">
            Danger zone
          </AppText>
          <View
            style={[
              styles.dangerPlate,
              { backgroundColor: colors.status.error.subtle, borderColor: colors.status.error.border },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
              <Ionicons name="warning-outline" size={20} color={colors.status.error.default} style={{ marginTop: 1 }} />
              <View style={{ flex: 1 }}>
                <AppText variant="body" color={colors.status.error.default}>
                  Wipe all data
                </AppText>
                <AppText variant="caption" tone="secondary" style={{ marginTop: 3 }}>
                  Permanent. Once erased, your local records cannot be restored.
                </AppText>
              </View>
            </View>
            <TactilePressable
              onPress={handleDeleteAll}
              disabled={deleting === 'all'}
              accessibilityRole="button"
              accessibilityLabel="Wipe all data permanently"
              scaleDownTo={0.98}
              style={{ paddingVertical: 10, marginTop: 8 }}
            >
              <AppText variant="label" color={colors.status.error.default}>
                {deleting === 'all' ? 'Erasing…' : 'Wipe all data permanently'}
              </AppText>
            </TactilePressable>
          </View>
        </View>
      </PopIn>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 56 },
  exportPlate: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    padding: 18,
    borderRadius: 20,
    marginTop: 8,
  },
  typeRow: { paddingVertical: 2 },
  typeRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
  },
  dangerPlate: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 18,
    marginTop: 10,
  },
});
