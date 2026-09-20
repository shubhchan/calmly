import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { habitRepository } from '../../database/repositories/habitRepository';
import Habit from '../../database/models/Habit';
import { getHabitEncouragement } from '../../utils/encouragement';
import { Card } from '../../components/Card';
import { PrimaryButton } from '../../components/PrimaryButton';
import { StatPill } from '../../components/StatPill';
import { Ionicons } from '@expo/vector-icons';

type NavigationProp = NativeStackScreenProps<RootStackParamList, 'Habits'>['navigation'];

const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Daily',
  weekdays: 'Weekdays',
  custom: 'Custom',
};

const ICONS = [
  'water', 'fitness', 'book', 'meditation', 'sunny', 'moon', 'leaf', 'heart',
  'musical-notes', 'camera', 'bicycle', 'walk', 'sleep', 'nutrition', 'code',
  'brush', 'pill', 'flash', 'diamond', 'star', 'flower', 'tree', 'cloud', 'flame',
];

const COLORS = [
  '#8FBC8F', '#B19CD9', '#A8D0E6', '#F5C6A5', '#F5A9A9', '#9FD8A8',
  '#D8A8E8', '#A8D8E8', '#F5D8A8', '#E8A8D8', '#A8E8D8', '#E8D8A8',
];

function getIconName(icon: string): string {
  const iconMap: Record<string, string> = {
    water: 'water',
    fitness: 'fitness',
    book: 'book',
    meditation: 'meditation',
    sunny: 'sunny',
    moon: 'moon',
    leaf: 'leaf',
    heart: 'heart',
    'musical-notes': 'musical-notes',
    camera: 'camera',
    bicycle: 'bicycle',
    walk: 'walk',
    sleep: 'bed',
    nutrition: 'nutrition',
    code: 'code',
    brush: 'brush',
    pill: 'pill',
    flash: 'flash',
    diamond: 'diamond',
    star: 'star',
    flower: 'flower',
    tree: 'tree',
    cloud: 'cloud',
    flame: 'flame',
  };
  return iconMap[icon] || 'checkbox-outline';
}

export function HabitListScreen() {
  const navigation = useNavigation<NavigationProp>();
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
      setHabits(allHabits);
      setTodayCompletions(completions);
      setShowEmptyState(allHabits.length === 0);
    } catch (error) {
      console.error('Failed to load habits:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleHabit = async (habit: Habit, completed: boolean) => {
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
        if (streak.current > 1) {
          Alert.alert('🔥 Streak!', getHabitEncouragement('streak', streak.current));
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

  const handleEditHabit = (habit: Habit) => {
    navigation.navigate('HabitForm', { id: habit.id });
  };

  const handleHabitPress = (habit: Habit) => {
    navigation.navigate('HabitDetail', { id: habit.id });
  };

  const handleDeleteHabit = async (habit: Habit) => {
    Alert.alert(
      'Delete habit?',
      `This will remove "${habit.name}" and all its history.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await habitRepository.delete(habit.id);
            loadData();
          },
        },
      ]
    );
  };

  const isDueToday = (habit: Habit): boolean => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const frequency = habit.frequency;
    const customDays = JSON.parse(habit.customDays || '[]');

    if (frequency === 'daily') return true;
    if (frequency === 'weekdays') return dayOfWeek >= 1 && dayOfWeek <= 5;
    if (frequency === 'custom') return customDays.includes(dayOfWeek.toString());
    return true;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading habits...</Text>
      </View>
    );
  }

  const dueHabits = habits.filter(isDueToday);
  const completedCount = dueHabits.filter((h) => todayCompletions[h.id]).length;
  const totalDue = dueHabits.length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Today's Habits</Text>
        <TouchableOpacity onPress={handleAddHabit} style={styles.addButton}>
          <Ionicons name="add" size={24} color="#5A955A" />
        </TouchableOpacity>
      </View>

      {totalDue > 0 && (
        <View style={styles.progressRow}>
          <StatPill
            label={`${completedCount}/${totalDue}`}
            value={`${Math.round((completedCount / totalDue) * 100)}%`}
            accentColor="#5A955A"
          />
          <Text style={styles.encouragement}>
            {completedCount === totalDue && totalDue > 0
              ? getHabitEncouragement('complete')
              : getHabitEncouragement('empty')}
          </Text>
        </View>
      )}

      {showEmptyState ? (
        <View style={styles.emptyState}>
          <Ionicons name="leaf" size={64} color="#425474" />
          <Text style={styles.emptyTitle}>No habits yet</Text>
          <Text style={styles.emptyText}>{getHabitEncouragement('empty')}</Text>
          <PrimaryButton onPress={handleAddHabit} title="Create Your First Habit" style={styles.emptyButton} />
        </View>
      ) : (
        <View style={styles.list}>
          {dueHabits.map((habit) => (
            <TouchableOpacity
              key={habit.id}
              onPress={() => handleHabitPress(habit)}
              style={styles.habitCard}
              activeOpacity={0.8}
            >
              <View style={styles.habitLeft}>
                <View
                  style={[
                    styles.habitIcon,
                    { backgroundColor: habit.color || COLORS[0] },
                  ]}
                >
                  <Ionicons
                    name={getIconName(habit.icon)}
                    size={24}
                    color="white"
                  />
                </View>
                <View style={styles.habitInfo}>
                  <Text style={styles.habitName}>{habit.name}</Text>
                  <Text style={styles.habitFrequency}>
                    {FREQUENCY_LABELS[habit.frequency] || habit.frequency}
                    {habit.frequency === 'custom' && (
                      <>
                        {' • '}
                        {JSON.parse(habit.customDays || '[]')
                          .map((d: string) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][parseInt(d)])
                          .join(', ')}
                      </>
                    )}
                  </Text>
                </View>
              </View>
              <View style={styles.habitRight}>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    toggleHabit(habit, todayCompletions[habit.id] || false);
                  }}
                  style={[
                    styles.checkButton,
                    todayCompletions[habit.id] && styles.checkButtonDone,
                  ]}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={todayCompletions[habit.id] ? 'checkmark' : 'checkmark-outline'}
                    size={24}
                    color={todayCompletions[habit.id] ? 'white' : '#5A955A'}
                  />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
          {habits.length > dueHabits.length && (
            <Text style={styles.notDueText}>
              {habits.length - dueHabits.length} habit{habits.length - dueHabits.length > 1 ? 's' : ''} not due today
            </Text>
          )}
        </View>
      )}

      <View style={styles.bottomActions}>
        <TouchableOpacity onPress={() => navigation.navigate('Routines')} style={styles.routineButton}>
          <Ionicons name="list-outline" size={20} color="#5A955A" />
          <Text style={styles.routineButtonText}>My Routines</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFBF7',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E232E',
  },
  addButton: {
    padding: 8,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  encouragement: {
    fontSize: 14,
    color: '#34415A',
    flex: 1,
    textAlign: 'right',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E232E',
  },
  emptyText: {
    fontSize: 16,
    color: '#34415A',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  emptyButton: {
    marginTop: 8,
    minWidth: 240,
  },
  list: {
    gap: 12,
  },
  habitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E4DEBC',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  habitLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  habitIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitInfo: {
    gap: 2,
  },
  habitName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1E232E',
  },
  habitFrequency: {
    fontSize: 13,
    color: '#425474',
  },
  habitRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#5A955A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkButtonDone: {
    backgroundColor: '#5A955A',
    borderColor: '#5A955A',
  },
  notDueText: {
    fontSize: 13,
    color: '#425474',
    textAlign: 'center',
    marginTop: 8,
    paddingVertical: 8,
  },
  bottomActions: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E4DEBC',
    marginTop: 8,
  },
  routineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: 'transparent',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#5A955A',
  },
  routineButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5A955A',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 100,
    color: '#425474',
  },
});