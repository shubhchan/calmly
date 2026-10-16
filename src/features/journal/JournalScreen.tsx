import React, { useState, useRef, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Card, CardContent, PrimaryButton, JournalReflectionIllustration, StaggeredEntry, TactilePressable } from '../../components';
import { useThemeColors } from '../../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { journalRepository } from '../../database/repositories/journalRepository';
import { format } from 'date-fns';
import { hapticFeedback } from '../../utils/haptics';
import { fontFamilies } from '../../theme/typography';

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
  const hasLoadedRef = useRef(false);

  const loadEntries = useCallback(async (showSpinner: boolean = false) => {
    if (showSpinner || !hasLoadedRef.current) setLoading(true);
    try {
      const all = await journalRepository.getAll();
      setEntries(all ?? []);
    } catch (e) {
      console.error('Failed to load journals:', e);
      setEntries([]);
    } finally {
      hasLoadedRef.current = true;
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
    hapticFeedback.medium();
    try {
      await journalRepository.toggleFavorite(entry.id);
      loadEntries();
    } catch (e) {
      console.error('Failed to toggle favorite:', e);
    }
  };

  const renderJournalType = (item: JournalTemplate, index: number) => (
    <StaggeredEntry index={index} delayStep={28} baseDelay={60} key={item.id}>
      <TactilePressable
        onPress={() => {
          navigation?.navigate?.('JournalEntry', { type: item.id as any });
        }}
        scaleDownTo={0.95}
        hapticStyle="light"
        accessibilityRole="button"
        accessibilityLabel={`${item.label}. ${item.desc}`}
        style={[
          styles.templateButton,
          {
            backgroundColor: colors.isDark ? '#1C2636' : colors.bgSecondary,
            borderColor: colors.isDark ? '#2E3D52' : colors.borderMedium,
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
      </TactilePressable>
    </StaggeredEntry>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bgPrimary }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={() => loadEntries(true)} tintColor={colors.accentPrimary} />
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
            {journalTypes.map((item, index) => renderJournalType(item, index))}
          </ScrollView>
        </CardContent>
      </Card>

      {/* Recent Reflections Feed */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Recent Reflections
          </Text>
          <TactilePressable
            onPress={() => {
              navigation.navigate('JournalEntry', { type: 'free' });
            }}
            scaleDownTo={0.96}
            hapticStyle="light"
            accessibilityRole="button"
            accessibilityLabel="New journal entry"
            style={styles.newActionLink}
          >
            <Ionicons name="add" size={16} color={colors.accentPrimary} />
            <Text style={[styles.newActionText, { color: colors.accentPrimary }]}>New entry</Text>
          </TactilePressable>
        </View>

        {entries.length > 0 ? (
          <View style={styles.entriesList}>
            {entries.map((entry, idx) => {
              const rawDate = entry.createdAt ? new Date(entry.createdAt) : new Date();
              const formattedDate = format(rawDate, 'MMM d, yyyy');
              const typeConfig = journalTypes.find((t) => t.id === entry.type) || journalTypes[0];

              return (
                <StaggeredEntry key={entry.id} index={Math.min(idx, 8)} delayStep={26} baseDelay={70}>
                <TactilePressable
                  onPress={() => {
                    navigation.navigate('JournalEntry', { id: entry.id });
                  }}
                  scaleDownTo={0.985}
                  hapticStyle="light"
                  accessibilityRole="button"
                  accessibilityLabel={`${typeConfig.label} entry from ${formattedDate}`}
                  style={[
                    styles.entryCard,
                    {
                      backgroundColor: colors.isDark ? '#1E293B' : (colors.bgSecondary || '#F4EFE6'),
                      borderColor: colors.isDark ? '#354760' : (colors.borderMedium || '#D5CCC0'),
                    },
                  ]}
                >
                  <View style={styles.entryRow}>
                    <View
                      style={[
                        styles.entryIconOrb,
                        {
                          backgroundColor: typeConfig.color + '1A',
                          borderColor: typeConfig.color + '38',
                        },
                      ]}
                    >
                      <Ionicons name={typeConfig.icon} size={20} color={typeConfig.color} />
                    </View>

                    <View style={styles.entryBody}>
                      <View style={styles.entryMeta}>
                        <Text style={[styles.entryDate, { color: colors.textTertiary }]}>
                          {formattedDate}
                        </Text>
                        <View style={[styles.typeBadge, { backgroundColor: typeConfig.color + '18' }]}>
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

                    <TactilePressable
                      onPress={() => {
                        handleToggleFavorite(entry);
                      }}
                      scaleDownTo={0.8}
                      hapticStyle="selection"
                      style={styles.favoriteButton}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={entry.favorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Ionicons
                        name={entry.favorite ? 'heart' : 'heart-outline'}
                        size={20}
                        color={entry.favorite ? '#DB3A60' : colors.textTertiary}
                      />
                    </TactilePressable>
                  </View>
                </TactilePressable>
                </StaggeredEntry>
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
    fontFamily: fontFamilies.serif.bold,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: fontFamilies.sans.medium,
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
    fontFamily: fontFamilies.serif.bold,
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
    fontFamily: fontFamilies.sans.semiBold,
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
    fontFamily: fontFamilies.sans.bold,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 17,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  templateDesc: {
    fontFamily: fontFamilies.sans.regular,
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
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
    fontFamily: fontFamilies.sans.medium,
    fontSize: 12,
    fontWeight: '500',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  typeBadgeText: {
    fontFamily: fontFamilies.sans.bold,
    fontSize: 11,
    fontWeight: '700',
  },
  entryTitle: {
    fontFamily: fontFamilies.serif.semiBold,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  entrySnippet: {
    fontFamily: fontFamilies.sans.regular,
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
    fontFamily: fontFamilies.serif.bold,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySubtitle: {
    fontFamily: fontFamilies.sans.regular,
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