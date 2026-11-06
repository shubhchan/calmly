import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, Pressable } from 'react-native';
import { Alert } from '../../services/appAlert';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { database } from '../../database';
import { Q } from '@nozbe/watermelondb';
import Affirmation from '../../database/models/Affirmation';
import { Card } from '../../components/Card';
import { PrimaryButton } from '../../components/PrimaryButton';
import { StaggeredEntry, TactilePressable, ScreenHeader, AffirmationsRadianceIllustration } from '../../components';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme/ThemeContext';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { PopIn } from '../../components/interactive/PopIn';
import { ListSkeleton } from '../../components/interactive/LoadingState';
import { resolveTint, tintForIndex } from '../../theme/tints';
import Animated from 'react-native-reanimated';
import { sharedElementStyle, sharedTransitionTags } from '../../theme/sharedTransitions';

type NavigationProp = NativeStackScreenProps<RootStackParamList, 'Affirmations'>['navigation'];

interface AffirmationItem {
  id: string;
  text: string;
  category: string;
  favorite: boolean;
}

const AFFIRMATION_CATEGORIES = [
  'all', 'self-love', 'confidence', 'peace', 'strength', 'healing',
  'abundance', 'gratitude', 'courage', 'clarity', 'joy',
];

const STATIC_AFFIRMATIONS: Record<string, string[]> = {
  'self-love': [
    'I am worthy of love and respect.',
    'I accept myself completely.',
    'I treat myself with kindness.',
    'My worth is not determined by others.',
    'I am enough just as I am.',
  ],
  'confidence': [
    'I trust my abilities and decisions.',
    'I am capable of handling whatever comes.',
    'I believe in my potential.',
    'I speak my truth with confidence.',
    'I grow stronger every day.',
  ],
  'peace': [
    'I release what I cannot control.',
    'My mind is calm and centered.',
    'I breathe in peace, I breathe out tension.',
    'I am safe in this moment.',
    'Peace flows through me.',
  ],
  'strength': [
    'I am resilient and strong.',
    'I have overcome challenges before.',
    'My strength comes from within.',
    'I rise each time I fall.',
    'I am more powerful than I know.',
  ],
  'healing': [
    'I allow myself to heal at my own pace.',
    'I release the past with compassion.',
    'I am gentle with my healing journey.',
    'Each day brings new healing.',
    'I trust the process of healing.',
  ],
  'abundance': [
    'I am open to receiving good things.',
    'Abundance flows to me naturally.',
    'I deserve all the good in life.',
    'Opportunities appear everywhere.',
    'I attract positivity effortlessly.',
  ],
  'gratitude': [
    'I am grateful for this moment.',
    'I appreciate the small joys.',
    'Gratitude fills my heart.',
    'I notice beauty all around me.',
    'Thank you for this day.',
  ],
  'courage': [
    'I face my fears with bravery.',
    'Courage is my companion.',
    'I take bold steps forward.',
    'I am braver than I believe.',
    'Fear does not control me.',
  ],
  'clarity': [
    'My mind is clear and focused.',
    'I see my path clearly.',
    'I make decisions with wisdom.',
    'Clarity comes naturally to me.',
    'I trust my inner guidance.',
  ],
  'joy': [
    'I choose joy in this moment.',
    'Happiness flows through my veins.',
    'I deserve to feel good.',
    'Joy is my natural state.',
    'I celebrate life\'s simple pleasures.',
  ],
};

export function AffirmationsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDark } = useAppTheme();
  const [affirmations, setAffirmations] = useState<AffirmationItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dailyAffirmation, setDailyAffirmation] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const hasLoadedRef = useRef(false);

  const filteredAffirmations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return affirmations ?? [];
    return (affirmations ?? []).filter((a) => {
      const text = (a?.text ?? '').toLowerCase();
      const cat = (a?.category ?? '').toLowerCase();
      return text.includes(q) || cat.includes(q);
    });
  }, [affirmations, searchQuery]);

  const loadAffirmations = useCallback(async () => {
    if (!hasLoadedRef.current) setLoading(true);
    try {
      let query = database.get<Affirmation>('affirmations').query(Q.sortBy('created_at', Q.desc));
      if (selectedCategory !== 'all') {
        query = database.get<Affirmation>('affirmations').query(
          Q.where('category', selectedCategory),
          Q.sortBy('created_at', Q.desc)
        );
      }
      const data = (await query.fetch()) ?? [];
      setAffirmations(
        (data ?? []).map((a) => ({
          id: a?.id ?? '',
          text: a?.text ?? '',
          category: a?.category ?? '',
          favorite: a?.favorite ?? false,
        }))
      );
    } catch (error) {
      console.error('Failed to load affirmations:', error);
      setAffirmations((prev) => prev ?? []);
    } finally {
      hasLoadedRef.current = true;
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    loadAffirmations();
  }, [loadAffirmations]);

  useEffect(() => {
    try {
      const allAffirmations = Object.values(STATIC_AFFIRMATIONS ?? {}).flat() ?? [];
      if ((allAffirmations ?? []).length === 0) {
        setDailyAffirmation('');
      } else {
        setDailyAffirmation(allAffirmations[Math.floor(Math.random() * allAffirmations.length)] ?? '');
      }
    } catch {
      setDailyAffirmation('');
    }
  }, []);

  const handleToggleFavorite = async (id: string, currentFavorite: boolean) => {
    if (!id) return;
    try {
      const affirmation = await database.get<Affirmation>('affirmations').find(id);
      if (!affirmation) return;
      await database.write(async () => {
        await affirmation.update((a) => {
          a.favorite = !currentFavorite;
        });
      });
      loadAffirmations();
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleAddCustom = () => {
    Alert.prompt(
      'New Affirmation',
      'Write your personal affirmation:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: (text?: string) => {
            if (text?.trim()) {
              database.write(async () => {
                await database.get<Affirmation>('affirmations').create((a) => {
                  a.text = text.trim();
                  a.category = 'custom';
                  a.favorite = false;
                  a.createdAt = Date.now();
                });
              }).then(() => loadAffirmations());
            }
          },
        },
      ],
      'plain-text',
      'I am '
    );
  };

  const renderItem = ({ item, idx }: { item: AffirmationItem; idx: number }) => {
    if (!item) return null;
    const tint = resolveTint(!!isDark, tintForIndex(idx));
    return (
      <Animated.View
        sharedTransitionTag={item?.id ? sharedTransitionTags.affirmationCard(item.id) : undefined}
        sharedTransitionStyle={sharedElementStyle}
      >
        <TactilePressable
          onPress={() =>
            item?.id &&
            navigation.navigate('AffirmationDetail', {
              id: item.id,
              preview: {
                text: item.text,
                category: item.category,
                favorite: item.favorite,
              },
            })
          }
          scaleDownTo={0.985}
          hapticStyle="light"
          accessibilityRole="button"
          accessibilityLabel={`Affirmation: ${item?.text ?? ''}`}
          style={[styles.affirmationCard, { backgroundColor: tint.bg, borderColor: tint.border }]}
        >
          <Text style={[styles.affirmationText, { color: tint.text }]} numberOfLines={3}>
            {item?.text ?? ''}
          </Text>
          <View style={styles.affirmationFooter}>
            <Text style={[styles.affirmationCategory, { color: tint.accent }]}>{item?.category ?? ''}</Text>
            <TactilePressable
              onPress={() => item?.id && handleToggleFavorite(item.id, item?.favorite ?? false)}
              scaleDownTo={0.85}
              hapticStyle="selection"
              style={styles.favoriteButton}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={item?.favorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Ionicons
                name={item?.favorite ? 'heart' : 'heart-outline'}
                size={20}
                color={item?.favorite ? (colors.accents.peach) : tint.muted}
              />
            </TactilePressable>
          </View>
        </TactilePressable>
      </Animated.View>
    );
  };

  return (
    <ScreenContainer animate={false} scroll={false} backgroundColor={colors.background.default}>
      <ScreenHeader
        title="Affirmations"
        subtitle="Anchor positive truths in your everyday consciousness"
      />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <PopIn index={1}>
          <Card style={styles.dailyCard}>
            <View style={styles.dailyHeader}>
              <Ionicons name="sunny-outline" size={22} color={colors.primary.default} />
              <Text style={[styles.dailyLabel, { color: colors.primary.default }]}>Daily Reflection</Text>
            </View>
            <Text style={[styles.dailyText, { color: colors.text.primary }]}>"{dailyAffirmation ?? ''}"</Text>
            <TactilePressable
              onPress={() => {
                try {
                  const all = Object.values(STATIC_AFFIRMATIONS ?? {}).flat() ?? [];
                  if ((all ?? []).length > 0) setDailyAffirmation(all[Math.floor(Math.random() * all.length)] ?? '');
                } catch { }
              }}
              scaleDownTo={0.94}
              hapticStyle="selection"
              style={styles.refreshButton}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Show a new affirmation"
            >
              <Ionicons name="refresh-outline" size={16} color={colors.primary.default} />
              <Text style={[styles.refreshText, { color: colors.primary.default }]}>New affirmation</Text>
            </TactilePressable>
          </Card>
        </PopIn>

        <PopIn index={2}>
          <View style={[styles.searchBar, { backgroundColor: colors.surface.default, borderColor: colors.border.default }]}>
            <Ionicons name="search" size={17} color={colors.text.tertiary} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search affirmations by keyword…"
              placeholderTextColor={colors.text.tertiary}
              style={[styles.searchInput, { color: colors.text.primary }]}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={8} accessibilityRole="button" accessibilityLabel="Clear search">
                <Ionicons name="close-circle" size={17} color={colors.text.tertiary} />
              </Pressable>
            )}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            {AFFIRMATION_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <TactilePressable
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  scaleDownTo={0.93}
                  hapticStyle="selection"
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  style={[
                    styles.categoryChip,
                    { backgroundColor: colors.surface.default, borderColor: colors.border.default },
                    isSelected && { backgroundColor: colors.primary.default, borderColor: colors.primary.default },
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      { color: isSelected ? '#FFFFFF' : colors.text.primary },
                      isSelected && { fontWeight: '700' },
                    ]}
                  >
                    {cat.replace('-', ' ')}
                  </Text>
                </TactilePressable>
              );
            })}
          </ScrollView>
        </PopIn>

        <PopIn index={3}>
          {loading ? (
            <ListSkeleton rows={4} showHeader={false} />
          ) : (affirmations ?? []).length === 0 ? (
            <View style={styles.emptyState}>
              <AffirmationsRadianceIllustration width={170} height={145} style={{ marginBottom: 4 }} />
              <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>No affirmations yet</Text>
              <Text style={[styles.emptyText, { color: colors.text.secondary }]}>Add your own personal truths or browse categories above</Text>
              <PrimaryButton onPress={handleAddCustom} title="Add Affirmation" style={styles.emptyButton} />
            </View>
          ) : filteredAffirmations.length === 0 && searchQuery.length > 0 ? (
            <View style={styles.emptySearchContainer}>
              <Ionicons name="search-outline" size={36} color={colors.text.tertiary} style={{ marginBottom: 6 }} />
              <Text style={[styles.emptySearchTitle, { color: colors.text.primary }]}>
                No affirmations found
              </Text>
              <Text style={[styles.emptySearchSubtitle, { color: colors.text.secondary }]}>
                No affirmations match “{searchQuery.trim()}”.
              </Text>
              <TactilePressable
                onPress={() => setSearchQuery('')}
                style={[styles.clearSearchBtn, { borderColor: colors.border.default }]}
              >
                <Text style={[styles.clearSearchText, { color: colors.primary.default }]}>Clear Search</Text>
              </TactilePressable>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {(filteredAffirmations ?? []).map((item, idx) => (
                <StaggeredEntry key={item?.id ?? String(idx)} index={Math.min(idx, 7)}>
                  {renderItem({ item, idx })}
                </StaggeredEntry>
              ))}
            </View>
          )}
        </PopIn>

        <PopIn index={4}>
          <TactilePressable
            onPress={handleAddCustom}
            scaleDownTo={0.98}
            hapticStyle="light"
            accessibilityRole="button"
            accessibilityLabel="Add custom affirmation"
            style={[styles.addButton, { borderColor: colors.primary.default, backgroundColor: colors.surface.default }]}
          >
            <Ionicons name="add" size={20} color={colors.primary.default} />
            <Text style={[styles.addButtonText, { color: colors.primary.default }]}>Add Custom Affirmation</Text>
          </TactilePressable>
        </PopIn>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 110, gap: 18 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    paddingVertical: 0,
  },
  emptySearchContainer: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
    gap: 6,
  },
  emptySearchTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptySearchSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  clearSearchBtn: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  clearSearchText: {
    fontSize: 13,
    fontWeight: '600',
  },
  dailyCard: {
    padding: 18,
    borderRadius: 20,
    gap: 10,
  },
  dailyHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dailyLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  dailyText: { fontSize: 18, fontWeight: '500', lineHeight: 26, fontStyle: 'italic' },
  refreshButton: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, alignSelf: 'flex-start' },
  refreshText: { fontSize: 13, fontWeight: '600' },
  categoryScroll: { gap: 8, paddingVertical: 2 },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryChipText: { fontSize: 13, fontWeight: '500', textTransform: 'capitalize' },
  affirmationCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
  },
  affirmationText: { fontSize: 16, lineHeight: 24, fontWeight: '500' },
  affirmationFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  affirmationCategory: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  favoriteButton: { padding: 4 },
  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700' },
  emptyText: { fontSize: 15, textAlign: 'center', paddingHorizontal: 20, lineHeight: 22 },
  emptyButton: { marginTop: 8, minWidth: 200 },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 6,
  },
  addButtonText: { fontSize: 15, fontWeight: '600' },
  loading: { alignItems: 'center', paddingVertical: 30 },
});