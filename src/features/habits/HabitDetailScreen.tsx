import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { habitRepository } from '../../database/repositories/habitRepository';
import Habit from '../../database/models/Habit';
import { HabitCompletion } from '../../database/models';
import { getHabitEncouragement } from '../../utils/encouragement';
import { getIconName } from '../../utils/iconMap';
import { Card } from '../../components/Card';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ProgressRing } from '../../components/ProgressRing';
import { StatPill } from '../../components/StatPill';
import { Ionicons } from '@expo/vector-icons';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, addMonths, subMonths } from 'date-fns';

type NavigationProp = NativeStackScreenProps<RootStackParamList, 'HabitDetail'>['navigation'];
type RouteProp = NativeStackScreenProps<RootStackParamList, 'HabitDetail'>['route'];

const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Daily',
  weekdays: 'Weekdays',
  custom: 'Custom',
};

export function HabitDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp>();
  const { id } = route.params ?? {};

  const [habit, setHabit] = useState<Habit | null>(null);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [streak, setStreak] = useState<{ current: number; longest: number }>({ current: 0, longest: 0 });
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const loadData = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [h, c, s] = await Promise.all([
        habitRepository.getById(id),
        habitRepository.getCompletions(id, '2020-01-01', new Date().toISOString().split('T')[0]),
        habitRepository.getStreak(id),
      ]);
      setHabit(h ?? null);
      setCompletions(c ?? []);
      setStreak(s ?? { current: 0, longest: 0 });
    } catch (error) {
      console.error('Failed to load habit detail:', error);
      setCompletions((prev) => prev ?? []);
      setStreak((prev) => prev ?? { current: 0, longest: 0 });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const completionDates = new Set((completions ?? []).filter(c => c?.completed).map(c => c?.date ?? ''));

  const getMonthDays = (date: Date) => {
    try {
      if (!(date instanceof Date) || isNaN(date.getTime())) return [];
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      return eachDayOfInterval({ start, end }) ?? [];
    } catch {
      return [];
    }
  };

  const monthDays = getMonthDays(currentMonth) ?? [];
  const firstDayOfMonth = monthDays?.[0]?.getDay?.() ?? 0;
  const today = new Date();
  let todayStr = '';
  try {
    todayStr = today.toISOString().split('T')[0] ?? '';
  } catch {
    todayStr = '';
  }

  const toggleCompletion = async (date: Date) => {
    if (!id || !(date instanceof Date) || isNaN(date.getTime())) return;
    let dateStr = '';
    try {
      dateStr = date.toISOString().split('T')[0] ?? '';
    } catch {
      return;
    }
    if (!dateStr) return;
    const isCompleted = completionDates.has(dateStr);
    try {
      if (isCompleted) {
        await habitRepository.uncomplete(id, dateStr);
        completionDates.delete(dateStr);
      } else {
        await habitRepository.complete(id, dateStr);
        completionDates.add(dateStr);
      }
      const newStreak = await habitRepository.getStreak(id);
      setStreak(newStreak ?? { current: 0, longest: 0 });
      loadData();
    } catch (error) {
      console.error('Failed to toggle completion:', error);
    }
  };

  const handleEdit = () => {
    if (!id) return;
    navigation.navigate('HabitForm', { id });
  };

  const handleDelete = () => {
    if (!id) return;
    Alert.alert(
      'Delete habit?',
      'This will remove the habit and all its completion history.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await habitRepository.delete(id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  if (!id) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Not found</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!habit) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Not found</Text>
      </View>
    );
  }

  const safeCompletions = completions ?? [];
  const completionRate = (safeCompletions ?? []).length > 0
    ? Math.round(((safeCompletions ?? []).filter(c => c?.completed).length / (safeCompletions ?? []).length) * 100)
    : 0;

  let customDayLabels = '';
  try {
    const parsed = JSON.parse(habit?.customDays || '[]');
    const arr = Array.isArray(parsed) ? parsed : [];
    customDayLabels = arr
      .map((d: string) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][parseInt(d ?? '', 10)] ?? '')
      .filter(Boolean)
      .join(', ');
  } catch {
    customDayLabels = '';
  }

  let calendarTitle = '';
  try {
    calendarTitle = format(currentMonth instanceof Date && !isNaN(currentMonth.getTime()) ? currentMonth : new Date(), 'MMMM yyyy');
  } catch {
    calendarTitle = '';
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.habitHeader}>
          <View style={[styles.habitIconLarge, { backgroundColor: habit?.color ?? '#8FBC8F' }]}>
            <Ionicons name={getIconName(habit?.icon ?? '')} size={36} color="white" />
          </View>
          <View style={styles.habitHeaderInfo}>
            <Text style={styles.habitName}>{habit?.name ?? ''}</Text>
            <View style={styles.habitMeta}>
              <Text style={styles.habitFrequency}>
                {FREQUENCY_LABELS[habit?.frequency ?? ''] || habit?.frequency || ''}
                {habit?.frequency === 'custom' && (
                  <>
                    {' • '}
                    {customDayLabels}
                  </>
                )}
              </Text>
              {habit?.reminderTime && (
                <Text style={styles.habitReminder}>
                  <Ionicons name="alarm-outline" size={14} color="#425474" />
                  {' '}{habit?.reminderTime ?? ''}
                </Text>
              )}
            </View>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleEdit} style={styles.actionButton}>
            <Ionicons name="create-outline" size={22} color="#5A955A" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.actionButton}>
            <Ionicons name="trash-outline" size={22} color="#F5A9A9" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsRow}>
<StatPill
            label="Current Streak"
            value={(streak?.current ?? 0).toString()}
            accentColor="#5A955A"
            icon={<Ionicons name="flame" size={16} color="#5A955A" />}
          />
          <StatPill
            label="Longest Streak"
            value={(streak?.longest ?? 0).toString()}
            accentColor="#B19CD9"
            icon={<Ionicons name="trophy" size={16} color="#B19CD9" />}
          />
          <StatPill
            label="Completion Rate"
            value={`${completionRate ?? 0}%`}
            accentColor="#A8D0E6"
            icon={<Ionicons name="analytics" size={16} color="#A8D0E6" />}
          />
      </View>

      <Card style={styles.calendarCard}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={() => { try { setCurrentMonth(subMonths(currentMonth instanceof Date ? currentMonth : new Date(), 1)); } catch {} }} style={styles.navButton}>
            <Ionicons name="chevron-back" size={24} color="#1E232E" />
          </TouchableOpacity>
          <Text style={styles.calendarTitle}>
            {calendarTitle}
          </Text>
          <TouchableOpacity onPress={() => { try { setCurrentMonth(addMonths(currentMonth instanceof Date ? currentMonth : new Date(), 1)); } catch {} }} style={styles.navButton}>
            <Ionicons name="chevron-forward" size={24} color="#1E232E" />
          </TouchableOpacity>
        </View>
        <View style={styles.calendarWeekdays}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
            <Text key={`${day}-${idx}`} style={styles.calendarWeekday}>{day ?? ''}</Text>
          ))}
        </View>
        <View style={styles.calendarGrid}>
          {[...Array(firstDayOfMonth ?? 0)].map((_, i) => (
            <View key={`empty-${i}`} style={styles.calendarDay} />
          ))}
          {(monthDays ?? []).map((day) => {
            let dateStr = '';
            try {
              dateStr = day instanceof Date && !isNaN(day.getTime()) ? day.toISOString().split('T')[0] ?? '' : '';
            } catch {
              dateStr = '';
            }
            if (!dateStr) return null;
            const completed = completionDates.has(dateStr);
            let isFuture = false;
            let isTodayDay = false;
            try {
              isFuture = day > today;
              isTodayDay = isToday(day);
            } catch {
              isFuture = false;
              isTodayDay = false;
            }

            return (
              <TouchableOpacity
                key={dateStr}
                onPress={() => !isFuture && toggleCompletion(day)}
                style={[
                  styles.calendarDay,
                  completed && styles.calendarDayCompleted,
                  isTodayDay && styles.calendarDayToday,
                  isFuture && styles.calendarDayFuture,
                ]}
                disabled={isFuture}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.calendarDayText,
                  completed && styles.calendarDayTextCompleted,
                  isTodayDay && styles.calendarDayTextToday,
                  isFuture && styles.calendarDayTextFuture,
                ]}>
                  {(() => { try { return format(day, 'd'); } catch { return ''; } })()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={styles.calendarLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.legendDotCompleted]} />
            <Text style={styles.legendText}>Completed</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.legendDotToday]} />
            <Text style={styles.legendText}>Today</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.legendDotEmpty]} />
            <Text style={styles.legendText}>Missed</Text>
          </View>
        </View>
      </Card>

      {habit?.notes && (
        <Card style={styles.notesCard}>
          <Text style={styles.notesLabel}>Notes</Text>
          <Text style={styles.notesText}>{habit?.notes ?? ''}</Text>
        </Card>
      )}

      <View style={styles.encouragementCard}>
        <Text style={styles.encouragementText}>
          {(streak?.current ?? 0) > 0
            ? getHabitEncouragement('streak', streak?.current ?? 0)
            : getHabitEncouragement('empty')}
        </Text>
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  habitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  habitIconLarge: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitHeaderInfo: {
    flex: 1,
    gap: 4,
  },
  habitName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1E232E',
  },
  habitMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  habitFrequency: {
    fontSize: 14,
    color: '#34415A',
  },
  habitReminder: {
    fontSize: 14,
    color: '#425474',
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4DEBC',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  calendarCard: {
    gap: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E232E',
  },
  calendarWeekdays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  calendarWeekday: {
    width: 40,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#425474',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  calendarDay: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDayCompleted: {
    backgroundColor: '#5A955A',
  },
  calendarDayToday: {
    borderWidth: 2,
    borderColor: '#5A955A',
  },
  calendarDayFuture: {
    opacity: 0.3,
  },
  calendarDayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E232E',
  },
  calendarDayTextCompleted: {
    color: 'white',
  },
  calendarDayTextToday: {
    color: '#5A955A',
  },
  calendarDayTextFuture: {
    color: '#425474',
  },
  calendarLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    paddingTop: 8,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendDotCompleted: {
    backgroundColor: '#5A955A',
  },
  legendDotToday: {
    borderWidth: 2,
    borderColor: '#5A955A',
  },
  legendDotEmpty: {
    backgroundColor: '#E4DEBC',
  },
  legendText: {
    fontSize: 12,
    color: '#425474',
  },
  notesCard: {
    gap: 8,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34415A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notesText: {
    fontSize: 15,
    color: '#1E232E',
    lineHeight: 22,
  },
  encouragementCard: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(143, 188, 143, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(143, 188, 143, 0.3)',
    alignItems: 'center',
  },
  encouragementText: {
    fontSize: 15,
    color: '#1E232E',
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 100,
    color: '#425474',
  },
});