import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { database } from '../../database';
import { Q } from '@nozbe/watermelondb';
import Affirmation from '../../database/models/Affirmation';
import { Card } from '../../components/Card';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Ionicons } from '@expo/vector-icons';

type NavigationProp = NativeStackScreenProps<RootStackParamList, 'Affirmations'>['navigation'];

interface AffirmationItem {
  id: string;
  text: string;
  category: string;
  favorite: boolean;
}

const AFFIRMATION_CATEGORIES = [
  'self-love', 'confidence', 'peace', 'strength', 'healing',
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
  const [affirmations, setAffirmations] = useState<AffirmationItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dailyAffirmation, setDailyAffirmation] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const loadAffirmations = useCallback(async () => {
    setLoading(true);
    try {
      let query = database.get<Affirmation>('affirmations').query(Q.sortBy('created_at', Q.desc));
      if (selectedCategory !== 'all') {
        query = database.get<Affirmation>('affirmations').query(
          Q.where('category', selectedCategory),
          Q.sortBy('created_at', Q.desc)
        );
      }
      const data = (await query.fetch()) ?? [];
      setAffirmations((data ?? []).map(a => ({
        id: a?.id ?? '',
        text: a?.text ?? '',
        category: a?.category ?? '',
        favorite: a?.favorite ?? false,
      })));
    } catch (error) {
      console.error('Failed to load affirmations:', error);
      setAffirmations((prev) => prev ?? []);
    } finally {
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
      let affirmation = null;
      try {
        affirmation = await database.get<Affirmation>('affirmations').find(id);
      } catch {
        return;
      }
      if (!affirmation) return;
      await database.write(async () => {
        await affirmation.update(a => { a.favorite = !currentFavorite; });
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
          onPress: async (text: string) => {
            if (text?.trim()) {
              await database.write(async () => {
                await database.get<Affirmation>('affirmations').create(a => {
                  a.text = text.trim();
                  a.category = 'custom';
                  a.favorite = false;
                  a.createdAt = Date.now();
                });
              });
              loadAffirmations();
            }
          },
        },
      ],
      'plain-text',
      '',
      { placeholder: 'I am...' }
    );
  };

  const renderItem = ({ item }: { item: AffirmationItem }) => {
    if (!item) return null;
    return (
    <TouchableOpacity
      onPress={() => item?.id && navigation.navigate('AffirmationDetail', { id: item.id })}
      style={styles.affirmationCard}
      activeOpacity={0.8}
    >
      <Text style={styles.affirmationText} numberOfLines={3}>{item?.text ?? ''}</Text>
      <View style={styles.affirmationFooter}>
        <Text style={styles.affirmationCategory}>{item?.category ?? ''}</Text>
        <TouchableOpacity
          onPress={(e) => { e.stopPropagation(); item?.id && handleToggleFavorite(item.id, item?.favorite ?? false); }}
          style={styles.favoriteButton}
        >
          <Ionicons
            name={item?.favorite ? 'heart' : 'heart-outline'}
            size={20}
            color={item?.favorite ? '#F5A9A9' : '#425474'}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Affirmations</Text>
      </View>

      <Card style={styles.dailyCard}>
        <View style={styles.dailyHeader}>
          <Ionicons name="sunny" size={24} color="#5A955A" />
          <Text style={styles.dailyLabel}>Today's Affirmation</Text>
        </View>
        <Text style={styles.dailyText}>{dailyAffirmation ?? ''}</Text>
        <TouchableOpacity onPress={() => {
          try {
            const all = Object.values(STATIC_AFFIRMATIONS ?? {}).flat() ?? [];
            if ((all ?? []).length > 0) setDailyAffirmation(all[Math.floor(Math.random() * all.length)] ?? '');
          } catch {}
        }} style={styles.refreshButton}>
          <Ionicons name="refresh" size={18} color="#5A955A" />
          <Text style={styles.refreshText}>New one</Text>
        </TouchableOpacity>
      </Card>

      <View style={styles.categoryScroll}>
        {['all', ...(AFFIRMATION_CATEGORIES ?? [])].map((cat) => (
          <TouchableOpacity
            key={cat ?? Math.random().toString()}
            onPress={() => cat && setSelectedCategory(cat)}
            style={[
              styles.categoryChip,
              selectedCategory === cat && styles.categoryChipSelected,
            ]}
          >
            <Text style={[
              styles.categoryChipText,
              selectedCategory === cat && styles.categoryChipTextSelected,
            ]}>{cat === 'all' ? 'All' : ((cat ?? '').charAt(0).toUpperCase() + (cat ?? '').slice(1))}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loading}>
          <Text>Loading affirmations...</Text>
        </View>
      ) : (affirmations ?? []).length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="sparkles" size={48} color="#425474" />
          <Text style={styles.emptyTitle}>No affirmations yet</Text>
          <Text style={styles.emptyText}>Add your own or browse the library</Text>
          <PrimaryButton onPress={handleAddCustom} title="Add Affirmation" style={styles.emptyButton} />
        </View>
      ) : (
        <FlatList
          data={affirmations ?? []}
          keyExtractor={(item, idx) => item?.id ?? String(idx)}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      <TouchableOpacity onPress={handleAddCustom} style={styles.addButton}>
        <Ionicons name="add" size={20} color="#5A955A" />
        <Text style={styles.addButtonText}>Add Custom Affirmation</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFBF7' },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100, gap: 20 },
  header: { marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '700', color: '#1E232E' },
  dailyCard: { gap: 12 },
  dailyHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  dailyLabel: { fontSize: 14, fontWeight: '600', color: '#34415A', textTransform: 'uppercase', letterSpacing: 0.5 },
  dailyText: { fontSize: 18, fontWeight: '500', color: '#1E232E', lineHeight: 26, fontStyle: 'italic' },
  refreshButton: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, paddingVertical: 8, alignSelf: 'flex-start' },
  refreshText: { fontSize: 14, fontWeight: '500', color: '#5A955A' },
  categoryScroll: { gap: 8, marginTop: 4 },
  categoryChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E4DEBC' },
  categoryChipSelected: { backgroundColor: '#5A955A', borderColor: '#5A955A' },
  categoryChipText: { fontSize: 13, fontWeight: '500', color: '#1E232E' },
  categoryChipTextSelected: { color: 'white' },
  affirmationCard: { padding: 16, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E4DEBC', gap: 10 },
  affirmationText: { fontSize: 16, color: '#1E232E', lineHeight: 24 },
  affirmationFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  affirmationCategory: { fontSize: 12, fontWeight: '500', color: '#5A955A', textTransform: 'capitalize' },
  favoriteButton: { padding: 4 },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#1E232E' },
  emptyText: { fontSize: 16, color: '#34415A', textAlign: 'center', paddingHorizontal: 20 },
  emptyButton: { marginTop: 8, minWidth: 200 },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 16, backgroundColor: 'transparent', borderWidth: 1, borderColor: '#5A955A' },
  addButtonText: { fontSize: 16, fontWeight: '600', color: '#5A955A' },
  loading: { alignItems: 'center', paddingVertical: 40 },
  separator: { height: 1, backgroundColor: '#E4DEBC' },
});