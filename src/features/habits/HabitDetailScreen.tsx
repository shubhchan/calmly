import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { habitRepository } from '../../database/repositories/habitRepository';
import { notificationService } from '../../services/notifications';
import Habit from '../../database/models/Habit';
import { HabitCompletion } from '../../database/models';
import { getHabitEncouragement } from '../../utils/encouragement';
import { getIconName } from '../../utils/iconMap';
import { Card } from '../../components/Card';
import { AppText, ScreenHeader, TactilePressable } from '../../components';
import { Ionicons } from '@expo/vector-icons';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from 'date-fns';
import { useAppTheme } from '../../theme/ThemeContext';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { PopIn } from '../../components/interactive/PopIn';
import { DetailSkeleton } from '../../components/interactive/LoadingState';
import { resolveTint } from '../../theme/tints';

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
  const { colors, isDark } = useAppTheme();
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

  const completionDates = new Set((completions ?? []).filter((c) => c?.completed).map((c) => c?.date ?? ''));

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
            await notificationService?.syncHabitReminders?.();
            navigation.goBack();
          },
        },
      ]
    );
  };

  if (!id) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background.default, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={[styles.loadingText, { color: colors.text.secondary }]}>Not found</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <ScreenContainer contentContainerStyle={styles.content}>
        <DetailSkeleton />
      </ScreenContainer>
    );
  }

  if (!habit) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background.default, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={[styles.loadingText, { color: colors.text.secondary }]}>Habit not found</Text>
      </View>
    );
  }

  const safeCompletions = completions ?? [];
  const completionRate =
    (safeCompletions ?? []).length > 0
      ? Math.round(((safeCompletions ?? []).filter((c) => c?.completed).length / (safeCompletions ?? []).length) * 100)
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

  const habitAccentColor = habit?.color || colors.primary.default;
  const sageTint = resolveTint(!!isDark, 'sage');

  return (
    <ScreenContainer scroll={false} backgroundColor={colors.background.default}>
      <ScreenHeader
        right={
          <View style={styles.headerActions}>
            <TactilePressable
              onPress={handleEdit}
              style={[styles.actionButton, { backgroundColor: colors.surface.default, borderColor: colors.border.default }]}
            >
              <Ionicons name="create-outline" size={20} color={colors.primary.default} />
            </TactilePressable>
            <TactilePressable
              onPress={handleDelete}
              style={[styles.actionButton, { backgroundColor: colors.surface.default, borderColor: colors.border.default }]}
            >
              <Ionicons name="trash-outline" size={20} color={colors.accents.rose} />
            </TactilePressable>
          </View>
        }
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <PopIn index={1}>
      <Card tone="sage" style={styles.habitHero}>
        <View style={[styles.habitIconLarge, { backgroundColor: habitAccentColor }]}>
          <Ionicons name={getIconName(habit?.icon ?? '') as any} size={36} color="#FFFFFF" />
        </View>
        <Text style={[styles.habitName, { color: sageTint.text }]}>{habit?.name ?? ''}</Text>
        <View style={styles.habitMeta}>
          <Text style={[styles.habitFrequency, { color: sageTint.muted }]}>
            {FREQUENCY_LABELS[habit?.frequency ?? ''] || habit?.frequency || ''}
            {habit?.frequency === 'custom' && customDayLabels ? ` • ${customDayLabels}` : ''}
          </Text>
          {habit?.reminderTime ? (
            <View style={styles.reminderBadge}>
              <Ionicons name="alarm-outline" size={13} color={sageTint.accent} />
              <Text style={[styles.habitReminder, { color: sageTint.accent }]}>{habit.reminderTime}</Text>
            </View>
          ) : null}
        </View>
      </Card>
      </PopIn>

      <PopIn index={2}>
      <View style={styles.statsRow}>
        <Card variant="outlined" style={styles.statTile}>
          <Ionicons name="flame-outline" size={16} color={habitAccentColor} />
          <AppText variant="h3">{`${streak?.current ?? 0}`}</AppText>
          <AppText variant="caption" tone="tertiary" numberOfLines={1}>Day streak</AppText>
        </Card>
        <Card variant="outlined" style={styles.statTile}>
          <Ionicons name="trophy-outline" size={16} color={colors.accents.lavender} />
          <AppText variant="h3">{`${streak?.longest ?? 0}`}</AppText>
          <AppText variant="caption" tone="tertiary" numberOfLines={1}>Best streak</AppText>
        </Card>
        <Card variant="outlined" style={styles.statTile}>
          <Ionicons name="pie-chart-outline" size={16} color={colors.accents.sky} />
          <AppText variant="h3">{`${completionRate}%`}</AppText>
          <AppText variant="caption" tone="tertiary" numberOfLines={1}>Completion</AppText>
        </Card>
      </View>
      </PopIn>

      <PopIn index={3}>
      <Card style={styles.calendarCard}>
        <View style={styles.calendarHeader}>
          <TactilePressable
            onPress={() => {
              try {
                setCurrentMonth(subMonths(currentMonth instanceof Date ? currentMonth : new Date(), 1));
              } catch {}
            }}
            style={styles.navButton}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text.primary} />
          </TactilePressable>
          <Text style={[styles.calendarTitle, { color: colors.text.primary }]}>{calendarTitle}</Text>
          <TactilePressable
            onPress={() => {
              try {
                setCurrentMonth(addMonths(currentMonth instanceof Date ? currentMonth : new Date(), 1));
              } catch {}
            }}
            style={styles.navButton}
          >
            <Ionicons name="chevron-forward" size={22} color={colors.text.primary} />
          </TactilePressable>
        </View>

        <View style={styles.calendarWeekdays}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
            <Text key={`${day}-${idx}`} style={[styles.calendarWeekday, { color: colors.text.tertiary }]}>
              {day}
            </Text>
          ))}
        </View>

        <View style={styles.calendarGrid}>
          {[...Array(Math.max(0, firstDayOfMonth))].map((_, i) => (
            <View key={`empty-${i}`} style={styles.calendarDay} />
          ))}
          {monthDays.map((day) => {
            let dayStr = '';
            try {
              dayStr = day.toISOString().split('T')[0] ?? '';
            } catch {
              dayStr = '';
            }
            const isCompleted = completionDates.has(dayStr);
            const isTodayDay = dayStr === todayStr;
            const isFuture = day > today;

            return (
              <TactilePressable
                key={dayStr}
                onPress={() => !isFuture && toggleCompletion(day)}
                disabled={isFuture}
                hapticStyle="none"
                style={[
                  styles.calendarDay,
                  isCompleted && { backgroundColor: habitAccentColor },
                  isTodayDay && !isCompleted && { borderWidth: 2, borderColor: habitAccentColor },
                  isFuture && { opacity: 0.3 },
                ]}
              >
                <Text
                  style={[
                    styles.calendarDayText,
                    { color: colors.text.primary },
                    isCompleted && { color: '#FFFFFF', fontWeight: '700' },
                    isTodayDay && !isCompleted && { color: habitAccentColor, fontWeight: '700' },
                    isFuture && { color: colors.text.tertiary },
                  ]}
                >
                  {day.getDate()}
                </Text>
              </TactilePressable>
            );
          })}
        </View>

        <View style={styles.calendarLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: habitAccentColor }]} />
            <Text style={[styles.legendText, { color: colors.text.secondary }]}>Completed</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { borderWidth: 2, borderColor: habitAccentColor }]} />
            <Text style={[styles.legendText, { color: colors.text.secondary }]}>Today</Text>
          </View>
        </View>
      </Card>
      </PopIn>

      {habit?.notes ? (
        <PopIn index={4}>
        <Card style={styles.notesCard}>
          <Text style={[styles.notesLabel, { color: colors.text.secondary }]}>Mindful Intention</Text>
          <Text style={[styles.notesText, { color: colors.text.primary }]}>{habit.notes}</Text>
        </Card>
        </PopIn>
      ) : null}

      <PopIn index={5}>
      <View style={[styles.encouragementCard, { backgroundColor: habitAccentColor + '14', borderColor: habitAccentColor + '30' }]}>
        <Ionicons name="sparkles" size={20} color={habitAccentColor} style={{ marginBottom: 6 }} />
        <Text style={[styles.encouragementText, { color: colors.text.primary }]}>
          {getHabitEncouragement('streak', streak?.current ?? 0)}
        </Text>
      </View>
      </PopIn>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 110, gap: 18 },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitHero: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 8,
  },
  habitIconLarge: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 4,
  },
  habitName: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  habitMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  habitFrequency: {
    fontSize: 14,
  },
  reminderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  habitReminder: {
    fontSize: 13,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statTile: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    gap: 4,
  },
  calendarCard: {
    borderRadius: 20,
    padding: 16,
    gap: 14,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    padding: 8,
  },
  calendarTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  calendarWeekdays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calendarWeekday: {
    width: 38,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 8,
  },
  calendarDay: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDayText: {
    fontSize: 14,
    fontWeight: '500',
  },
  calendarLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    paddingTop: 8,
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
  legendText: {
    fontSize: 12,
  },
  notesCard: {
    padding: 16,
    borderRadius: 18,
    gap: 6,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notesText: {
    fontSize: 15,
    lineHeight: 22,
  },
  encouragementCard: {
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  encouragementText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingText: {
    fontSize: 15,
  },
});