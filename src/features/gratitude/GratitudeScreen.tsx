import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { gratitudeRepository } from '../../database/repositories/gratitudeRepository';
import { positiveMomentRepository } from '../../database/repositories/positiveMomentRepository';
import GratitudeEntry from '../../database/models/GratitudeEntry';
import PositiveMoment from '../../database/models/PositiveMoment';
import { PrimaryButton } from '../../components/PrimaryButton';
import { AppIcon } from '../../components/AppIcon';
import type { AppIconName } from '../../components/AppIcon';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../theme/ThemeContext';

type NavigationProp = NativeStackScreenProps<RootStackParamList, 'Gratitude'>['navigation'];
type RouteProp = NativeStackScreenProps<RootStackParamList, 'Gratitude'>['route'];

export function GratitudeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp>();
  const colors = useThemeColors();
  const { type = 'gratitude' } = route.params ?? {}; // 'gratitude' | 'positive'

  const [entries, setEntries] = useState<(GratitudeEntry | PositiveMoment)[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      if (type === 'gratitude') {
        const data = showFavoritesOnly
          ? await gratitudeRepository.getFavorites()
          : await gratitudeRepository.getAll();
        setEntries(data ?? []);
      } else {
        const data = showFavoritesOnly
          ? await positiveMomentRepository.getFavorites()
          : await positiveMomentRepository.getAll();
        setEntries(data ?? []);
      }
    } catch (error) {
      console.error('Failed to load entries:', error);
      setEntries((prev) => prev ?? []);
    } finally {
      setLoading(false);
    }
  }, [type, showFavoritesOnly]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const handleAdd = () => {
    navigation.navigate('GratitudeForm', { type });
  };

  const handleEdit = (entry: GratitudeEntry | PositiveMoment) => {
    if (!entry?.id) return;
    navigation.navigate('GratitudeForm', { type, id: entry.id });
  };

  const handleToggleFavorite = async (entry: GratitudeEntry | PositiveMoment) => {
    if (!entry?.id) return;
    try {
      if (type === 'gratitude') {
        await gratitudeRepository.update(entry.id, { favorite: !entry?.favorite });
      } else {
        await positiveMomentRepository.update(entry.id, { favorite: !entry?.favorite });
      }
      loadEntries();
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const title = type === 'gratitude' ? 'Gratitude Journal' : 'Good Things';
  const subtitle = type === 'gratitude' ? 'Counting life’s subtle blessings' : 'Celebrating small everyday wins';
  const emptyIcon: AppIconName = type === 'gratitude' ? 'l-gift' : 'l-star';
  const emptyTitle = type === 'gratitude' ? 'No gratitude entries yet' : 'No moments saved yet';
  const emptySubtitle =
    type === 'gratitude'
      ? 'Notice something peaceful or warm today? Record it here to foster presence.'
      : 'Capture small victories, thoughtful compliments, or joyful sparks.';

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bgPrimary, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading reflections...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bgPrimary }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
          style={[
            styles.filterButton,
            { backgroundColor: colors.bgCard, borderColor: colors.borderLight },
            showFavoritesOnly && { backgroundColor: (colors.accentPeach || '#EB876D') + '20', borderColor: colors.accentPeach || '#EB876D' },
          ]}
          hitSlop={10}
        >
          <Ionicons
            name={showFavoritesOnly ? 'heart' : 'heart-outline'}
            size={22}
            color={showFavoritesOnly ? (colors.accentPeach || '#EB876D') : colors.textTertiary}
          />
        </TouchableOpacity>
      </View>

      {(entries ?? []).length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIconWrap, { backgroundColor: colors.accentPrimary + '14' }]}>
            <AppIcon name={emptyIcon} size={48} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>{emptyTitle}</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{emptySubtitle}</Text>
          <PrimaryButton onPress={handleAdd} title={type === 'gratitude' ? 'Record Gratitude' : 'Save Good Thing'} style={styles.emptyButton} />
        </View>
      ) : (
        <View style={styles.list}>
          {(entries ?? []).map((entry, idx) => (
            <TouchableOpacity
              key={entry?.id ?? String(idx)}
              onPress={() => entry?.id && handleEdit(entry)}
              style={[
                styles.entryCard,
                { backgroundColor: colors.bgCard, borderColor: colors.borderLight },
              ]}
              activeOpacity={0.75}
            >
              <View style={styles.entryContent}>
                <Text style={[styles.entryText, { color: colors.textPrimary }]} numberOfLines={3}>
                  {entry?.text ?? ''}
                </Text>
                <View style={styles.entryMeta}>
                  {entry?.mood ? (
                    <View style={[styles.moodTag, { backgroundColor: colors.accentPrimary + '16' }]}>
                      <Ionicons name="sparkles" size={12} color={colors.accentPrimary} />
                      <Text style={[styles.entryMood, { color: colors.accentPrimary }]}>{entry.mood}</Text>
                    </View>
                  ) : null}
                  <Text style={[styles.entryDate, { color: colors.textTertiary }]}>
                    {(() => {
                      try {
                        const d = entry?.createdAt ? new Date(entry.createdAt) : null;
                        if (!d || isNaN(d.getTime())) return '';
                        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                      } catch {
                        return '';
                      }
                    })()}
                  </Text>
                </View>
              </View>
              <View style={styles.entryActions}>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    entry?.id && handleToggleFavorite(entry);
                  }}
                  style={styles.favoriteButton}
                  hitSlop={8}
                >
                  <Ionicons
                    name={entry?.favorite ? 'heart' : 'heart-outline'}
                    size={22}
                    color={entry?.favorite ? (colors.accentPeach || '#EB876D') : colors.textTertiary}
                  />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {(entries ?? []).length > 0 && (
        <PrimaryButton
          onPress={handleAdd}
          title={type === 'gratitude' ? 'Add Gratitude' : 'Add Good Thing'}
          style={styles.addButton}
          leftIcon={<Ionicons name="add" size={20} color="#FFFFFF" />}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 110, gap: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 30, fontWeight: '700', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, marginTop: 4 },
  filterButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: { alignItems: 'center', paddingVertical: 56, gap: 12 },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700' },
  emptyText: { fontSize: 15, textAlign: 'center', paddingHorizontal: 20, lineHeight: 22 },
  emptyButton: { marginTop: 10, minWidth: 220 },
  list: { gap: 12 },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  entryContent: { flex: 1, gap: 10 },
  entryText: { fontSize: 16, lineHeight: 23, fontWeight: '500' },
  entryMeta: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  moodTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  entryMood: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  entryDate: { fontSize: 12, fontWeight: '500' },
  entryActions: { paddingLeft: 12, marginTop: 2, justifyContent: 'flex-start' },
  favoriteButton: { padding: 4 },
  addButton: { marginTop: 8 },
  loadingText: { fontSize: 15 },
});