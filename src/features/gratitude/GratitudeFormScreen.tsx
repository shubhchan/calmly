import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Keyboard } from 'react-native';
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

type NavigationProp = NativeStackScreenProps<RootStackParamList, 'GratitudeForm'>['navigation'];
type RouteProp = NativeStackScreenProps<RootStackParamList, 'GratitudeForm'>['route'];

type EntryType = 'gratitude' | 'positive';

export function GratitudeFormScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp>();
  const { type, id } = route.params as { type: EntryType; id?: string };
  const isEditing = !!id;

  const [text, setText] = useState('');
  const [mood, setMood] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [favorite, setFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  const MOODS = [
    'grateful', 'happy', 'peaceful', 'excited', 'content',
    'proud', 'hopeful', 'inspired', 'loved', 'calm'
  ];

  const loadEntry = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      if (type === 'gratitude') {
        const entry = await gratitudeRepository.getAll().then(list => list.find(e => e.id === id));
        if (entry) {
          setText(entry.text);
          setMood(entry.mood);
          setTags(JSON.parse(entry.tags || '[]'));
          setFavorite(entry.favorite);
        }
      } else {
        const entry = await positiveMomentRepository.getAll().then(list => list.find(e => e.id === id));
        if (entry) {
          setText(entry.text);
          setMood(entry.mood);
          setTags(JSON.parse(entry.tags || '[]'));
          setFavorite(entry.favorite);
        }
      }
    } catch (error) {
      console.error('Failed to load entry:', error);
    } finally {
      setLoading(false);
    }
  }, [id, type]);

  useEffect(() => {
    loadEntry();
  }, [loadEntry]);

  const validate = (): boolean => {
    if (!text.trim()) {
      Alert.alert('Missing text', 'Please write something');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const data = {
        text: text.trim(),
        mood,
        tags,
        favorite,
      };
      if (type === 'gratitude') {
        if (isEditing) {
          await gratitudeRepository.update(id!, data);
        } else {
          await gratitudeRepository.create(data);
        }
      } else {
        if (isEditing) {
          await positiveMomentRepository.update(id!, data);
        } else {
          await positiveMomentRepository.create(data);
        }
      }
      navigation.goBack();
    } catch (error) {
      console.error('Failed to save entry:', error);
      Alert.alert('Error', 'Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
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
              await gratitudeRepository.delete(id!);
            } else {
              await positiveMomentRepository.delete(id!);
            }
            navigation.goBack();
          },
        },
      ]
    );
  };

  const title = type === 'gratitude' ? 'Gratitude' : 'Good Thing';

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        onTouchStart={() => Keyboard.dismiss()}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#1E232E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEditing ? 'Edit' : 'New'} {title}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>What are you grateful for?</Text>
          <TextInput
            style={styles.textArea}
            placeholder={type === 'gratitude' ? 'I\'m grateful for...' : 'Something good that happened...'}
            value={text}
            onChangeText={setText}
            placeholderTextColor="#425474"
            multiline
            numberOfLines={5}
            maxLength={1000}
          />
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Mood (optional)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.moodScroll}>
            {MOODS.map((m) => (
              <TouchableOpacity
                key={m}
                onPress={() => setMood(mood === m ? '' : m)}
                style={[
                  styles.moodChip,
                  mood === m && styles.moodChipSelected,
                ]}
              >
                <Text style={[styles.moodChipText, mood === m && styles.moodChipTextSelected]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Tags (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Add tags separated by commas"
            value={tags.join(', ')}
            onChangeText={(t) => setTags(t.split(',').map(s => s.trim()).filter(Boolean))}
            placeholderTextColor="#425474"
          />
        </Card>

        <Card style={styles.section}>
          <TouchableOpacity onPress={() => setFavorite(!favorite)} style={styles.favoriteToggle}>
            <View style={styles.favoriteToggleLeft}>
              <Ionicons
                name={favorite ? 'heart' : 'heart-outline'}
                size={24}
                color={favorite ? '#F5A9A9' : '#5A955A'}
              />
              <View style={styles.favoriteToggleInfo}>
                <Text style={styles.favoriteToggleLabel}>Mark as favorite</Text>
                <Text style={styles.favoriteToggleDesc}>
                  {type === 'gratitude'
                    ? 'Favorites appear in your gratitude collection'
                    : 'Favorites may resurface as "Remember this?" prompts'}
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.favoriteToggleSwitch,
                favorite && styles.favoriteToggleSwitchOn,
              ]}
            >
              <View style={[styles.favoriteToggleThumb, favorite && styles.favoriteToggleThumbOn]} />
            </View>
          </TouchableOpacity>
        </Card>

        {isEditing && (
          <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
            <Text style={styles.deleteButtonText}>Delete Entry</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        <PrimaryButton
          onPress={handleSave}
          loading={loading}
          title={isEditing ? 'Save Changes' : 'Save'}
          style={styles.saveButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFBF7' },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '600', color: '#1E232E', textAlign: 'center' },
  headerSpacer: { width: 44 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#34415A', textTransform: 'uppercase', letterSpacing: 0.5 },
  textArea: { fontSize: 17, color: '#1E232E', minHeight: 120, textAlignVertical: 'top', paddingTop: 4 },
  moodScroll: { gap: 8, paddingVertical: 4 },
  moodChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E4DEBC' },
  moodChipSelected: { backgroundColor: '#5A955A', borderColor: '#5A955A' },
  moodChipText: { fontSize: 14, fontWeight: '500', color: '#1E232E' },
  moodChipTextSelected: { color: 'white' },
  input: { fontSize: 16, color: '#1E232E', minHeight: 44 },
  favoriteToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  favoriteToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  favoriteToggleInfo: { gap: 2 },
  favoriteToggleLabel: { fontSize: 16, fontWeight: '500', color: '#1E232E' },
  favoriteToggleDesc: { fontSize: 13, color: '#425474' },
  favoriteToggleSwitch: { width: 52, height: 28, borderRadius: 14, backgroundColor: '#E4DEBC', justifyContent: 'center', paddingHorizontal: 2 },
  favoriteToggleSwitchOn: { backgroundColor: '#5A955A' },
  favoriteToggleThumb: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 2 },
  favoriteToggleThumbOn: { marginLeft: 24 },
  deleteButton: { marginTop: 8, paddingVertical: 14, alignItems: 'center' },
  deleteButtonText: { fontSize: 16, fontWeight: '600', color: '#F5A9A9' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingBottom: 20, paddingTop: 12, backgroundColor: '#FDFBF7', borderTopWidth: 1, borderTopColor: '#E4DEBC' },
  saveButton: { minHeight: 56 },
  loadingText: { textAlign: 'center', marginTop: 100, color: '#425474' },
});