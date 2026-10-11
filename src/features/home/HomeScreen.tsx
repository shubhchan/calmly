import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Card, CardContent, PrimaryButton, ProgressRing, StatPill, AppIcon, MeditationHeroIllustration, HabitPlantingIllustration, JournalReflectionIllustration } from '../../components';
import type { AppIconName } from '../../components';
import { habitRepository } from '../../database/repositories/habitRepository';
import Habit from '../../database/models/Habit';
import { getIconName } from '../../utils/iconMap';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../theme/ThemeContext';
import { bootLog } from '../../components/ErrorBoundary';
import { format } from 'date-fns';

export function HomeScreen() {
  const navigation = useNavigation<any>();
  let themeColors: ReturnType<typeof useThemeColors> | undefined;
  try {
    themeColors = useThemeColors();
  } catch {
    themeColors = undefined;
  }
  const colors = themeColors ?? {
    bgPrimary: '#FBF9F5',
    bgCard: '#FFFFFF',
    borderLight: '#E6E0D4',
    textPrimary: '#1A212D',
    textSecondary: '#384455',
    textTertiary: '#607085',
    accentPrimary: '#3E7B52',
    accentBg: '#EDF5EF',
    accentBorder: '#C2DCBF',
    success: '#3E7B52',
    info: '#2563EB',
    isDark: false,
  } as any;

  const [habits, setHabits] = useState<Habit[]>([]);
  const [todayCompletions, setTodayCompletions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

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

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const dateLabel = format(new Date(), 'EEEE, MMMM d');

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bgPrimary }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 110 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Greeting */}
      <View style={{ marginBottom: 22, marginTop: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ fontSize: 28, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 }}>
              {greeting}
            </Text>
            <Text style={{ fontSize: 15, fontWeight: '500', color: colors.textTertiary, marginTop: 2 }}>
              {dateLabel}
            </Text>
          </View>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: colors.accentBg,
              borderWidth: 1,
              borderColor: colors.accentBorder,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AppIcon name="l-calm" size={26} loop />
          </View>
        </View>
      </View>

      {/* Hero Mindful Sanctuary Card */}
      <Card variant="elevated" style={{ marginBottom: 20, borderRadius: 22, overflow: 'hidden' }}>
        <CardContent style={{ padding: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: colors.accentPrimary,
                  marginRight: 8,
                }}
              />
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary }}>
                Daily Mindset
              </Text>
            </View>
            <Pressable
              onPress={handleMoodCheckIn}
              style={({ pressed }) => [
                {
                  paddingVertical: 6,
                  paddingHorizontal: 14,
                  borderRadius: 9999,
                  backgroundColor: colors.accentBg,
                  borderWidth: 1,
                  borderColor: colors.accentBorder,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
            >
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.accentPrimary }}>Check in</Text>
            </Pressable>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.3 }}>
                Peaceful & Grounded
              </Text>
              <Text style={{ fontSize: 13, color: colors.textTertiary, lineHeight: 18 }}>
                7/10 serenity · low stress today. Take a mindful breath.
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <ProgressRing progress={0.7} size={34} strokeWidth={3.8} showPercentage={false} />
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.accentPrimary }}>
                  Serenity in harmony
                </Text>
              </View>
            </View>
            <MeditationHeroIllustration width={125} height={110} />
          </View>
        </CardContent>
      </Card>

      {/* Quick Mindful Actions */}
      <View style={{ marginBottom: 22 }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 }}>
          Quick Practices
        </Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Pressable
            onPress={handleCalmDown}
            style={({ pressed }) => [
              {
                flex: 1,
                padding: 16,
                borderRadius: 20,
                backgroundColor: colors.accentBg,
                borderWidth: 1,
                borderColor: colors.accentBorder,
                opacity: pressed ? 0.85 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 14,
                backgroundColor: colors.bgCard,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 10,
              }}
            >
              <AppIcon name="l-breathe" size={22} loop />
            </View>
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }}>
              Calm Space
            </Text>
            <Text style={{ fontSize: 12, color: colors.textTertiary, marginTop: 2, lineHeight: 16 }}>
              Breathing & grounding
            </Text>
          </Pressable>

          <Pressable
            onPress={() => navigation?.navigate?.('Journal')}
            style={({ pressed }) => [
              {
                flex: 1,
                padding: 16,
                borderRadius: 20,
                backgroundColor: colors.bgCard,
                borderWidth: 1,
                borderColor: colors.borderLight,
                opacity: pressed ? 0.85 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 14,
                backgroundColor: colors.accentBg,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 10,
              }}
            >
              <AppIcon name="l-book" size={22} loop />
            </View>
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }}>
              Daily Journal
            </Text>
            <Text style={{ fontSize: 12, color: colors.textTertiary, marginTop: 2, lineHeight: 16 }}>
              Reflect & write
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Today's Habits */}
      <View style={{ marginBottom: 22 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary }}>
            Today&apos;s Habits
          </Text>
          <Pressable onPress={() => navigation?.navigate?.('Habits')}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.accentPrimary }}>View all</Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={{ gap: 10 }}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={{ height: 60, borderRadius: 18, backgroundColor: colors.borderLight }} />
            ))}
          </View>
        ) : (dueHabits ?? []).length === 0 ? (
          <Card variant="outlined" style={{ borderRadius: 20 }}>
            <CardContent style={{ alignItems: 'center', paddingVertical: 24, paddingHorizontal: 16 }}>
              <HabitPlantingIllustration width={130} height={105} style={{ marginBottom: 6 }} />
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginTop: 4 }}>
                No habits scheduled today
              </Text>
              <Text style={{ fontSize: 13, color: colors.textTertiary, textAlign: 'center', marginTop: 4, lineHeight: 18 }}>
                Build steady mindfulness one day at a time
              </Text>
              <PrimaryButton
                title="Create Habit"
                variant="secondary"
                size="sm"
                onPress={() => navigation?.navigate?.('HabitForm')}
                style={{ marginTop: 14, minWidth: 140 }}
                fullWidth={false}
              />
            </CardContent>
          </Card>
        ) : (
          <View style={{ gap: 10 }}>
            {(dueHabits ?? []).slice(0, 3).map((habit) => {
              const isCompleted = !!(todayCompletions ?? {})?.[(habit as any)?.id];
              return (
                <TouchableOpacity
                  key={habit?.id ?? Math.random().toString()}
                  onPress={() => habit && handleHabitPress(habit)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    padding: 16,
                    backgroundColor: colors.bgCard,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: isCompleted ? colors.accentBorder : colors.borderLight,
                    gap: 12,
                  }}
                  activeOpacity={0.8}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, flex: 1 }}>
                    <View
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 14,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: (habit as any)?.color || colors.accentPrimary,
                        marginTop: 2,
                      }}
                    >
                      <Ionicons name={getIconName((habit as any)?.icon) as any} size={20} color="white" />
                    </View>
                    <View style={{ flex: 1, gap: 3 }}>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: '700',
                          lineHeight: 22,
                          color: colors.textPrimary,
                          textDecorationLine: isCompleted ? 'line-through' : 'none',
                          opacity: isCompleted ? 0.7 : 1,
                        }}
                      >
                        {(habit as any)?.name ?? 'Untitled'}
                      </Text>
                      <Text style={{ fontSize: 12, lineHeight: 16, color: isCompleted ? colors.accentPrimary : colors.textTertiary }}>
                        {isCompleted ? 'Completed today ✓' : 'Tap circle to mark done'}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={(e) => {
                      e?.stopPropagation?.();
                      toggleHabit(habit, isCompleted);
                    }}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      borderWidth: 2,
                      borderColor: colors.accentPrimary,
                      backgroundColor: isCompleted ? colors.accentPrimary : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: 2,
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={isCompleted ? 'checkmark' : 'checkmark-outline'}
                      size={20}
                      color={isCompleted ? 'white' : colors.accentPrimary}
                    />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
            {(dueHabits ?? []).length > 3 && (
              <Pressable
                onPress={() => navigation?.navigate?.('Habits')}
                style={{
                  padding: 12,
                  alignItems: 'center',
                  backgroundColor: colors.bgCard,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: colors.borderLight,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.accentPrimary }}>
                  +{(dueHabits ?? []).length - 3} more habit{(dueHabits ?? []).length - 3 > 1 ? 's' : ''}
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </View>

      {/* Recent Journal Entries */}
      <Card variant="outlined" style={{ marginBottom: 20 }}>
        <CardContent>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary }}>
              Recent Journal Entries
            </Text>
            <Pressable onPress={() => navigation?.navigate?.('Journal')}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.accentPrimary }}>View all</Text>
            </Pressable>
          </View>
          <EmptyState
            icon="l-book"
            title="A fresh blank page"
            subtitle="Write down your thoughts, a moment of gratitude, or release what weighs on you."
            actionLabel="Start writing"
            onAction={() => navigation?.navigate?.('JournalEntry', { type: 'free' })}
            colors={colors}
          />
        </CardContent>
      </Card>

      {/* Weekly Insights */}
      <Card variant="outlined">
        <CardContent>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 }}>
            Weekly Insights
          </Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <StatPill label="Avg Mood" value="7.2/10" trend="up" trendValue="+0.3" accentColor={colors?.success ?? '#3E7B52'} />
            <StatPill label="Journaling" value="4/7 days" trend="neutral" accentColor={colors?.info ?? '#2563EB'} />
          </View>
        </CardContent>
      </Card>
    </ScrollView>
  );
}

interface EmptyStateProps {
  icon?: AppIconName;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
  colors: any;
}

function EmptyState({ title, subtitle, actionLabel, onAction, colors }: EmptyStateProps) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 20, paddingHorizontal: 16 }}>
      <JournalReflectionIllustration width={130} height={105} style={{ marginBottom: 6 }} />
      <Text style={{ fontSize: 16, fontWeight: '700', marginTop: 4, textAlign: 'center', color: colors.textPrimary }}>
        {title ?? 'Nothing here yet'}
      </Text>
      <Text style={{ fontSize: 13, marginTop: 4, textAlign: 'center', color: colors.textTertiary, lineHeight: 18 }}>
        {subtitle ?? ''}
      </Text>
      {actionLabel && onAction && (
        <PrimaryButton
          title={actionLabel}
          variant="secondary"
          size="sm"
          onPress={onAction}
          style={{ marginTop: 14, minWidth: 140 }}
          fullWidth={false}
        />
      )}
    </View>
  );
}

