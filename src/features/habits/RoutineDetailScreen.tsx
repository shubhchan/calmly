import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Keyboard, FlatList } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { routineRepository, TimeOfDay } from '../../database/repositories/routineRepository';
import { habitRepository } from '../../database/repositories/habitRepository';
import Habit from '../../database/models/Habit';
import { Card } from '../../components/Card';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Ionicons } from '@expo/vector-icons';

type NavigationProp = NativeStackScreenProps<RootStackParamList, 'RoutineDetail'>['navigation'];
type RouteProp = NativeStackScreenProps<RootStackParamList, 'RoutineDetail'>['route'];

const TIME_OF_DAY_CONFIG: Record<TimeOfDay, { label: string; icon: string; color: string; emoji: string }> = {
  morning: { label: 'Morning', icon: 'sunny', color: '#F5C6A5', emoji: '🌅' },
  afternoon: { label: 'Afternoon', icon: 'sunny-outline', color: '#A8D0E6', emoji: '☀️' },
  evening: { label: 'Evening', icon: 'moon', color: '#B19CD9', emoji: '🌙' },
};

export function RoutineDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp>();
  const { timeOfDay = 'morning', routine } = route.params ?? {};
  const isEditing = !!routine;

  const config = TIME_OF_DAY_CONFIG[timeOfDay] ?? TIME_OF_DAY_CONFIG.morning;
  const [name, setName] = useState(routine?.name ?? '');
  const [habits, setHabits] = useState<Habit[]>([]);
  const [selectedHabitIds, setSelectedHabitIds] = useState<string[]>(() => {
    try {
      const items = Array.isArray(routine?.items) ? routine.items : [];
      return items.map((i: any) => i?.habitId).filter(Boolean);
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);

  const loadHabits = useCallback(async () => {
    try {
      const allHabits = await habitRepository.getAll(false);
      setHabits(allHabits ?? []);
    } catch (error) {
      console.error('Failed to load habits:', error);
      setHabits((prev) => prev ?? []);
    }
  }, []);

  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  const toggleHabit = (habitId: string) => {
    if (!habitId) return;
    setSelectedHabitIds((prev) =>
      (prev ?? []).includes(habitId) ? (prev ?? []).filter((id) => id !== habitId) : [...(prev ?? []), habitId]
    );
  };

  const moveHabit = (fromIndex: number, toIndex: number) => {
    const safeIds = selectedHabitIds ?? [];
    if (fromIndex < 0 || toIndex < 0 || fromIndex >= safeIds.length || toIndex >= safeIds.length) return;
    const newOrder = [...safeIds];
    const [removed] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, removed);
    setSelectedHabitIds(newOrder);
  };

  const validate = (): boolean => {
    if (!(name ?? '').trim()) {
      Alert.alert('Missing name', 'Please enter a routine name');
      return false;
    }
    if ((selectedHabitIds ?? []).length === 0) {
      Alert.alert('No habits', 'Please select at least one habit for this routine');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    if (isEditing && !routine?.id) {
      Alert.alert('Error', 'Missing routine id. Please try again.');
      return;
    }
    setLoading(true);
    try {
      if (isEditing) {
        await routineRepository.update(routine.id, { name: (name ?? '').trim(), habitIds: selectedHabitIds ?? [] });
      } else {
        await routineRepository.create({ name: (name ?? '').trim(), timeOfDay: timeOfDay ?? 'morning', habitIds: selectedHabitIds ?? [] });
      }
      navigation.goBack();
    } catch (error) {
      console.error('Failed to save routine:', error);
      Alert.alert('Error', 'Failed to save routine. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!routine?.id) return;
    Alert.alert(
      'Delete routine?',
      'This will remove the routine but your habits will remain.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!routine?.id) return;
            await routineRepository.delete(routine.id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const selectedHabits = (() => {
    try {
      return ((selectedHabitIds ?? []).map((id) => {
        try {
          return (habits ?? []).find((h) => h?.id === id);
        } catch {
          return undefined;
        }
      }).filter(Boolean) ?? []) as Habit[];
    } catch {
      return [] as Habit[];
    }
  })();

  const renderHabitItem = ({ item, index }: { item: Habit; index: number }) => {
    if (!item) return null;
    const isSelected = (selectedHabitIds ?? []).includes(item?.id);
    return (
    <TouchableOpacity
      style={[
        styles.habitSelectItem,
        isSelected && styles.habitSelectItemSelected,
      ]}
      onPress={() => item?.id && toggleHabit(item.id)}
    >
      <View style={styles.habitSelectLeft}>
        <View style={styles.dragHandle}>
          <Ionicons name="reorder-three-outline" size={20} color="#425474" />
        </View>
        <View style={[styles.habitSelectIcon, { backgroundColor: item?.color ?? '#8FBC8F' }]}>
          <Ionicons name={getIconName(item?.icon ?? '')} size={20} color="white" />
        </View>
        <View style={styles.habitSelectInfo}>
          <Text style={styles.habitSelectName}>{item?.name ?? ''}</Text>
          <Text style={styles.habitSelectFrequency}>{FREQUENCY_LABELS[item?.frequency ?? ''] ?? item?.frequency ?? ''}</Text>
        </View>
      </View>
      <View style={styles.habitSelectRight}>
        <Ionicons
          name={isSelected ? 'checkmark-circle' : 'circle-outline'}
          size={24}
          color={isSelected ? '#5A955A' : '#425474'}
        />
        {isSelected && (
          <Text style={styles.habitSelectOrder}>#{(selectedHabitIds ?? []).indexOf(item?.id) + 1}</Text>
        )}
      </View>
    </TouchableOpacity>
    );
  };

  function getIconName(icon?: string | null): string {
    const iconMap: Record<string, string> = {
      water: 'water', fitness: 'fitness', book: 'book', meditation: 'meditation',
      sunny: 'sunny', moon: 'moon', leaf: 'leaf', heart: 'heart',
      'musical-notes': 'musical-notes', camera: 'camera', bicycle: 'bicycle',
      walk: 'walk', sleep: 'bed', nutrition: 'nutrition', code: 'code',
      brush: 'brush', pill: 'pill', flash: 'flash', diamond: 'diamond',
      star: 'star', flower: 'flower', tree: 'tree', cloud: 'cloud', flame: 'flame',
    };
    return iconMap[icon ?? ''] || 'checkbox-outline';
  }

  const FREQUENCY_LABELS: Record<string, string> = {
    daily: 'Daily',
    weekdays: 'Weekdays',
    custom: 'Custom',
  };

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
          <View style={styles.headerCenter}>
            <View style={[styles.headerIcon, { backgroundColor: config?.color ?? '#8FBC8F' }]}>
              <Ionicons name={config?.icon ?? 'list-outline'} size={28} color="white" />
            </View>
            <Text style={styles.headerTitle}>{config?.emoji ?? ''} {config?.label ?? ''} Routine</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Routine Name</Text>
          <TextInput
            style={styles.input}
            placeholder={`${config?.label ?? 'Routine'} routine name`}
            value={name}
            onChangeText={setName}
            placeholderTextColor="#425474"
            autoCapitalize="words"
            maxLength={50}
          />
        </Card>

        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Habits ({(selectedHabitIds ?? []).length})</Text>
            {(selectedHabitIds ?? []).length > 0 && (
              <Text style={styles.sectionSubtitle}>Drag to reorder</Text>
            )}
          </View>

          {(habits ?? []).length === 0 ? (
            <View style={styles.noHabits}>
              <Ionicons name="add-circle-outline" size={32} color="#425474" />
              <Text style={styles.noHabitsText}>No habits created yet</Text>
              <Text style={styles.noHabitsSubtext}>Create habits first, then add them here</Text>
            </View>
          ) : (
            <FlatList
              data={habits ?? []}
              keyExtractor={(item, idx) => item?.id ?? String(idx)}
              renderItem={renderHabitItem}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              ListEmptyComponent={
                <View style={styles.noSelected}>
                  <Ionicons name="checkbox-outline" size={32} color="#425474" />
                  <Text style={styles.noSelectedText}>No habits selected</Text>
                  <Text style={styles.noSelectedSubtext}>Tap habits above to add them</Text>
                </View>
              }
            />
          )}
        </Card>

        {isEditing && (
          <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
            <Text style={styles.deleteButtonText}>Delete Routine</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        <PrimaryButton onPress={handleSave} loading={loading} title={isEditing ? 'Save Changes' : 'Create Routine'} style={styles.saveButton} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFBF7',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    justifyContent: 'center',
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E232E',
  },
  headerSpacer: {
    width: 44,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34415A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#425474',
  },
  input: {
    fontSize: 17,
    color: '#1E232E',
    minHeight: 44,
  },
  habitSelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  habitSelectItemSelected: {
    backgroundColor: 'rgba(143, 188, 143, 0.05)',
    borderRadius: 12,
    marginHorizontal: -4,
    paddingHorizontal: 4,
  },
  habitSelectLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  dragHandle: {
    padding: 8,
  },
  habitSelectIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitSelectInfo: {
    gap: 2,
  },
  habitSelectName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1E232E',
  },
  habitSelectFrequency: {
    fontSize: 12,
    color: '#425474',
  },
  habitSelectRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  habitSelectOrder: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5A955A',
    minWidth: 20,
    textAlign: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: '#E4DEBC',
    marginHorizontal: -4,
  },
  noHabits: {
    alignItems: 'center',
    paddingVertical: 30,
    gap: 8,
  },
  noHabitsText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#34415A',
  },
  noHabitsSubtext: {
    fontSize: 14,
    color: '#425474',
    textAlign: 'center',
  },
  noSelected: {
    alignItems: 'center',
    paddingVertical: 30,
    gap: 8,
  },
  noSelectedText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#34415A',
  },
  noSelectedSubtext: {
    fontSize: 14,
    color: '#425474',
    textAlign: 'center',
  },
  deleteButton: {
    marginTop: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F5A9A9',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 12,
    backgroundColor: '#FDFBF7',
    borderTopWidth: 1,
    borderTopColor: '#E4DEBC',
  },
  saveButton: {
    minHeight: 56,
  },
});