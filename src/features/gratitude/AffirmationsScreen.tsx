import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { database } from '../../database';
import { Q } from '@nozbe/watermelondb';
import Affirmation from '../../database/models/Affirmation';
import { Card } from '../../components/Card';
import { PrimaryButton } from '../../components/PrimaryButton';
import { StaggeredEntry, TactilePressable, ScreenHeader } from '../../components';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme/ThemeContext';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { PopIn } from '../../components/interactive/PopIn';
import { ListSkeleton } from '../../components/interactive/LoadingState';
import { resolveTint, tintForIndex } from '../../theme/tints';

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
  const [dailyAffirmation, setDailyAffirmation] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const hasLoadedRef = useRef(false);

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
      <TactilePressable
        onPress={() => item?.id && navigation.navigate('AffirmationDetail', { id: item.id })}
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
    );
  };

  return (
    <ScreenContainer scroll={false} backgroundColor={colors.background.default}>
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
            } catch {}
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
          <Ionicons name="sparkles-outline" size={48} color={colors.text.tertiary} />
          <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>No affirmations yet</Text>
          <Text style={[styles.emptyText, { color: colors.text.secondary }]}>Add your own personal truths or browse categories above</Text>
          <PrimaryButton onPress={handleAddCustom} title="Add Affirmation" style={styles.emptyButton} />
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {(affirmations ?? []).map((item, idx) => (
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
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
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