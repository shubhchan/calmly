import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, Keyboard } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { gratitudeRepository } from '../../database/repositories/gratitudeRepository';
import { positiveMomentRepository } from '../../database/repositories/positiveMomentRepository';
import GratitudeEntry from '../../database/models/GratitudeEntry';
import PositiveMoment from '../../database/models/PositiveMoment';
import { Card } from '../../components/Card';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Ionicons } from '@expo/vector-icons';
import { getGratitudeEncouragement, getPositiveMomentEncouragement } from '../../utils/encouragement';

type NavigationProp = NativeStackScreenProps<RootStackParamList, 'Gratitude'>['navigation'];
type RouteProp = NativeStackScreenProps<RootStackParamList, 'Gratitude'>['route'];

export function GratitudeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp>();
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
        setEntries(data);
      } else {
        const data = showFavoritesOnly
          ? await positiveMomentRepository.getFavorites()
          : await positiveMomentRepository.getAll();
        setEntries(data);
      }
    } catch (error) {
      console.error('Failed to load entries:', error);
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
    navigation.navigate('GratitudeForm', { type, id: entry.id });
  };

  const handleDelete = async (entry: GratitudeEntry | PositiveMoment) => {
    Alert.alert(
      'Delete entry?',
      'This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (type === 'gratitude') {
              await gratitudeRepository.delete(entry.id);
            } else {
              await positiveMomentRepository.delete(entry.id);
            }
            loadEntries();
          },
        },
      ]
    );
  };

  const handleToggleFavorite = async (entry: GratitudeEntry | PositiveMoment) => {
    try {
      if (type === 'gratitude') {
        await gratitudeRepository.update(entry.id, { favorite: !entry.favorite });
      } else {
        await positiveMomentRepository.update(entry.id, { favorite: !entry.favorite });
      }
      loadEntries();
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const title = type === 'gratitude' ? 'Gratitude' : 'Good Things';
  const emptyIcon = type === 'gratitude' ? '🌱' : '✨';
  const emptyTitle = type === 'gratitude' ? 'No gratitude entries yet' : 'No good things saved yet';
  const emptySubtitle = type === 'gratitude'
    ? 'Notice something good? Save it here 🌿'
    : 'Capture small wins, compliments, or moments of joy';

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity onPress={() => setShowFavoritesOnly(!showFavoritesOnly)} style={styles.filterButton}>
          <Ionicons name={showFavoritesOnly ? 'heart' : 'heart-outline'} size={24} color="#5A955A" />
        </TouchableOpacity>
      </View>

      {entries.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>{emptyIcon}</Text>
          <Text style={styles.emptyTitle}>{emptyTitle}</Text>
          <Text style={styles.emptyText}>{emptySubtitle}</Text>
          <PrimaryButton onPress={handleAdd} title="Add Entry" style={styles.emptyButton} />
        </View>
      ) : (
        <View style={styles.list}>
          {entries.map((entry) => (
            <TouchableOpacity
              key={entry.id}
              onPress={() => handleEdit(entry)}
              style={styles.entryCard}
              activeOpacity={0.8}
            >
              <View style={styles.entryContent}>
                <Text style={styles.entryText} numberOfLines={3}>{entry.text}</Text>
                {entry.mood && (
                  <Text style={styles.entryMood}>
                    <Ionicons name="heart" size={14} color="#425474" />
                    {' '}{entry.mood}
                  </Text>
                )}
                <Text style={styles.entryDate}>
                  {new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
              </View>
              <View style={styles.entryActions}>
                <TouchableOpacity
                  onPress={(e) => { e.stopPropagation(); handleToggleFavorite(entry); }}
                  style={styles.favoriteButton}
                >
                  <Ionicons
                    name={entry.favorite ? 'heart' : 'heart-outline'}
                    size={22}
                    color={entry.favorite ? '#F5A9A9' : '#425474'}
                  />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <PrimaryButton onPress={handleAdd} title={type === 'gratitude' ? 'Add Gratitude' : 'Add Good Thing'} style={styles.addButton} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFBF7' },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100, gap: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '700', color: '#1E232E' },
  filterButton: { padding: 8 },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#1E232E' },
  emptyText: { fontSize: 16, color: '#34415A', textAlign: 'center', paddingHorizontal: 20 },
  emptyButton: { marginTop: 8, minWidth: 200 },
  list: { gap: 12 },
  entryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E4DEBC',
  },
  entryContent: { flex: 1, gap: 6 },
  entryText: { fontSize: 16, color: '#1E232E', lineHeight: 22 },
  entryMood: { fontSize: 12, color: '#425474' },
  entryDate: { fontSize: 12, color: '#425474' },
  entryActions: { paddingLeft: 12 },
  favoriteButton: { padding: 4 },
  addButton: { marginTop: 8 },
  loadingText: { textAlign: 'center', marginTop: 100, color: '#425474' },
});