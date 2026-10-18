import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Card, CardContent, PrimaryButton, ProgressRing, StatPill, AppIcon, AppText, PageHeader, MeditationHeroIllustration, HabitPlantingIllustration, JournalReflectionIllustration, TactilePressable, StaggeredEntry, CelebratoryCheckbox } from '../../components';
import type { AppIconName } from '../../components';
import { habitRepository } from '../../database/repositories/habitRepository';
import { journalRepository } from '../../database/repositories/journalRepository';
import { moodRepository } from '../../database/repositories/moodRepository';
import Habit from '../../database/models/Habit';
import { getIconName } from '../../utils/iconMap';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme/ThemeContext';
import { bootLog } from '../../components/ErrorBoundary';
import { format } from 'date-fns';
import { fontFamilies } from '../../theme/typography';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { PopIn } from '../../components/interactive/PopIn';
import { ListSkeleton } from '../../components/interactive/LoadingState';
import { resolveTint } from '../../theme/tints';

export function HomeScreen() {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useAppTheme();

  const [habits, setHabits] = useState<Habit[]>([]);
  const [todayCompletions, setTodayCompletions] = useState<Record<string, boolean>>({});
  const [recentJournals, setRecentJournals] = useState<any[]>([]);
  const [latestMood, setLatestMood] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const renderLoggedRef = useRef(false);
  if (!renderLoggedRef.current) {
    renderLoggedRef.current = true;
    bootLog('home-render');
  }
  const hasLoadedRef = useRef(false);

  const loadHomeData = useCallback(async () => {
    if (!hasLoadedRef.current) setLoading(true);
    try {
      const [allHabits, completions, journals, mood] = await Promise.all([
        habitRepository.getAll(false),
        habitRepository.getTodayCompletions(),
        journalRepository.getAll(),
        moodRepository.getLatest(),
      ]);
      setHabits(allHabits ?? []);
      setTodayCompletions(completions ?? {});
      setRecentJournals((journals ?? []).slice(0, 3));
      setLatestMood(mood ?? null);
    } catch (error) {
      console.error('Failed to load home data:', error);
      setHabits([]);
      setTodayCompletions({});
      setRecentJournals([]);
      setLatestMood(null);
    } finally {
      hasLoadedRef.current = true;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    bootLog('home-mounted');
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHomeData();
    }, [loadHomeData])
  );

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

  const heroTint = resolveTint(!!isDark, 'cream');
  const calmTint = resolveTint(!!isDark, 'coral');
  const journalTint = resolveTint(!!isDark, 'sky');

  return (
    <ScreenContainer
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16 }}
      backgroundColor={colors.background.default}
    >
      {/* Header Greeting */}
      <PopIn index={0} style={{ marginBottom: 22, marginTop: 4 }}>
        <PageHeader
          title={greeting}
          subtitle={dateLabel}
          right={
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: colors.primary.subtle,
                borderWidth: 1,
                borderColor: colors.primary.subtleBorder,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AppIcon name="l-calm" size={26} />
            </View>
          }
        />
      </PopIn>

      {/* Hero Mindful Sanctuary Card — playful cream pop */}
      <PopIn index={1}>
      <Card variant="elevated" tone="cream" style={{ marginBottom: 20, borderRadius: 22, overflow: 'hidden' }}>
        <CardContent style={{ padding: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: heroTint.accent,
                  marginRight: 8,
                }}
              />
              <Text style={{ fontSize: 16, fontFamily: fontFamilies.sans.bold, fontWeight: '700', color: heroTint.text }}>
                Daily Mindset
              </Text>
            </View>
            <TactilePressable
              onPress={handleMoodCheckIn}
              scaleDownTo={0.94}
              style={{
                paddingVertical: 6,
                paddingHorizontal: 14,
                borderRadius: 9999,
                backgroundColor: heroTint.plate,
                borderWidth: 1,
                borderColor: heroTint.border,
              }}
            >
              <Text style={{ fontSize: 13, fontFamily: fontFamilies.sans.bold, fontWeight: '700', color: heroTint.accent }}>Check in</Text>
            </TactilePressable>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ fontSize: 18, lineHeight: 24, fontWeight: '800', color: heroTint.text, letterSpacing: -0.3 }}>
                {latestMood?.mood ? `${latestMood.mood.charAt(0).toUpperCase()}${latestMood.mood.slice(1)} & Present` : 'Peaceful & Grounded'}
              </Text>
              <Text style={{ fontSize: 13, color: heroTint.muted, lineHeight: 18 }}>
                {latestMood
                  ? `${latestMood.intensity ?? 7}/10 intensity · stress ${latestMood.stress ?? 2}/10. Keep going.`
                  : '7/10 serenity · low stress today. Take a mindful breath.'}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
                <ProgressRing
                  progress={latestMood ? Math.min(Math.max((latestMood.intensity ?? 7) / 10, 0.1), 1) : 0.7}
                  size={34}
                  strokeWidth={3.8}
                  showPercentage={false}
                />
                <Text style={{ fontSize: 12, fontWeight: '600', color: heroTint.accent }}>
                  {latestMood
                    ? (latestMood.intensity ?? 7) >= 7
                      ? 'Serenity in harmony'
                      : (latestMood.intensity ?? 7) >= 4
                      ? 'Mindful awareness'
                      : 'Gentle self-compassion'
                    : 'Serenity in harmony'}
                </Text>
              </View>
            </View>
            <MeditationHeroIllustration width={125} height={110} />
          </View>
        </CardContent>
      </Card>
      </PopIn>

      {/* Quick Mindful Actions — colorful popping tiles */}
      <View style={{ marginBottom: 22 }}>
        <PopIn index={2}>
          <AppText variant="h3" style={{ marginBottom: 12 }}>
            Quick Practices
          </AppText>
        </PopIn>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <PopIn index={3} style={{ flex: 1 }}>
            <TactilePressable
              onPress={handleCalmDown}
              scaleDownTo={0.97}
              hapticStyle="light"
              style={{
                padding: 16,
                borderRadius: 20,
                backgroundColor: calmTint.bg,
                borderWidth: 1,
                borderColor: calmTint.border,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 14,
                  backgroundColor: calmTint.plate,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 10,
                }}
              >
                <AppIcon name="l-breathe" size={22} />
              </View>
              <Text style={{ fontSize: 15, fontWeight: '700', color: calmTint.text }}>
                Calm Space
              </Text>
              <Text style={{ fontSize: 12, color: calmTint.muted, marginTop: 2, lineHeight: 16 }}>
                Breathing & grounding
              </Text>
            </TactilePressable>
          </PopIn>

          <PopIn index={4} style={{ flex: 1 }}>
            <TactilePressable
              onPress={() => navigation?.navigate?.('Journal')}
              scaleDownTo={0.97}
              hapticStyle="light"
              style={{
                padding: 16,
                borderRadius: 20,
                backgroundColor: journalTint.bg,
                borderWidth: 1,
                borderColor: journalTint.border,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 14,
                  backgroundColor: journalTint.plate,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 10,
                }}
              >
                <AppIcon name="l-book" size={22} />
              </View>
              <Text style={{ fontSize: 15, fontWeight: '700', color: journalTint.text }}>
                Daily Journal
              </Text>
              <Text style={{ fontSize: 12, color: journalTint.muted, marginTop: 2, lineHeight: 16 }}>
                Reflect & write
              </Text>
            </TactilePressable>
          </PopIn>
        </View>
      </View>

      {/* Today's Habits */}
      <View style={{ marginBottom: 22 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <AppText variant="h3">
            Today&apos;s Habits
          </AppText>
          <TactilePressable scaleDownTo={0.96} onPress={() => navigation?.navigate?.('Habits')}>
            <Text style={{ fontSize: 14, fontFamily: fontFamilies.sans.semiBold, fontWeight: '600', color: colors.primary.default }}>View all</Text>
          </TactilePressable>
        </View>

        {loading ? (
          <ListSkeleton rows={3} showHeader={false} />
        ) : (dueHabits ?? []).length === 0 ? (
          <Card variant="outlined" style={{ borderRadius: 20 }}>
            <CardContent style={{ alignItems: 'center', paddingVertical: 24, paddingHorizontal: 16 }}>
              <HabitPlantingIllustration width={130} height={105} style={{ marginBottom: 6 }} />
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text.primary, marginTop: 4 }}>
                No habits scheduled today
              </Text>
              <Text style={{ fontSize: 13, color: colors.text.tertiary, textAlign: 'center', marginTop: 4, lineHeight: 18 }}>
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
            {(dueHabits ?? []).slice(0, 3).map((habit, index) => {
              const isCompleted = !!(todayCompletions ?? {})?.[(habit as any)?.id];
              return (
                <StaggeredEntry key={habit?.id ?? 'ph-' + index} index={index}>
                  <TactilePressable
                    onPress={() => habit && handleHabitPress(habit)}
                    scaleDownTo={0.98}
                    hapticStyle="none"
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingHorizontal: 18,
                      paddingVertical: 14,
                      backgroundColor: colors.surface.default,
                      borderRadius: 20,
                      borderWidth: 1.2,
                      borderColor: isCompleted ? colors.primary.subtleBorder : colors.border.default,
                      gap: 12,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                      <View
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 14,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: (habit as any)?.color || colors.primary.default,
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
                            color: colors.text.primary,
                            textDecorationLine: isCompleted ? 'line-through' : 'none',
                            opacity: isCompleted ? 0.7 : 1,
                          }}
                        >
                          {(habit as any)?.name ?? 'Untitled'}
                        </Text>
                        <Text style={{ fontSize: 12, lineHeight: 16, color: isCompleted ? colors.primary.default : colors.text.tertiary }}>
                          {isCompleted ? 'Completed today ✓' : 'Tap to mark done'}
                        </Text>
                      </View>
                    </View>
                    <CelebratoryCheckbox
                      checked={isCompleted}
                      onToggle={() => toggleHabit(habit, isCompleted)}
                      activeColor={colors.primary.default}
                      borderColor={colors.primary.subtleBorder || colors.primary.default}
                    />
                  </TactilePressable>
                </StaggeredEntry>
              );
            })}
            {(dueHabits ?? []).length > 3 && (
              <TactilePressable
                onPress={() => navigation?.navigate?.('Habits')}
                scaleDownTo={0.97}
                style={{
                  padding: 12,
                  alignItems: 'center',
                  backgroundColor: colors.surface.default,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: colors.border.default,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.primary.default }}>
                  +{(dueHabits ?? []).length - 3} more habit{(dueHabits ?? []).length - 3 > 1 ? 's' : ''}
                </Text>
              </TactilePressable>
            )}
          </View>
        )}
      </View>

      {/* Recent Journal Entries */}
      <Card variant="outlined" style={{ marginBottom: 20 }}>
        <CardContent>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <AppText variant="h3">
              Recent Journal Entries
            </AppText>
            <TactilePressable scaleDownTo={0.96} onPress={() => navigation?.navigate?.('Journal')}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.primary.default }}>View all</Text>
            </TactilePressable>
          </View>
          {(recentJournals ?? []).length === 0 ? (
            <EmptyState
              icon="l-book"
              title="A fresh blank page"
              subtitle="Write down your thoughts, a moment of gratitude, or release what weighs on you."
              actionLabel="Start writing"
              onAction={() => navigation?.navigate?.('JournalEntry', { type: 'free' })}
              colors={colors}
            />
          ) : (
            <View style={{ gap: 10 }}>
              {(recentJournals ?? []).slice(0, 2).map((entry) => (
                <TactilePressable
                  key={entry.id}
                  onPress={() => navigation?.navigate?.('JournalEntry', { id: entry.id, type: entry.type })}
                  scaleDownTo={0.98}
                  style={{
                    padding: 14,
                    backgroundColor: colors.surface.default,
                    borderRadius: 16,
                    borderWidth: 1.2,
                    borderColor: colors.border.default,
                    gap: 6,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text.primary, flex: 1, marginRight: 8 }} numberOfLines={1}>
                      {entry.title || (entry.type ? String(entry.type).replace('_', ' ') : 'Reflection')}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.text.tertiary }}>
                      {entry.createdAt ? format(new Date(entry.createdAt), 'MMM d') : ''}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 13, color: colors.text.secondary, lineHeight: 18 }} numberOfLines={2}>
                    {entry.body}
                  </Text>
                </TactilePressable>
              ))}
            </View>
          )}
        </CardContent>
      </Card>

      {/* Weekly Insights */}
      <PopIn index={5}>
        <TactilePressable scaleDownTo={0.98} onPress={() => navigation?.navigate?.('Insights')}>
          <Card variant="outlined">
            <CardContent>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <AppText variant="h3">
                  Weekly Insights
                </AppText>
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.primary.default }}>Open →</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <StatPill label="Avg Mood" value={latestMood?.intensity ? `${latestMood.intensity}/10` : '7.2/10'} trend="up" trendValue="+0.3" accentColor={colors.status.success.default} />
                <StatPill label="Journaling" value={`${Math.max(recentJournals.length, 1)} entries`} trend="neutral" accentColor={colors.status.info.default} />
              </View>
            </CardContent>
          </Card>
        </TactilePressable>
      </PopIn>
    </ScreenContainer>
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
      <Text style={{ fontSize: 16, fontWeight: '700', marginTop: 4, textAlign: 'center', color: colors.text.primary }}>
        {title ?? 'Nothing here yet'}
      </Text>
      <Text style={{ fontSize: 13, marginTop: 4, textAlign: 'center', color: colors.text.tertiary, lineHeight: 18 }}>
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

