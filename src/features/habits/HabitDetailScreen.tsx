import React, { useEffect, useState, useCallback } from 'react';
import { ScrollView, View } from 'react-native';
import { Alert } from '../../services/appAlert';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { habitRepository } from '../../database/repositories/habitRepository';
import { notificationService } from '../../services/notifications';
import Habit from '../../database/models/Habit';
import { HabitCompletion } from '../../database/models';
import { getIconName } from '../../utils/iconMap';
import { AppText, TactilePressable } from '../../components';
import { Ionicons } from '@expo/vector-icons';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, subDays } from 'date-fns';
import { useAppTheme } from '../../theme/ThemeContext';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { DetailSkeleton } from '../../components/interactive/LoadingState';
import { hapticFeedback } from '../../utils/haptics';

type NavigationProp = NativeStackScreenProps<RootStackParamList, 'HabitDetail'>['navigation'];
type RouteProp = NativeStackScreenProps<RootStackParamList, 'HabitDetail'>['route'];

const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Every day',
  weekdays: 'Weekdays',
  custom: 'Custom',
};

const WEEKDAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/**
 * Habit detail — direction A, "Record".
 *
 * The name, one large streak number, this week, five quiet weeks of history,
 * then the facts. History stays available behind one plain link.
 */
export function HabitDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp>();
  const { colors } = useAppTheme();
  const { id, preview } = route.params ?? {};
  const previewHabit = preview ? { ...preview, id: id ?? '' } : null;

  const [habit, setHabit] = useState<Habit | null>(null);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [streak, setStreak] = useState<{ current: number; longest: number }>({ current: 0, longest: 0 });
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showHistory, setShowHistory] = useState(false);

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
      setCompletions([]);
      setStreak({ current: 0, longest: 0 });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const completionDates = new Set((completions ?? []).filter((c) => c?.completed).map((c) => c?.date ?? ''));

  const toggleCompletion = async (date: Date) => {
    if (!id || !(date instanceof Date) || isNaN(date.getTime())) return;
    const dateStr = date.toISOString().split('T')[0] ?? '';
    if (!dateStr) return;
    const isCompleted = completionDates.has(dateStr);
    try {
      if (isCompleted) {
        await habitRepository.uncomplete(id, dateStr);
      } else {
        await habitRepository.complete(id, dateStr);
        hapticFeedback.light();
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
    const source = habit ?? previewHabit;
    navigation.navigate('HabitForm', {
      id,
      preview: source
        ? {
            name: source.name ?? '',
            icon: source.icon ?? 'water',
            color: source.color ?? colors.primary.default,
            frequency: source.frequency ?? 'daily',
            customDays: source.customDays,
            reminderTime: (source as Habit).reminderTime ?? undefined,
            goal: (source as Habit).goal ?? undefined,
            notes: (source as Habit).notes ?? undefined,
          }
        : undefined,
    });
  };

  const handleDelete = () => {
    if (!id) return;
    Alert.alert('Delete habit?', 'This removes the habit and all of its history.', [
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
    ]);
  };

  if (!id) {
    return (
      <ScreenContainer contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 40 }}>
        <AppText variant="title" tone="secondary">
          Habit not found
        </AppText>
      </ScreenContainer>
    );
  }

  if (loading && !previewHabit) {
    return (
      <ScreenContainer animate={false} contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16 }}>
        <DetailSkeleton />
      </ScreenContainer>
    );
  }

  const displayHabit = habit ?? previewHabit;

  if (!displayHabit) {
    return (
      <ScreenContainer contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 40 }}>
        <AppText variant="title" tone="secondary">
          Habit not found
        </AppText>
      </ScreenContainer>
    );
  }

  let customDayLabels = '';
  try {
    const parsed = JSON.parse(displayHabit?.customDays || '[]');
    const arr = Array.isArray(parsed) ? parsed : [];
    customDayLabels = arr
      .map((d: string) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][parseInt(d ?? '', 10)] ?? '')
      .filter(Boolean)
      .join(', ');
  } catch {
    customDayLabels = '';
  }

  const frequencyLabel = FREQUENCY_LABELS[displayHabit.frequency ?? ''] || displayHabit.frequency || '';
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const todayDone = completionDates.has(todayStr);

  // Last seven days, ending today.
  const week = Array.from({ length: 7 }, (_, index) => {
    const date = subDays(today, 6 - index);
    const key = date.toISOString().split('T')[0];
    return {
      key,
      initial: WEEKDAY_INITIALS[date.getDay()],
      completed: completionDates.has(key),
      isToday: key === todayStr,
    };
  });

  // Last five weeks, oldest first.
  const history = Array.from({ length: 35 }, (_, index) => {
    const date = subDays(today, 34 - index);
    const key = date.toISOString().split('T')[0];
    return { key, completed: completionDates.has(key), isToday: key === todayStr, date };
  });

  const monthDays = (() => {
    try {
      if (!(currentMonth instanceof Date) || isNaN(currentMonth.getTime())) return [];
      return eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
    } catch {
      return [];
    }
  })();
  const firstDayOfMonth = monthDays[0]?.getDay?.() ?? 0;
  const calendarTitle = (() => {
    try {
      return format(currentMonth, 'MMMM yyyy');
    } catch {
      return '';
    }
  })();

  const startedLabel = (() => {
    const createdAt = (displayHabit as any)?.createdAt;
    if (!createdAt) return 'Recently';
    try {
      return format(new Date(createdAt), 'd MMMM');
    } catch {
      return 'Recently';
    }
  })();

  const reminderLabel = habit?.reminderTime || 'Not set';
  const bestStreak = Math.max(streak?.longest ?? 0, streak?.current ?? 0);

  return (
    <ScreenContainer
      scroll={false}
      animate={false}
      backgroundColor={colors.background.default}
    >
      <View style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 24,
            paddingTop: 8,
            height: 52,
          }}
        >
          <TactilePressable
            onPress={() => navigation.goBack()}
            scaleDownTo={0.9}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: -8,
            }}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text.secondary} />
          </TactilePressable>
          <AppText variant="caption" tone="tertiary" style={{ paddingBottom: 2 }}>
            Habit
          </AppText>
          <TactilePressable
            onPress={handleEdit}
            scaleDownTo={0.95}
            accessibilityRole="button"
            accessibilityLabel="Edit habit"
            style={{ width: 40, height: 40, alignItems: 'flex-end', justifyContent: 'center' }}
          >
            <AppText variant="label" tone="link">
              Edit
            </AppText>
          </TactilePressable>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 28 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Identity */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 18 }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.surface.selected,
              }}
            >
              <Ionicons name={getIconName(displayHabit.icon ?? '') as any} size={23} color={colors.primary.default} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="h3">{displayHabit.name}</AppText>
              <AppText variant="caption" tone="tertiary" style={{ marginTop: 2 }}>
                {frequencyLabel}
                {customDayLabels ? ` · ${customDayLabels}` : ''}
              </AppText>
            </View>
          </View>

          {/* Streak + week */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 18, marginTop: 24 }}>
            <View style={{ width: 78 }}>
              <AppText variant="display" color={colors.primary.default} style={{ fontSize: 54, lineHeight: 64, paddingBottom: 4 }}>
                {streak?.current ?? 0}
              </AppText>
              <AppText variant="caption" tone="tertiary" style={{ marginTop: 4 }}>
                days in a row
              </AppText>
            </View>
            <View style={{ flex: 1, paddingBottom: 4 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <AppText variant="caption" tone="tertiary">
                  This week
                </AppText>
                <AppText variant="caption" tone="tertiary">
                  {week.filter((day) => day.completed).length} of 7
                </AppText>
              </View>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {week.map((day) => (
                  <View key={day.key} style={{ flex: 1, alignItems: 'center' }}>
                    <View
                      style={{
                        height: 30,
                        width: '100%',
                        borderRadius: 9,
                        backgroundColor: day.completed
                          ? colors.primary.default
                          : day.isToday
                            ? colors.primary.subtleBorder
                            : colors.surface.muted,
                      }}
                    />
                    <AppText variant="caption" tone="tertiary" style={{ fontSize: 10, marginTop: 5 }}>
                      {day.initial}
                    </AppText>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Five weeks */}
          <AppText variant="overline" tone="tertiary" style={{ marginTop: 26, marginBottom: 12 }}>
            Last five weeks
          </AppText>
          <View style={{ gap: 7 }}>
            {[0, 1, 2, 3, 4].map((row) => (
              <View key={row} style={{ flexDirection: 'row', gap: 7 }}>
                {history.slice(row * 7, row * 7 + 7).map((day) => (
                  <TactilePressable
                    key={day.key}
                    onPress={() => toggleCompletion(day.date)}
                    disabled={day.date > today}
                    scaleDownTo={0.9}
                    hapticStyle="none"
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: day.completed }}
                    accessibilityLabel={`${format(day.date, 'd MMMM')}, ${day.completed ? 'done' : 'not done'}`}
                    style={{
                      flex: 1,
                      aspectRatio: 1,
                      borderRadius: 10,
                      backgroundColor: day.completed
                        ? colors.primary.default
                        : day.isToday
                          ? colors.primary.subtleBorder
                          : colors.surface.muted,
                      opacity: day.date > today ? 0.45 : 1,
                    }}
                  />
                ))}
              </View>
            ))}
          </View>

          {/* Facts */}
          <View
            style={{
              marginTop: 26,
              backgroundColor: colors.surface.default,
              borderRadius: 18,
              paddingHorizontal: 16,
              paddingVertical: 2,
            }}
          >
            <FactRow label="Best streak" value={`${bestStreak} days`} />
            <FactRow label="Reminder" value={reminderLabel} />
            <FactRow label="Started" value={startedLabel} last />
          </View>

          {/* Notes */}
          {habit?.notes ? (
            <View style={{ marginTop: 22 }}>
              <AppText variant="overline" tone="tertiary" style={{ marginBottom: 6 }}>
                Intention
              </AppText>
              <AppText variant="bodySmall" tone="secondary" style={{ lineHeight: 21 }}>
                {habit.notes}
              </AppText>
            </View>
          ) : null}

          {/* History */}
          <TactilePressable
            onPress={() => setShowHistory((value) => !value)}
            scaleDownTo={0.99}
            accessibilityRole="button"
            accessibilityState={{ expanded: showHistory }}
            accessibilityLabel="Toggle full history"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 24,
              paddingVertical: 14,
              borderTopWidth: 1,
              borderBottomWidth: 1,
              borderColor: colors.border.default,
            }}
          >
            <AppText variant="title">Full history</AppText>
            <Ionicons
              name={showHistory ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={colors.text.tertiary}
            />
          </TactilePressable>

          {showHistory ? (
            <View style={{ marginTop: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <TactilePressable
                  onPress={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  scaleDownTo={0.9}
                  accessibilityRole="button"
                  accessibilityLabel="Previous month"
                  style={{ padding: 6 }}
                >
                  <Ionicons name="chevron-back" size={19} color={colors.text.primary} />
                </TactilePressable>
                <AppText variant="title">{calendarTitle}</AppText>
                <TactilePressable
                  onPress={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  scaleDownTo={0.9}
                  accessibilityRole="button"
                  accessibilityLabel="Next month"
                  style={{ padding: 6 }}
                >
                  <Ionicons name="chevron-forward" size={19} color={colors.text.primary} />
                </TactilePressable>
              </View>

              <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                {WEEKDAY_INITIALS.map((day, index) => (
                  <AppText
                    key={`${day}-${index}`}
                    variant="caption"
                    tone="tertiary"
                    center
                    style={{ flex: 1 }}
                  >
                    {day}
                  </AppText>
                ))}
              </View>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {Array.from({ length: Math.max(0, firstDayOfMonth) }).map((_, index) => (
                  <View key={`empty-${index}`} style={{ width: `${100 / 7}%`, aspectRatio: 1 }} />
                ))}
                {monthDays.map((day) => {
                  const key = day.toISOString().split('T')[0];
                  const completed = completionDates.has(key);
                  const isFuture = day > today;
                  return (
                    <View key={key} style={{ width: `${100 / 7}%`, aspectRatio: 1, padding: 2 }}>
                      <TactilePressable
                        onPress={() => toggleCompletion(day)}
                        disabled={isFuture}
                        hapticStyle="none"
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: completed }}
                        accessibilityLabel={`${format(day, 'd MMMM')}, ${completed ? 'done' : 'not done'}`}
                        style={{
                          flex: 1,
                          borderRadius: 9,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: completed ? colors.primary.default : 'transparent',
                          borderWidth: completed ? 0 : 1,
                          borderColor: colors.border.default,
                          opacity: isFuture ? 0.3 : 1,
                        }}
                      >
                        <AppText
                          variant="caption"
                          color={completed ? colors.primary.foreground : colors.text.secondary}
                        >
                          {day.getDate()}
                        </AppText>
                      </TactilePressable>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : null}
        </ScrollView>

        {/* Bottom action */}
        <View
          style={{
            flexDirection: 'row',
            gap: 10,
            paddingHorizontal: 24,
            paddingTop: 12,
            paddingBottom: 28,
            backgroundColor: colors.background.default,
          }}
        >
          <TactilePressable
            onPress={handleDelete}
            scaleDownTo={0.95}
            accessibilityRole="button"
            accessibilityLabel="Delete habit"
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.surface.muted,
            }}
          >
            <Ionicons name="trash-outline" size={18} color={colors.text.secondary} />
          </TactilePressable>
          <TactilePressable
            onPress={() => toggleCompletion(new Date())}
            scaleDownTo={0.98}
            accessibilityRole="button"
            accessibilityLabel={todayDone ? 'Undo today' : 'Do it now'}
            style={{
              flex: 1,
              height: 52,
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: todayDone ? colors.surface.selected : colors.primary.default,
            }}
          >
            <AppText variant="button" color={todayDone ? colors.primary.default : colors.primary.foreground}>
              {todayDone ? 'Done today' : 'Do it now'}
            </AppText>
          </TactilePressable>
        </View>
      </View>
    </ScreenContainer>
  );
}

function FactRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  const { colors } = useAppTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 13,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.border.subtle,
      }}
    >
      <AppText variant="bodySmall" tone="secondary">
        {label}
      </AppText>
      <AppText variant="label">{value}</AppText>
    </View>
  );
}
