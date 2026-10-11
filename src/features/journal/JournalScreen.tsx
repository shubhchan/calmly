import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Card, CardContent, PrimaryButton, AppIcon } from '../../components';
import type { AppIconName } from '../../components';
import { useThemeColors } from '../../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { journalRepository } from '../../database/repositories/journalRepository';
import { JournalEntry } from '../../database/models';
import { format } from 'date-fns';

const journalTypes: { id: string; label: string; desc: string; icon: AppIconName; color: string }[] = [
  { id: 'free', label: 'Free Writing', desc: 'Unstructured flow of consciousness', icon: 'l-write', color: '#3E7B52' },
  { id: 'daily_reflection', label: 'Daily Review', desc: 'Reflect upon today’s events', icon: 'i-sun', color: '#6C5CE7' },
  { id: 'gratitude', label: 'Gratitude', desc: 'Counting subtle blessings', icon: 'l-gift', color: '#D96547' },
  { id: 'stress', label: 'Stress Release', desc: 'Release mental baggage', icon: 'l-pulse', color: '#DB3A60' },
  { id: 'sleep', label: 'Sleep & Dreams', desc: 'Nighttime closure & rest', icon: 'i-moon', color: '#0E7490' },
  { id: 'morning', label: 'Morning Pages', desc: 'Awaken with mindful clarity', icon: 'i-sun', color: '#2563EB' },
  { id: 'brain_dump', label: 'Brain Dump', desc: 'Declutter racing thoughts', icon: 'i-bulb', color: '#3E7B52' },
];

export function JournalScreen() {
  const navigation = useNavigation<any>();
  const colors = useThemeColors();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const all = await journalRepository.getAll();
      setEntries(all ?? []);
    } catch (e) {
      console.error('Failed to load journals:', e);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const handleToggleFavorite = async (entry: JournalEntry) => {
    try {
      await journalRepository.toggleFavorite(entry.id);
      loadEntries();
    } catch (e) {
      console.error('Failed to toggle favorite:', e);
    }
  };

  const renderJournalType = (item: typeof journalTypes[0]) => (
    <Pressable
      key={item.id}
      onPress={() => navigation?.navigate?.('JournalEntry', { type: item.id as any })}
      style={({ pressed }) => [
        styles.templateCard,
        {
          backgroundColor: colors.bgCard,
          borderColor: colors.borderLight,
          opacity: pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <View
        style={[
          styles.templateIconOrb,
          { backgroundColor: item.color + '18' },
        ]}
      >
        <AppIcon name={item.icon} size={24} color={item.color} />
      </View>
      <Text style={[styles.templateTitle, { color: colors.textPrimary }]} numberOfLines={1}>
        {item.label}
      </Text>
      <Text style={[styles.templateDesc, { color: colors.textTertiary }]} numberOfLines={2}>
        {item.desc}
      </Text>
    </Pressable>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bgPrimary }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>My Journal</Text>
        <Text style={[styles.subtitle, { color: colors.textTertiary }]}>
          {entries.length} reflections recorded · Choose a template or free write
        </Text>
      </View>

      {/* Prompts & Templates Carousel */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Prompts & Templates
          </Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.templatesScroll}
        >
          {journalTypes.map(renderJournalType)}
        </ScrollView>
      </View>

      {/* Recent Reflections Feed */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Recent Reflections
          </Text>
          <Pressable
            onPress={() => navigation.navigate('JournalEntry', { type: 'free' })}
            style={styles.newActionLink}
          >
            <Ionicons name="add" size={16} color={colors.accentPrimary} />
            <Text style={[styles.newActionText, { color: colors.accentPrimary }]}>New entry</Text>
          </Pressable>
        </View>

        {entries.length > 0 ? (
          <View style={styles.entriesList}>
            {entries.map((entry) => {
              const rawDate = entry.createdAt ? new Date(entry.createdAt) : new Date();
              const formattedDate = format(rawDate, 'MMM d, yyyy');
              const typeConfig = journalTypes.find((t) => t.id === entry.type) || journalTypes[0];

              return (
                <Pressable
                  key={entry.id}
                  onPress={() => navigation.navigate('JournalEntry', { id: entry.id })}
                  style={({ pressed }) => [
                    styles.entryCard,
                    {
                      backgroundColor: colors.bgCard,
                      borderColor: colors.borderLight,
                      opacity: pressed ? 0.85 : 1,
                      transform: [{ scale: pressed ? 0.99 : 1 }],
                    },
                  ]}
                >
                  <View style={styles.entryRow}>
                    {/* Top-aligned Mood / Type Orb */}
                    <View
                      style={[
                        styles.entryIconOrb,
                        { backgroundColor: colors.accentBg },
                      ]}
                    >
                      <AppIcon name={entry.mood ? `m-${entry.mood}` : typeConfig.icon} size={22} loop={false} />
                    </View>

                    {/* Left-aligned Multi-line Content Column */}
                    <View style={styles.entryTextCol}>
                      <Text
                        style={[styles.entryTitle, { color: colors.textPrimary }]}
                        numberOfLines={2}
                      >
                        {entry.title || 'Untitled Entry'}
                      </Text>
                      {entry.body ? (
                        <Text
                          style={[styles.entrySnippet, { color: colors.textSecondary }]}
                          numberOfLines={2}
                        >
                          {entry.body}
                        </Text>
                      ) : null}
                      <View style={styles.entryMetaRow}>
                        <View style={[styles.entryTypeTag, { backgroundColor: typeConfig.color + '15' }]}>
                          <Text style={[styles.entryTypeText, { color: typeConfig.color }]}>
                            {typeConfig.label}
                          </Text>
                        </View>
                        <Text style={[styles.entryDateText, { color: colors.textTertiary }]}>
                          {formattedDate}
                        </Text>
                      </View>
                    </View>

                    {/* Top-aligned Favorite Heart */}
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(entry);
                      }}
                      style={styles.favoriteButton}
                      hitSlop={8}
                    >
                      <Ionicons
                        name={entry.favorite ? 'heart' : 'heart-outline'}
                        size={20}
                        color={entry.favorite ? '#DB3A60' : colors.textTertiary}
                      />
                    </TouchableOpacity>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <Card variant="outlined" style={styles.emptyCard}>
            <CardContent style={styles.emptyContent}>
              <View style={[styles.emptyIconCircle, { backgroundColor: colors.accentBg }]}>
                <AppIcon name="l-book" size={42} loop />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                A fresh blank canvas
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
                Write down your thoughts, a moment of presence, or release whatever weighs on you.
              </Text>
              <PrimaryButton
                title="Start First Entry"
                variant="primary"
                size="md"
                onPress={() => navigation.navigate('JournalEntry', { type: 'free' })}
                style={styles.emptyButton}
                fullWidth={false}
              />
            </CardContent>
          </Card>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 110,
    gap: 22,
  },
  header: {
    marginBottom: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  newActionLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  newActionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  templatesScroll: {
    gap: 12,
    paddingRight: 4,
  },
  templateCard: {
    width: 148,
    height: 140,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'space-between',
    elevation: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  templateIconOrb: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  templateDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  entriesList: {
    gap: 12,
  },
  entryCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    elevation: 1.5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  entryIconOrb: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  entryTextCol: {
    flex: 1,
    gap: 4,
  },
  entryTitle: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    textAlign: 'left',
  },
  entrySnippet: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'left',
  },
  entryMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  entryTypeTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  entryTypeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  entryDateText: {
    fontSize: 12,
    fontWeight: '500',
  },
  favoriteButton: {
    padding: 6,
    marginTop: 2,
  },
  emptyCard: {
    borderRadius: 22,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    gap: 8,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    maxWidth: 280,
  },
  emptyButton: {
    marginTop: 12,
    minWidth: 160,
  },
});