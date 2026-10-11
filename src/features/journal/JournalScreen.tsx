import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Card, CardContent, PrimaryButton, JournalReflectionIllustration } from '../../components';
import { useThemeColors } from '../../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { journalRepository } from '../../database/repositories/journalRepository';
import { format } from 'date-fns';

interface JournalTemplate {
  id: string;
  label: string;
  desc: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const journalTypes: JournalTemplate[] = [
  { id: 'free', label: 'Free Writing', desc: 'Unstructured flow of thoughts', icon: 'create-outline', color: '#5EBE7B' },
  { id: 'daily_reflection', label: 'Daily Review', desc: 'Reflect upon today’s events', icon: 'sunny-outline', color: '#F59E0B' },
  { id: 'gratitude', label: 'Gratitude', desc: 'Counting subtle blessings', icon: 'heart-outline', color: '#F43F5E' },
  { id: 'stress', label: 'Stress Release', desc: 'Release mental tension', icon: 'leaf-outline', color: '#10B981' },
  { id: 'sleep', label: 'Sleep & Dreams', desc: 'Nighttime closure & rest', icon: 'moon-outline', color: '#6366F1' },
  { id: 'morning', label: 'Morning Pages', desc: 'Mindful dawn clarity', icon: 'cafe-outline', color: '#0EA5E9' },
  { id: 'brain_dump', label: 'Brain Dump', desc: 'Declutter racing thoughts', icon: 'sparkles-outline', color: '#8B5CF6' },
];

export function JournalScreen() {
  const navigation = useNavigation<any>();
  const colors = useThemeColors();
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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

  // Reload every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadEntries();
    }, [loadEntries])
  );

  const handleToggleFavorite = async (entry: any) => {
    try {
      await journalRepository.toggleFavorite(entry.id);
      loadEntries();
    } catch (e) {
      console.error('Failed to toggle favorite:', e);
    }
  };

  const renderJournalType = (item: JournalTemplate) => (
    <Pressable
      key={item.id}
      onPress={() => navigation?.navigate?.('JournalEntry', { type: item.id as any })}
      style={({ pressed }) => [
        styles.templateButton,
        {
          backgroundColor: colors.isDark ? '#1C2636' : colors.bgSecondary,
          borderColor: colors.isDark ? '#2E3D52' : colors.borderMedium,
          opacity: pressed ? 0.82 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
      ]}
    >
      <View style={styles.iconOrbContainer}>
        <View
          style={[
            styles.templateIconOrb,
            {
              backgroundColor: item.color + '1A',
              borderColor: item.color + '38',
            },
          ]}
        >
          <Ionicons name={item.icon} size={22} color={item.color} style={{ textAlign: 'center' }} />
        </View>
      </View>
      <View style={styles.templateTextContainer}>
        <Text style={[styles.templateTitle, { color: colors.textPrimary }]} numberOfLines={1}>
          {item.label}
        </Text>
        <Text style={[styles.templateDesc, { color: colors.textTertiary }]} numberOfLines={2}>
          {item.desc}
        </Text>
      </View>
    </Pressable>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bgPrimary }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={loadEntries} tintColor={colors.accentPrimary} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>My Journal</Text>
        <Text style={[styles.subtitle, { color: colors.textTertiary }]}>
          {entries.length} reflection{entries.length === 1 ? '' : 's'} recorded · Choose a template or free write
        </Text>
      </View>

      {/* Prompts & Templates Card Container */}
      <Card variant="outlined" style={styles.templatesSectionCard}>
        <CardContent style={styles.templatesCardContent}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Prompts & Templates
            </Text>
            <View style={[styles.cardTag, { backgroundColor: colors.accentBg }]}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.accentPrimary }}>
                Guided
              </Text>
            </View>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.templatesScrollView}
            contentContainerStyle={styles.templatesScroll}
          >
            {journalTypes.map(renderJournalType)}
          </ScrollView>
        </CardContent>
      </Card>

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
                      borderColor: colors.isDark ? '#2E3D52' : colors.borderLight,
                      opacity: pressed ? 0.85 : 1,
                      transform: [{ scale: pressed ? 0.99 : 1 }],
                    },
                  ]}
                >
                  <View style={styles.entryRow}>
                    <View
                      style={[
                        styles.entryIconOrb,
                        { backgroundColor: typeConfig.color + '20' },
                      ]}
                    >
                      <Ionicons name={typeConfig.icon} size={20} color={typeConfig.color} />
                    </View>

                    <View style={styles.entryBody}>
                      <View style={styles.entryMeta}>
                        <Text style={[styles.entryDate, { color: colors.textTertiary }]}>
                          {formattedDate}
                        </Text>
                        <View style={[styles.typeBadge, { backgroundColor: typeConfig.color + '15' }]}>
                          <Text style={[styles.typeBadgeText, { color: typeConfig.color }]}>
                            {typeConfig.label}
                          </Text>
                        </View>
                      </View>

                      {entry.title ? (
                        <Text style={[styles.entryTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                          {entry.title}
                        </Text>
                      ) : null}

                      <Text
                        style={[styles.entrySnippet, { color: colors.textSecondary }]}
                        numberOfLines={2}
                      >
                        {entry.body || 'No written reflection text'}
                      </Text>
                    </View>

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
              <JournalReflectionIllustration width={150} height={125} style={{ marginBottom: 4 }} />
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
  templatesSectionCard: {
    borderRadius: 24,
    borderWidth: 1.2,
  },
  templatesCardContent: {
    padding: 16,
    gap: 12,
  },
  cardTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  templatesScrollView: {
    marginHorizontal: -16,
  },
  templatesScroll: {
    paddingHorizontal: 16,
    paddingVertical: 2,
    gap: 10,
  },
  templateButton: {
    width: 124,
    minHeight: 140,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 18,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  iconOrbContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 6,
  },
  templateIconOrb: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  templateTextContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: 3,
  },
  templateTitle: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 17,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  templateDesc: {
    fontSize: 11,
    lineHeight: 14,
    textAlign: 'center',
    paddingHorizontal: 2,
  },
  entriesList: {
    gap: 12,
  },
  entryCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.2,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  entryIconOrb: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  entryBody: {
    flex: 1,
    gap: 4,
  },
  entryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  entryDate: {
    fontSize: 12,
    fontWeight: '500',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  entryTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  entrySnippet: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 2,
  },
  favoriteButton: {
    padding: 4,
  },
  emptyCard: {
    borderRadius: 24,
  },
  emptyContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    paddingHorizontal: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 260,
  },
  emptyButton: {
    marginTop: 18,
  },
});