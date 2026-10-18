import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, Alert, Keyboard } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { gratitudeRepository } from '../../database/repositories/gratitudeRepository';
import { positiveMomentRepository } from '../../database/repositories/positiveMomentRepository';
import { Card } from '../../components/Card';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme/ThemeContext';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { ScreenHeader, TactilePressable } from '../../components';
import { PopIn } from '../../components/interactive/PopIn';

type NavigationProp = NativeStackScreenProps<RootStackParamList, 'GratitudeForm'>['navigation'];
type RouteProp = NativeStackScreenProps<RootStackParamList, 'GratitudeForm'>['route'];

type EntryType = 'gratitude' | 'positive';

export function GratitudeFormScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp>();
  const { colors } = useAppTheme();
  const { type = 'gratitude', id } = (route.params ?? {}) as { type: EntryType; id?: string };
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
      const parseTags = (raw?: string | null): string[] => {
        try {
          const parsed = JSON.parse(raw || '[]');
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      };
      if (type === 'gratitude') {
        const list = (await gratitudeRepository.getAll()) ?? [];
        const entry = list.find((e) => e?.id === id);
        if (entry) {
          setText(entry?.text ?? '');
          setMood(entry?.mood ?? '');
          setTags(parseTags(entry?.tags));
          setFavorite(entry?.favorite ?? false);
        }
      } else {
        const list = (await positiveMomentRepository.getAll()) ?? [];
        const entry = list.find((e) => e?.id === id);
        if (entry) {
          setText(entry?.text ?? '');
          setMood(entry?.mood ?? '');
          setTags(parseTags(entry?.tags));
          setFavorite(entry?.favorite ?? false);
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
    if (!(text ?? '').trim()) {
      Alert.alert('Missing reflection', 'Please share what you are grateful for or what went well');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      if (type === 'gratitude') {
        if (isEditing && id) {
          await gratitudeRepository.update(id, {
            text: (text ?? '').trim(),
            mood: mood || undefined,
            tags: (tags ?? []).length > 0 ? JSON.stringify(tags) : '[]',
            favorite,
          });
        } else {
          await gratitudeRepository.create({
            text: (text ?? '').trim(),
            mood: mood || undefined,
            tags: (tags ?? []).length > 0 ? tags : undefined,
            favorite,
          });
        }
      } else {
        if (isEditing && id) {
          await positiveMomentRepository.update(id, {
            text: (text ?? '').trim(),
            mood: mood || undefined,
            tags: (tags ?? []).length > 0 ? JSON.stringify(tags) : '[]',
            favorite,
          });
        } else {
          await positiveMomentRepository.create({
            text: (text ?? '').trim(),
            mood: mood || undefined,
            tags: (tags ?? []).length > 0 ? tags : undefined,
            favorite,
          });
        }
      }
      navigation.goBack();
    } catch (error) {
      console.error('Failed to save reflection:', error);
      Alert.alert('Error', 'Failed to save entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!id) return;
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
              await gratitudeRepository.delete(id);
            } else {
              await positiveMomentRepository.delete(id);
            }
            navigation.goBack();
          },
        },
      ]
    );
  };

  const title = isEditing
    ? type === 'gratitude' ? 'Edit Gratitude' : 'Edit Good Thing'
    : type === 'gratitude' ? 'New Gratitude' : 'New Good Thing';

  const placeholder = type === 'gratitude'
    ? 'What are you genuinely grateful for in this moment? What brought a gentle smile to your face?...'
    : 'What went well today? A kind word, personal milestone, or peaceful moment?...';

  return (
    <ScreenContainer scroll={false} backgroundColor={colors.background.default}>
      <ScreenHeader title={title} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        onTouchStart={() => Keyboard.dismiss()}
        showsVerticalScrollIndicator={false}
      >
        <PopIn index={0}>
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>Your Reflection</Text>
          <TextInput
            style={[styles.textArea, { color: colors.text.primary }]}
            placeholder={placeholder}
            value={text}
            onChangeText={setText}
            placeholderTextColor={colors.text.tertiary}
            multiline
            numberOfLines={5}
            maxLength={1000}
            autoFocus={!isEditing}
          />
        </Card>
        </PopIn>

        <PopIn index={1}>
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>Associated Emotion</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.moodScroll}>
            {(MOODS ?? []).map((m) => {
              const isSelected = mood === m;
              return (
                <TactilePressable
                  key={m}
                  onPress={() => setMood(isSelected ? '' : m)}
                  style={[
                    styles.moodChip,
                    { backgroundColor: colors.surface.default, borderColor: colors.border.default },
                    isSelected && { backgroundColor: colors.primary.default, borderColor: colors.primary.default },
                  ]}
                >
                  <Text
                    style={[
                      styles.moodChipText,
                      { color: isSelected ? '#FFFFFF' : colors.text.primary },
                      isSelected && { fontWeight: '700' },
                    ]}
                  >
                    {m}
                  </Text>
                </TactilePressable>
              );
            })}
          </ScrollView>
        </Card>
        </PopIn>

        <PopIn index={2}>
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>Tags (Optional)</Text>
          <TextInput
            style={[styles.input, { color: colors.text.primary, borderBottomColor: colors.border.default }]}
            placeholder="e.g. morning, nature, friends (comma separated)"
            value={(tags ?? []).join(', ')}
            onChangeText={(t) => setTags((t ?? '').split(',').map((s) => s.trim()).filter(Boolean))}
            placeholderTextColor={colors.text.tertiary}
          />
        </Card>
        </PopIn>

        <PopIn index={3}>
        <Card style={styles.section}>
          <TactilePressable onPress={() => setFavorite(!favorite)} style={styles.favoriteToggle}>
            <View style={styles.favoriteToggleLeft}>
              <Ionicons
                name={favorite ? 'heart' : 'heart-outline'}
                size={24}
                color={favorite ? (colors.accents.peach) : colors.text.tertiary}
                style={{ marginTop: 2 }}
              />
              <View style={styles.favoriteToggleInfo}>
                <Text style={[styles.favoriteToggleLabel, { color: colors.text.primary }]}>Star as Favorite</Text>
                <Text style={[styles.favoriteToggleDesc, { color: colors.text.tertiary }]}>
                  {type === 'gratitude'
                    ? 'Featured in your mindful gratitude collection'
                    : 'May resurface in gentle "Remember this?" reminders'}
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.favoriteToggleSwitch,
                { backgroundColor: colors.border.default, marginTop: 2 },
                favorite && { backgroundColor: colors.primary.default },
              ]}
            >
              <View style={[styles.favoriteToggleThumb, favorite && styles.favoriteToggleThumbOn]} />
            </View>
          </TactilePressable>
        </Card>
        </PopIn>

        <PopIn index={4}>
        <View style={styles.buttonRow}>
          <View style={{ flex: 1 }}>
            <PrimaryButton
              onPress={handleSave}
              loading={loading}
              title={isEditing ? 'Save Changes' : 'Save Reflection'}
              fullWidth
            />
          </View>
          {isEditing && (
            <TactilePressable
              onPress={handleDelete}
              style={[styles.deleteButton, { borderColor: colors.accents.rose }]}
            >
              <Text style={[styles.deleteButtonText, { color: colors.accents.rose }]}>Delete</Text>
            </TactilePressable>
          )}
        </View>
        </PopIn>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 110, gap: 16 },
  section: { gap: 10, padding: 16, borderRadius: 20 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textArea: { fontSize: 16, minHeight: 120, textAlignVertical: 'top', lineHeight: 24 },
  moodScroll: { gap: 8, paddingVertical: 4 },
  moodChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
  },
  moodChipText: { fontSize: 14, fontWeight: '500', textTransform: 'capitalize' },
  input: { fontSize: 15, paddingVertical: 8, borderBottomWidth: 1 },
  favoriteToggle: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  favoriteToggleLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, flex: 1, paddingRight: 8 },
  favoriteToggleInfo: { gap: 3, flex: 1 },
  favoriteToggleLabel: { fontSize: 15, fontWeight: '600', lineHeight: 22 },
  favoriteToggleDesc: { fontSize: 12, lineHeight: 18 },
  favoriteToggleSwitch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  favoriteToggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  favoriteToggleThumbOn: { marginLeft: 22 },
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  deleteButton: {
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: { fontSize: 15, fontWeight: '600' },
});