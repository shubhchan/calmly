import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, Alert, Keyboard } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { routineRepository, TimeOfDay } from '../../database/repositories/routineRepository';
import { habitRepository } from '../../database/repositories/habitRepository';
import Habit from '../../database/models/Habit';
import { Card } from '../../components/Card';
import { PrimaryButton } from '../../components/PrimaryButton';
import { TactilePressable, StaggeredEntry, ScreenHeader } from '../../components';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme/ThemeContext';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { PopIn } from '../../components/interactive/PopIn';
import { DetailSkeleton } from '../../components/interactive/LoadingState';

type NavigationProp = NativeStackScreenProps<RootStackParamList, 'RoutineDetail'>['navigation'];
type RouteProp = NativeStackScreenProps<RootStackParamList, 'RoutineDetail'>['route'];

const TIME_OF_DAY_CONFIG: Record<TimeOfDay, { label: string; icon: any; color: string }> = {
  morning: { label: 'Morning', icon: 'sunny-outline', color: '#EB876D' },
  afternoon: { label: 'Afternoon', icon: 'sunny', color: '#5A955A' },
  evening: { label: 'Evening', icon: 'moon-outline', color: '#877FC5' },
};

const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Daily',
  weekdays: 'Weekdays',
  custom: 'Custom',
};

function getIconName(icon?: string | null): any {
  const iconMap: Record<string, string> = {
    water: 'water-outline', fitness: 'fitness-outline', book: 'book-outline', meditation: 'flower-outline',
    sunny: 'sunny-outline', moon: 'moon-outline', leaf: 'leaf-outline', heart: 'heart-outline',
    'musical-notes': 'musical-notes-outline', camera: 'camera-outline', bicycle: 'bicycle-outline',
    walk: 'walk-outline', sleep: 'bed-outline', nutrition: 'nutrition-outline', code: 'code-slash-outline',
    brush: 'brush-outline', pill: 'medical-outline', flash: 'flash-outline', diamond: 'diamond-outline',
    star: 'star-outline', flower: 'flower-outline', tree: 'leaf-outline', cloud: 'cloud-outline', flame: 'flame-outline',
  };
  return iconMap[icon ?? ''] || 'checkbox-outline';
}

export function RoutineDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp>();
  const { colors } = useAppTheme();
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
  const [loadingHabits, setLoadingHabits] = useState(true);

  const loadHabits = useCallback(async () => {
    try {
      const allHabits = await habitRepository.getAll(false);
      setHabits(allHabits ?? []);
    } catch (error) {
      console.error('Failed to load habits:', error);
      setHabits((prev) => prev ?? []);
    } finally {
      setLoadingHabits(false);
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
      'This will remove the routine but your habits will remain safe.',
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

  if (loadingHabits) {
    return (
      <ScreenContainer contentContainerStyle={styles.scrollContent}>
        <DetailSkeleton />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll={false} backgroundColor={colors.background.default}>
      <ScreenHeader title={isEditing ? 'Edit Routine' : `New ${config.label} Routine`} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        onTouchStart={() => Keyboard.dismiss()}
        showsVerticalScrollIndicator={false}
      >
        <PopIn index={0}>
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>Routine Title</Text>
          <TextInput
            style={[styles.input, { color: colors.text.primary, borderBottomColor: colors.border.default }]}
            placeholder={`e.g. ${config.label} Awakening`}
            value={name}
            onChangeText={setName}
            placeholderTextColor={colors.text.tertiary}
            autoCapitalize="words"
            maxLength={50}
          />
        </Card>
        </PopIn>

        <PopIn index={1}>
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>
              Linked Habits ({selectedHabitIds.length})
            </Text>
            {selectedHabitIds.length > 0 && (
              <Text style={{ fontSize: 12, color: colors.primary.default, fontWeight: '600' }}>
                Tap checkbox to toggle
              </Text>
            )}
          </View>

          {habits.length === 0 ? (
            <View style={styles.noHabits}>
              <Ionicons name="leaf-outline" size={36} color={colors.text.tertiary} />
              <Text style={[styles.noHabitsText, { color: colors.text.secondary }]}>No habits available</Text>
              <Text style={[styles.noHabitsSubtext, { color: colors.text.tertiary }]}>
                Create habits in the Habits tab first, then link them to this routine.
              </Text>
            </View>
          ) : (
            <View style={styles.habitList}>
              {habits.map((item, index) => {
                const isSelected = selectedHabitIds.includes(item.id);
                const order = selectedHabitIds.indexOf(item.id) + 1;
                return (
                  <StaggeredEntry key={item.id} index={index}>
                    <TactilePressable
                      style={[
                        styles.habitSelectItem,
                        { backgroundColor: colors.background.secondary, borderColor: isSelected ? colors.primary.default : colors.border.default },
                        isSelected && { backgroundColor: colors.primary.default + '15', borderWidth: 2 },
                      ]}
                      onPress={() => toggleHabit(item.id)}
                      scaleDownTo={0.98}
                      hapticStyle="selection"
                    >
                      <View style={styles.habitSelectLeft}>
                        <View style={[styles.habitSelectIcon, { backgroundColor: item.color || config.color }]}>
                          <Ionicons name={getIconName(item.icon)} size={20} color="#FFFFFF" />
                        </View>
                        <View style={styles.habitSelectInfo}>
                          <Text style={[styles.habitSelectName, { color: colors.text.primary }]}>{item.name}</Text>
                          <Text style={[styles.habitSelectFrequency, { color: colors.text.tertiary }]}>
                            {FREQUENCY_LABELS[item.frequency] || item.frequency}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.habitSelectRight}>
                        {isSelected && (
                          <View style={[styles.orderBadge, { backgroundColor: colors.primary.default }]}>
                            <Text style={styles.orderBadgeText}>{order}</Text>
                          </View>
                        )}
                        <Ionicons
                          name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                          size={22}
                          color={isSelected ? colors.primary.default : colors.text.tertiary}
                        />
                      </View>
                    </TactilePressable>
                  </StaggeredEntry>
                );
              })}
            </View>
          )}
        </Card>
        </PopIn>

        <PopIn index={2}>
        <View style={styles.buttonRow}>
          <View style={{ flex: 1 }}>
            <PrimaryButton
              onPress={handleSave}
              loading={loading}
              title={isEditing ? 'Save Routine' : 'Create Routine'}
              fullWidth
            />
          </View>
          {isEditing && (
            <TactilePressable
              onPress={handleDelete}
              scaleDownTo={0.96}
              hapticStyle="medium"
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
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 110, gap: 16 },
  section: { gap: 10, padding: 16, borderRadius: 20 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    fontSize: 17,
    fontWeight: '500',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  habitList: { gap: 10, marginTop: 4 },
  habitSelectItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  habitSelectLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
  },
  habitSelectIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  habitSelectInfo: { flex: 1, gap: 3 },
  habitSelectName: { fontSize: 15, fontWeight: '600', lineHeight: 22 },
  habitSelectFrequency: { fontSize: 12, lineHeight: 16 },
  habitSelectRight: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 2,
  },
  orderBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  noHabits: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  noHabitsText: { fontSize: 15, fontWeight: '600' },
  noHabitsSubtext: { fontSize: 13, textAlign: 'center', lineHeight: 18, paddingHorizontal: 16 },
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