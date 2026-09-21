import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Card, CardContent, PrimaryButton, ProgressRing, StatPill } from '../../components';
import { habitRepository } from '../../database/repositories/habitRepository';
import Habit from '../../database/models/Habit';
import { getIconName } from '../../utils/iconMap';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../theme/ThemeContext';
import { bootLog } from '../../components/ErrorBoundary';

export function HomeScreen() {
  const navigation = useNavigation<any>();
  let themeColors: ReturnType<typeof useThemeColors> | undefined;
  try {
    themeColors = useThemeColors();
  } catch {
    themeColors = undefined;
  }
  const colors = themeColors ?? {
    borderLight: '#E4DEBC',
    textTertiary: '#425474',
    accentPrimary: '#5A955A',
    success: '#5A955A',
    info: '#6B9BCD',
  } as any;
  const [habits, setHabits] = useState<Habit[]>([]);
  const [todayCompletions, setTodayCompletions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  // Render-attempt marker (body runs even if the commit later stalls), so the
  // boot trail distinguishes "Home never rendered" from "rendered, effect lost".
  const renderLoggedRef = useRef(false);
  if (!renderLoggedRef.current) {
    renderLoggedRef.current = true;
    bootLog('home-render');
  }

  const loadHabits = useCallback(async () => {
    setLoading(true);
    try {
      const [allHabits, completions] = await Promise.all([
        habitRepository.getAll(false),
        habitRepository.getTodayCompletions(),
      ]);
      setHabits(allHabits ?? []);
      setTodayCompletions(completions ?? {});
    } catch (error) {
      console.error('Failed to load habits:', error);
      setHabits([]);
      setTodayCompletions({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    bootLog('home-mounted');
    loadHabits();
  }, [loadHabits]);

  const handleMoodCheckIn = () => navigation?.navigate?.('MoodCheckIn', { fromHome: true });
  const handleCalmDown = () => navigation?.navigate?.('Calm');
  const handleHabitPress = (habit: Habit) => navigation?.navigate?.('HabitDetail', { id: habit?.id });

  const toggleHabit = async (habit: Habit, completed: boolean) => {
    if (!habit?.id) return;
    const today = (new Date().toISOString() ?? '').split('T')?.[0] ?? '';
    if (!today) return;
    try {
      if (completed) {
        await habitRepository.uncomplete(habit.id, today);
      } else {
        await habitRepository.complete(habit.id, today);
      }
      setTodayCompletions((prev) => ({ ...prev, [habit.id]: !completed }));
    } catch (error) {
      console.error('Failed to toggle habit:', error);
    }
  };

  const isDueToday = (habit: Habit): boolean => {
    if (!habit) return false;
    const today = new Date();
    const dayOfWeek = today?.getDay?.() ?? new Date().getDay();
    const frequency = (habit as any)?.frequency ?? 'daily';
    let customDays: string[] = [];
    try {
      const raw = (habit as any)?.customDays;
      customDays = JSON.parse(typeof raw === 'string' && raw ? raw : '[]') ?? [];
      if (!Array.isArray(customDays)) customDays = [];
    } catch {
      customDays = [];
    }

    if (frequency === 'daily') return true;
    if (frequency === 'weekdays') return dayOfWeek >= 1 && dayOfWeek <= 5;
    if (frequency === 'custom') return (customDays ?? []).includes(dayOfWeek.toString());
    return true;
  };

  const dueHabits = (habits ?? []).filter((h) => {
    try {
      return !!h && isDueToday(h);
    } catch {
      return false;
    }
  });

  return (
    <ScrollView
      className="flex-1 bg-[var(--color-bg-primary)]"
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 100 }}
    >
      <View className="mb-8">
        <Text className="text-display-sm font-bold text-[var(--color-text-primary)]">
          Good morning ☀️
        </Text>
        <Text className="text-body-lg mt-1 text-[var(--color-text-secondary)]">
          Wednesday, September 17
        </Text>
      </View>

      <Card variant="elevated" className="mb-6">
        <CardContent>
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-headline-md font-semibold text-[var(--color-text-primary)]">
              How are you feeling?
            </Text>
            <Pressable onPress={handleMoodCheckIn}>
              <Text className="text-label-md text-[var(--color-accent-primary)]">Check in</Text>
            </Pressable>
          </View>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View
                className="flex items-center justify-center rounded-full bg-[var(--color-accent-bg)]"
                style={{ width: 56, height: 56 }}
              >
                <Text style={{ fontSize: 28 }}>😊</Text>
              </View>
              <View className="ml-4">
                <Text className="text-headline-sm font-semibold text-[var(--color-text-primary)]">
                  Peaceful
                </Text>
                <Text className="text-body-sm text-[var(--color-text-tertiary)]">
                  7/10 intensity · 2/10 stress
                </Text>
              </View>
            </View>
            <ProgressRing progress={0.7} size={48} strokeWidth={4} showPercentage={false} />
          </View>
        </CardContent>
      </Card>

      <Card variant="elevated" className="mb-6">
        <CardContent>
          <Text className="text-headline-md font-semibold mb-4 text-[var(--color-text-primary)]">
            Quick Actions
          </Text>
          <View className="flex-row gap-3">
            <PrimaryButton
              title="I need to calm down"
              variant="primary"
              size="md"
              onPress={handleCalmDown}
              className="flex-1"
              fullWidth
              leftIcon={<Text style={{ fontSize: 18 }}>🌿</Text>}
            />
            <PrimaryButton
              title="Journal"
              variant="outline"
              size="md"
              onPress={() => navigation?.navigate?.('Journal')}
              className="flex-1"
              fullWidth
              leftIcon={<Text style={{ fontSize: 18 }}>📝</Text>}
            />
          </View>
        </CardContent>
      </Card>

      <View className="mb-6">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-headline-md font-semibold text-[var(--color-text-primary)]">
            Today's Habits
          </Text>
          <Pressable onPress={() => navigation?.navigate?.('Habits')}>
            <Text className="text-label-md text-[var(--color-accent-primary)]">View all</Text>
          </Pressable>
        </View>
        {loading ? (
          <View className="gap-3">
            {[1, 2, 3].map((i) => (
              <View key={i} className="h-16 rounded-2xl" style={{ backgroundColor: colors?.borderLight ?? '#E4DEBC' }} />
            ))}
          </View>
        ) : (dueHabits ?? []).length === 0 ? (
          <View className="items-center py-5 gap-2">
            <Ionicons name="leaf" size={32} color={colors?.textTertiary ?? '#425474'} />
            <Text className="text-base font-medium text-[var(--color-text-secondary)]">
              No habits for today
            </Text>
            <Text className="text-sm text-center text-[var(--color-text-tertiary)]">
              Create a habit to get started 🌱
            </Text>
            <PrimaryButton
              title="Create Habit"
              variant="primary"
              size="sm"
              onPress={() => navigation?.navigate?.('HabitForm')}
              className="mt-3 w-auto"
              fullWidth={false}
            />
          </View>
        ) : (
          <View className="gap-3">
            {(dueHabits ?? []).slice(0, 3).map((habit) => (
              <TouchableOpacity
                key={habit?.id ?? Math.random().toString()}
                onPress={() => habit && handleHabitPress(habit)}
                className="flex-row items-center justify-between p-3.5 bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-light)]"
                activeOpacity={0.8}
              >
                <View className="flex-row items-center gap-3 flex-1">
                  <View
                    className="w-10 h-10 rounded-xl items-center justify-center"
                    style={{ backgroundColor: (habit as any)?.color || '#8FBC8F' }}
                  >
                    <Ionicons name={getIconName((habit as any)?.icon)} size={20} color="white" />
                  </View>
                  <View className="gap-0.5">
                    <Text className="text-[15px] font-semibold text-[var(--color-text-primary)]">
                      {(habit as any)?.name ?? 'Untitled'}
                    </Text>
                    <Text className="text-xs text-[var(--color-text-tertiary)]">
                      {(todayCompletions ?? {})?.[(habit as any)?.id] ? 'Completed ✓' : 'Tap to complete'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={(e) => {
                    e?.stopPropagation?.();
                    toggleHabit(habit, (todayCompletions ?? {})?.[(habit as any)?.id] || false);
                  }}
                  className="w-9 h-9 rounded-full border-2 items-center justify-center"
                  style={{
                    borderColor: colors?.accentPrimary ?? '#5A955A',
                    backgroundColor: (todayCompletions ?? {})?.[(habit as any)?.id] ? (colors?.accentPrimary ?? '#5A955A') : 'transparent',
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={(todayCompletions ?? {})?.[(habit as any)?.id] ? 'checkmark' : 'checkmark-outline'}
                    size={20}
                    color={(todayCompletions ?? {})?.[(habit as any)?.id] ? 'white' : (colors?.accentPrimary ?? '#5A955A')}
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
            {(dueHabits ?? []).length > 3 && (
              <Pressable
                onPress={() => navigation?.navigate?.('Habits')}
                className="p-3.5 items-center bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-light)]"
              >
                <Text className="text-sm font-medium text-[var(--color-accent-primary)]">
                  +{(dueHabits ?? []).length - 3} more habit{(dueHabits ?? []).length - 3 > 1 ? 's' : ''}
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </View>

      <Card variant="outlined" className="mb-6">
        <CardContent>
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-headline-md font-semibold text-[var(--color-text-primary)]">
              Recent Journal Entries
            </Text>
            <Pressable onPress={() => navigation?.navigate?.('Journal')}>
              <Text className="text-label-md text-[var(--color-accent-primary)]">View all</Text>
            </Pressable>
          </View>
          <EmptyState
            icon="📖"
            title="No entries yet"
            subtitle="Your first thought can start here 🌱"
            actionLabel="Create entry"
            onAction={() => navigation?.navigate?.('JournalEntry', { type: 'free' })}
          />
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Text className="text-headline-md font-semibold mb-3 text-[var(--color-text-primary)]">
            Weekly Insights
          </Text>
          <View className="flex-row gap-3">
            <StatPill label="Avg Mood" value="7.2/10" trend="up" trendValue="+0.3" accentColor={colors?.success ?? '#5A955A'} />
            <StatPill label="Journaling" value="4/7 days" trend="neutral" accentColor={colors?.info ?? '#6B9BCD'} />
          </View>
        </CardContent>
      </Card>
    </ScrollView>
  );
}

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
}

function EmptyState({ icon, title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View className="items-center py-8 px-4">
      <Text style={{ fontSize: 48 }}>{icon ?? '📝'}</Text>
      <Text className="text-headline-sm font-semibold mt-4 text-center text-[var(--color-text-primary)]">
        {title ?? 'Nothing here yet'}
      </Text>
      <Text className="text-body-md mt-2 text-center text-[var(--color-text-tertiary)]">
        {subtitle ?? ''}
      </Text>
      {actionLabel && onAction && (
        <PrimaryButton
          title={actionLabel}
          variant="primary"
          size="sm"
          onPress={onAction}
          className="mt-4 w-auto"
          fullWidth={false}
        />
      )}
    </View>
  );
}
