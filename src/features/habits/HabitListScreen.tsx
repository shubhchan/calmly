import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { habitRepository } from '../../database/repositories/habitRepository';
import Habit from '../../database/models/Habit';
import { getHabitEncouragement } from '../../utils/encouragement';
import { PrimaryButton } from '../../components/PrimaryButton';
import { StatPill } from '../../components/StatPill';
import { HabitPlantingIllustration } from '../../components';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../theme/ThemeContext';

type NavigationProp = NativeStackScreenProps<RootStackParamList, 'Habits'>['navigation'];

const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Daily',
  weekdays: 'Weekdays',
  custom: 'Custom',
};

const COLORS = [
  '#8FBC8F', '#B19CD9', '#A8D0E6', '#F5C6A5', '#F5A9A9', '#9FD8A8',
  '#D8A8E8', '#A8D8E8', '#F5D8A8', '#E8A8D8', '#A8E8D8', '#E8D8A8',
];

function getIconName(icon?: string | null): any {
  const iconMap: Record<string, string> = {
    water: 'water-outline',
    fitness: 'fitness-outline',
    book: 'book-outline',
    meditation: 'flower-outline',
    sunny: 'sunny-outline',
    moon: 'moon-outline',
    leaf: 'leaf-outline',
    heart: 'heart-outline',
    'musical-notes': 'musical-notes-outline',
    camera: 'camera-outline',
    bicycle: 'bicycle-outline',
    walk: 'walk-outline',
    sleep: 'bed-outline',
    nutrition: 'nutrition-outline',
    code: 'code-slash-outline',
    brush: 'brush-outline',
    pill: 'medical-outline',
    flash: 'flash-outline',
    diamond: 'diamond-outline',
    star: 'star-outline',
    flower: 'flower-outline',
    tree: 'leaf-outline',
    cloud: 'cloud-outline',
    flame: 'flame-outline',
  };
  return iconMap[icon ?? ''] || 'checkbox-outline';
}

export function HabitListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const colors = useThemeColors();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [todayCompletions, setTodayCompletions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [showEmptyState, setShowEmptyState] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [allHabits, completions] = await Promise.all([
        habitRepository.getAll(false),
        habitRepository.getTodayCompletions(),
      ]);
      const safeHabits = allHabits ?? [];
      setHabits(safeHabits);
      setTodayCompletions(completions ?? {});
      setShowEmptyState((safeHabits ?? []).length === 0);
    } catch (error) {
      console.error('Failed to load habits:', error);
      setHabits((prev) => prev ?? []);
      setTodayCompletions((prev) => prev ?? {});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const toggleHabit = async (habit: Habit, completed: boolean) => {
    if (!habit?.id) return;
    const today = new Date().toISOString().split('T')[0];
    try {
      if (completed) {
        await habitRepository.uncomplete(habit.id, today);
      } else {
        await habitRepository.complete(habit.id, today);
      }
      setTodayCompletions((prev) => ({ ...prev, [habit.id]: !completed }));

      if (!completed) {
        const streak = await habitRepository.getStreak(habit.id);
        if ((streak?.current ?? 0) > 1) {
          Alert.alert('Streak!', getHabitEncouragement('streak', streak?.current ?? 0));
        } else {
          Alert.alert('Done!', getHabitEncouragement('complete'));
        }
      }
    } catch (error) {
      console.error('Failed to toggle habit:', error);
    }
  };

  const handleAddHabit = () => {
    navigation.navigate('HabitForm');
  };

  const handleHabitPress = (habit: Habit) => {
    if (!habit?.id) return;
    navigation.navigate('HabitDetail', { id: habit.id });
  };

  const isDueToday = (habit: Habit): boolean => {
    if (!habit) return true;
    const today = new Date();
    const dayOfWeek = today.getDay();
    const frequency = habit?.frequency;
    let customDays: string[] = [];
    try {
      const parsed = JSON.parse(habit?.customDays || '[]');
      customDays = Array.isArray(parsed) ? parsed : [];
    } catch {
      customDays = [];
    }

    if (frequency === 'daily') return true;
    if (frequency === 'weekdays') return dayOfWeek >= 1 && dayOfWeek <= 5;
    if (frequency === 'custom') return customDays.includes(dayOfWeek.toString());
    return true;
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bgPrimary, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading mindful habits...</Text>
      </View>
    );
  }

  const dueHabits = (habits ?? []).filter(isDueToday);
  const safeCompletions = todayCompletions ?? {};
  const completedCount = (dueHabits ?? []).filter((h) => h?.id && safeCompletions[h.id]).length;
  const totalDue = (dueHabits ?? []).length;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bgPrimary }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Habits</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Nurture your daily rhythm</Text>
        </View>
        <TouchableOpacity
          onPress={handleAddHabit}
          style={[styles.addButton, { backgroundColor: colors.accentPrimary }]}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {totalDue > 0 && (
        <View
          style={[
            styles.progressCard,
            { backgroundColor: colors.bgCard, borderColor: colors.borderLight },
          ]}
        >
          <View style={styles.progressCardTop}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.progressNumber, { color: colors.textPrimary }]}>
                {completedCount} of {totalDue} Completed
              </Text>
              <Text style={[styles.encouragementText, { color: colors.textTertiary }]}>
                {completedCount === totalDue && totalDue > 0
                  ? getHabitEncouragement('complete')
                  : getHabitEncouragement('empty')}
              </Text>
            </View>
            <View style={[styles.percentageBadge, { backgroundColor: colors.accentBg }]}>
              <Text style={[styles.percentageText, { color: colors.accentPrimary }]}>
                {totalDue > 0 ? Math.round((completedCount / totalDue) * 100) : 0}%
              </Text>
            </View>
          </View>

          <View style={[styles.progressTrack, { backgroundColor: colors.borderLight }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${totalDue > 0 ? Math.min(Math.round((completedCount / totalDue) * 100), 100) : 0}%`,
                  backgroundColor: colors.accentPrimary,
                },
              ]}
            />
          </View>
        </View>
      )}

      {showEmptyState ? (
        <View style={styles.emptyState}>
          <HabitPlantingIllustration width={160} height={135} style={{ marginBottom: 6 }} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No habits yet</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{getHabitEncouragement('empty')}</Text>
          <PrimaryButton onPress={handleAddHabit} title="Create Your First Habit" style={styles.emptyButton} />
        </View>
      ) : (
        <View style={styles.list}>
          {(dueHabits ?? []).map((habit) => {
            let dayLabels: string[] = [];
            try {
              const parsed = JSON.parse(habit?.customDays || '[]');
              const arr = Array.isArray(parsed) ? parsed : [];
              dayLabels = arr.map((d: string) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][parseInt(d ?? '', 10)] ?? '');
            } catch {
              dayLabels = [];
            }
            const isCompleted = !!(habit?.id && safeCompletions[habit.id]);
            const habitColor = habit?.color || COLORS[0];

            return (
              <TouchableOpacity
                key={habit?.id ?? Math.random().toString()}
                onPress={() => handleHabitPress(habit)}
                style={[
                  styles.habitCard,
                  { backgroundColor: colors.bgCard, borderColor: colors.borderLight },
                  isCompleted && { borderColor: habitColor + '40' },
                ]}
                activeOpacity={0.75}
              >
                <View style={styles.habitLeft}>
                  <View style={[styles.habitIcon, { backgroundColor: habitColor }]}>
                    <Ionicons name={getIconName(habit?.icon)} size={22} color="#FFFFFF" />
                  </View>
                  <View style={styles.habitInfo}>
                    <Text
                      style={[
                        styles.habitName,
                        { color: colors.textPrimary },
                        isCompleted && { opacity: 0.75, textDecorationLine: 'line-through' },
                      ]}
                    >
                      {habit?.name ?? ''}
                    </Text>
                    <Text style={[styles.habitFrequency, { color: colors.textTertiary }]}>
                      {FREQUENCY_LABELS[habit?.frequency ?? ''] || habit?.frequency || ''}
                      {habit?.frequency === 'custom' && dayLabels.length > 0 && ` • ${dayLabels.join(', ')}`}
                    </Text>
                  </View>
                </View>

                <View style={styles.habitRight}>
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      toggleHabit(habit, isCompleted);
                    }}
                    style={[
                      styles.checkButton,
                      { borderColor: habitColor },
                      isCompleted && { backgroundColor: habitColor },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={isCompleted ? 'checkmark' : 'checkmark-outline'}
                      size={20}
                      color={isCompleted ? '#FFFFFF' : habitColor}
                    />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}

          {(habits ?? []).length > (dueHabits ?? []).length && (
            <Text style={[styles.notDueText, { color: colors.textTertiary }]}>
              {(habits ?? []).length - (dueHabits ?? []).length} habit{(habits ?? []).length - (dueHabits ?? []).length > 1 ? 's' : ''} scheduled for other days
            </Text>
          )}
        </View>
      )}

      <View style={[styles.bottomActions, { borderTopColor: colors.borderLight }]}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Routines')}
          style={[styles.routineButton, { borderColor: colors.accentPrimary, backgroundColor: colors.bgCard }]}
          activeOpacity={0.8}
        >
          <Ionicons name="list-outline" size={20} color={colors.accentPrimary} />
          <Text style={[styles.routineButtonText, { color: colors.accentPrimary }]}>Mindful Routines</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 110 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 32, fontWeight: '700', letterSpacing: -0.5 },
  subtitle: { fontSize: 15, marginTop: 4 },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  progressCard: {
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 20,
    gap: 12,
  },
  progressCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  progressNumber: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  encouragementText: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
  },
  percentageBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
  },
  percentageText: {
    fontSize: 13,
    fontWeight: '800',
  },
  progressTrack: {
    height: 7,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  emptyButton: {
    marginTop: 12,
    minWidth: 220,
  },
  list: {
    gap: 12,
  },
  habitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 15,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  habitLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  habitIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  habitInfo: {
    flex: 1,
    gap: 3,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  habitFrequency: {
    fontSize: 13,
    lineHeight: 18,
  },
  habitRight: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  checkButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  notDueText: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    paddingVertical: 8,
  },
  bottomActions: {
    paddingTop: 20,
    borderTopWidth: 1,
    marginTop: 16,
  },
  routineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  routineButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  loadingText: {
    fontSize: 15,
  },
});