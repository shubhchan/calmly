import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Image, Text, View } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { AppText, Button, TactilePressable } from '../../components';
import { habitRepository } from '../../database/repositories/habitRepository';
import { journalRepository } from '../../database/repositories/journalRepository';
import { moodRepository } from '../../database/repositories/moodRepository';
import { settingsRepository, type AppSettings } from '../../database/repositories/settingsRepository';
import { getDailyPrompt } from '../../utils/dailyPrompt';
import Habit from '../../database/models/Habit';
import { getIconName } from '../../utils/iconMap';
import { useAppTheme } from '../../theme/ThemeContext';
import { bootLog } from '../../components/ErrorBoundary';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { ListSkeleton } from '../../components/interactive/LoadingState';
import { ProfileAvatarView } from '../../components/profile/ProfileAvatarView';
import { mascotById, ZenMascotAvatar } from '../../components/profile/ZenMascotAvatar';
import { displayFaces } from '../../theme/typography';

/** A check-in can hold several feelings, stored comma-separated. */
function formatMoodNames(value: unknown): string {
  const names = String(value ?? '')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);
  return names.length ? names.join(' and ') : 'present';
}

/**
 * Today — direction A.
 *
 * One greeting, one check-in, one list of habits, one calm invitation.
 * Everything else waits behind a plain text link.
 */
export function HomeScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useAppTheme();

  const [habits, setHabits] = useState<Habit[]>([]);
  const [todayCompletions, setTodayCompletions] = useState<Record<string, boolean>>({});
  const [recentJournals, setRecentJournals] = useState<any[]>([]);
  const [latestMood, setLatestMood] = useState<any>(null);
  const [profileSettings, setProfileSettings] = useState<AppSettings | null>(null);
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
      const [allHabits, completions, journals, mood, settings] = await Promise.all([
        habitRepository.getAll(false),
        habitRepository.getTodayCompletions(),
        journalRepository.getAll(),
        moodRepository.getLatest(),
        settingsRepository.getSettings().catch(() => null),
      ]);
      setHabits(allHabits ?? []);
      setTodayCompletions(completions ?? {});
      setRecentJournals((journals ?? []).slice(0, 3));
      setLatestMood(mood ?? null);
      setProfileSettings(settings ?? null);
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
      const timer = setTimeout(loadHomeData, 0);
      return () => clearTimeout(timer);
    }, [loadHomeData])
  );

  const handleMoodCheckIn = () => navigation?.navigate?.('MoodCheckIn', { fromHome: true });
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
  const dailyPrompt = getDailyPrompt();
  const doneCount = dueHabits.filter((h) => todayCompletions?.[(h as any)?.id]).length;

  return (
    <ScreenContainer
      contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 120 }}
      backgroundColor={colors.background.default}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <View style={{ flex: 1 }}>
          <AppText variant="overline" tone="tertiary">
            {dateLabel}
          </AppText>
          <AppText variant="h1" style={{ marginTop: 8 }}>
            {greeting}
            {profileSettings?.userName ? `,\n${profileSettings.userName}` : '.'}
          </AppText>
        </View>
        {(() => {
          const homePhotoUri =
            profileSettings?.userAvatar?.kind === 'custom'
              ? profileSettings.userAvatar.uri
              : profileSettings?.userAvatar?.kind === 'google'
              ? profileSettings?.googlePhotoUrl
              : undefined;
          const homeActiveMascotId =
            profileSettings?.userAvatar?.kind === 'mascot'
              ? profileSettings.userAvatar.mascotId
              : undefined;
          const homeActiveMascot = homeActiveMascotId ? mascotById(homeActiveMascotId) : undefined;
          const homeInitial = (profileSettings?.userName?.trim() || 'S').charAt(0).toUpperCase();

          return (
            <TactilePressable
              onPress={() => navigation?.navigate?.('Profile')}
              scaleDownTo={0.94}
              accessibilityRole="button"
              accessibilityLabel="Open your profile"
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: homeActiveMascot ? homeActiveMascot.background : '#2C4F45',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                shadowColor: '#14241E',
                shadowOpacity: 0.1,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 2 },
                elevation: 2,
              }}
            >
              {homePhotoUri ? (
                <Image
                  source={{ uri: homePhotoUri }}
                  style={{ width: '100%', height: '100%', borderRadius: 14 }}
                  accessibilityRole="image"
                  accessibilityLabel="Profile photo"
                />
              ) : homeActiveMascotId ? (
                <ZenMascotAvatar id={homeActiveMascotId} size={44} shape="square" borderRadius={14} />
              ) : (
                <Text
                  style={{
                    fontFamily: displayFaces.regular,
                    fontSize: 18,
                    color: '#EDF3EF',
                  }}
                >
                  {homeInitial}
                </Text>
              )}
            </TactilePressable>
          );
        })()}
      </View>

      {/* Hero session — Still Water v2 */}
      <View
        style={{
          marginTop: 24,
          borderRadius: 26,
          backgroundColor: colors.primary.default,
          padding: 22,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Ambient concentric rings */}
        <View
          style={{
            position: 'absolute',
            right: -30,
            top: -40,
            width: 170,
            height: 170,
            borderRadius: 85,
            borderWidth: 1,
            borderColor: 'rgba(198,220,209,0.25)',
          }}
          pointerEvents="none"
        />
        <View
          style={{
            position: 'absolute',
            right: 10,
            top: 26,
            width: 86,
            height: 86,
            borderRadius: 43,
            backgroundColor: 'rgba(198,220,209,0.12)',
          }}
          pointerEvents="none"
        />

        <AppText variant="overline" color="#A9CBBC" style={{ letterSpacing: 1.2 }}>
          Today · 6 minutes
        </AppText>
        <AppText variant="display" color="#EDF3EF" style={{ fontSize: 28, lineHeight: 38, paddingBottom: 4, marginTop: 10, marginBottom: 8, maxWidth: 240 }}>
          Let the morning be slow.
        </AppText>
        <AppText
          variant="bodySmall"
          color="#C6DCD1"
          style={{ lineHeight: 20, maxWidth: 250 }}
        >
          A short breath session before the day asks anything of you.
        </AppText>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 20 }}>
          <TactilePressable
            onPress={() => navigation?.navigate?.('BreathingSession', { preset: 'box', duration: 360 })}
            scaleDownTo={0.96}
            accessibilityRole="button"
            accessibilityLabel="Begin 6 minute breath session"
            style={{
              height: 46,
              paddingHorizontal: 22,
              borderRadius: 16,
              backgroundColor: '#EDF3EF',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AppText variant="label" color="#223E36" style={{ fontWeight: '600' }}>
              Begin
            </AppText>
          </TactilePressable>
          <TactilePressable
            onPress={() => navigation?.navigate?.('Calm')}
            scaleDownTo={0.96}
            accessibilityRole="button"
            accessibilityLabel="Choose another practice"
          >
            <AppText variant="bodySmall" color="#A9CBBC">
              or <AppText variant="bodySmall" color="#A9CBBC" style={{ textDecorationLine: 'underline' }}>choose another</AppText>
            </AppText>
          </TactilePressable>
        </View>
      </View>

      {/* Check-in invitation */}
      <TactilePressable
        onPress={handleMoodCheckIn}
        scaleDownTo={0.99}
        accessibilityRole="button"
        accessibilityLabel="Check in with your mood"
        style={{
          marginTop: 18,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          padding: 16,
          borderRadius: 20,
          backgroundColor: colors.surface.default,
        }}
      >
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            backgroundColor: colors.surface.selected,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="partly-sunny-outline" size={19} color={colors.primary.default} />
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="title">
            {latestMood ? 'Check in again' : 'How is your weather?'}
          </AppText>
          <AppText variant="bodySmall" tone="secondary" style={{ marginTop: 2 }}>
            {latestMood
              ? `Last time you felt ${formatMoodNames(latestMood.mood)}.`
              : 'One short pause is enough to begin.'}
          </AppText>
        </View>
        <Ionicons name="arrow-forward" size={17} color={colors.primary.default} />
      </TactilePressable>

      {/* Habits */}
      <View style={{ marginTop: 40 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
          <AppText variant="h3">Today&apos;s rhythm</AppText>
          <TactilePressable scaleDownTo={0.95} onPress={() => navigation?.navigate?.('Habits')}>
            <AppText variant="label" tone="link">
              {dueHabits.length ? `${doneCount} of ${dueHabits.length}` : 'Habits'}
            </AppText>
          </TactilePressable>
        </View>

        {loading ? (
          <ListSkeleton rows={3} showHeader={false} />
        ) : (dueHabits ?? []).length === 0 ? (
          <View
            style={{
              borderRadius: 20,
              backgroundColor: colors.surface.default,
              paddingVertical: 26,
              paddingHorizontal: 20,
              alignItems: 'center',
            }}
          >
            <AppText variant="title" center>
              Nothing scheduled today
            </AppText>
            <AppText variant="bodySmall" tone="tertiary" center style={{ marginTop: 4 }}>
              Start with one small habit. You can always add more.
            </AppText>
            <Button
              title="Create a habit"
              variant="secondary"
              size="sm"
              onPress={() => navigation?.navigate?.('HabitForm')}
              style={{ marginTop: 16 }}
            />
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            {(dueHabits ?? []).slice(0, 4).map((habit) => {
              const isCompleted = !!(todayCompletions ?? {})?.[(habit as any)?.id];
              return (
                <TactilePressable
                  key={habit?.id}
                  onPress={() => habit && handleHabitPress(habit)}
                  scaleDownTo={0.99}
                  hapticStyle="none"
                  accessibilityRole="button"
                  accessibilityLabel={`${(habit as any)?.name ?? 'Habit'}, ${isCompleted ? 'done' : 'not done'}`}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingVertical: 13,
                    paddingHorizontal: 14,
                    borderRadius: 16,
                    backgroundColor: colors.surface.default,
                  }}
                >
                  <View
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 11,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: colors.surface.selected,
                    }}
                  >
                    <Ionicons
                      name={getIconName((habit as any)?.icon) as any}
                      size={17}
                      color={colors.primary.default}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText
                      variant="title"
                      tone={isCompleted ? 'tertiary' : 'primary'}
                      numberOfLines={1}
                      style={isCompleted ? { textDecorationLine: 'line-through' } : undefined}
                    >
                      {(habit as any)?.name ?? 'Untitled'}
                    </AppText>
                    <AppText variant="caption" tone="tertiary" style={{ marginTop: 1 }}>
                      {isCompleted ? 'Kept today' : (habit as any)?.reminderTime || 'When you are ready'}
                    </AppText>
                  </View>
                  <TactilePressable
                    onPress={() => toggleHabit(habit, isCompleted)}
                    scaleDownTo={0.86}
                    hapticStyle="light"
                    accessibilityRole="button"
                    accessibilityLabel={isCompleted ? 'Mark habit as not done' : 'Mark habit as done'}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isCompleted ? colors.primary.default : 'transparent',
                      borderWidth: isCompleted ? 0 : 1.5,
                      borderColor: colors.border.strong,
                    }}
                  >
                    {isCompleted ? (
                      <Ionicons name="checkmark" size={15} color={colors.primary.foreground} />
                    ) : null}
                  </TactilePressable>
                </TactilePressable>
              );
            })}
            {(dueHabits ?? []).length > 4 ? (
              <TactilePressable
                onPress={() => navigation?.navigate?.('Habits')}
                scaleDownTo={0.98}
                style={{ paddingVertical: 12, alignItems: 'center' }}
              >
                <AppText variant="label" tone="link">
                  {`${(dueHabits ?? []).length - 4} more`}
                </AppText>
              </TactilePressable>
            ) : null}
          </View>
        )}

        {/* Weekly rhythm bar graph — Doop Day arc */}
        <View style={{ marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border.default }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <AppText variant="label" color="#46524C" style={{ fontWeight: '600' }}>
              This week
            </AppText>
            <AppText variant="caption" color="#838F89">
              {`${doneCount > 0 ? doneCount : 4} quiet days`}
            </AppText>
          </View>
          <View style={{ flexDirection: 'row', gap: 7 }}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => {
              const isCompleted = idx < (doneCount > 0 ? doneCount : 4);
              const isToday = idx === ((new Date().getDay() + 6) % 7);
              return (
                <View key={idx} style={{ flex: 1, alignItems: 'center' }}>
                  <View
                    style={{
                      height: 30,
                      width: '100%',
                      borderRadius: 9,
                      backgroundColor: isCompleted
                        ? colors.primary.default
                        : isToday
                          ? '#C9DCD3'
                          : colors.surface.muted,
                    }}
                  />
                  <AppText variant="caption" color="#838F89" style={{ fontSize: 10.5, marginTop: 5 }}>
                    {day}
                  </AppText>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* Journal prompt */}
      <View style={{ marginTop: 36 }}>
        <AppText variant="overline" tone="tertiary">
          A page for today
        </AppText>
        <TactilePressable
          onPress={() => navigation?.navigate?.('JournalEntry', { type: 'daily_reflection' })}
          scaleDownTo={0.99}
          accessibilityRole="button"
          accessibilityLabel="Write today's journal entry"
          style={{
            marginTop: 12,
            padding: 20,
            borderRadius: 20,
            backgroundColor: colors.surface.default,
          }}
        >
          <AppText variant="h3">{dailyPrompt}</AppText>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
            <AppText variant="caption" tone="tertiary">
              {recentJournals.length ? `${recentJournals.length} recent entries` : 'No entries yet'}
            </AppText>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <AppText variant="label" tone="link">
                Write
              </AppText>
              <Ionicons name="create-outline" size={16} color={colors.primary.default} />
            </View>
          </View>
        </TactilePressable>
      </View>

      {/* Quiet links */}
      <View style={{ marginTop: 36 }}>
        <AppText variant="overline" tone="tertiary" style={{ marginBottom: 8 }}>
          More places
        </AppText>
        {[
          { label: 'Soundscapes', note: 'Rain, pine, slow shore', icon: 'water-outline', route: 'Soundscapes' },
          { label: 'Playground', note: 'Small things for restless hands', icon: 'ellipse-outline', route: 'ZenPlayground' },
          { label: 'Insights', note: 'Your patterns, without judgement', icon: 'analytics-outline', route: 'Insights' },
        ].map((item) => (
          <TactilePressable
            key={item.label}
            onPress={() => navigation?.navigate?.(item.route)}
            scaleDownTo={0.99}
            accessibilityRole="button"
            accessibilityLabel={`Open ${item.label}`}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              paddingVertical: 15,
              borderBottomWidth: 1,
              borderBottomColor: colors.border.default,
            }}
          >
            <Ionicons name={item.icon as any} size={19} color={colors.text.secondary} />
            <View style={{ flex: 1 }}>
              <AppText variant="title">{item.label}</AppText>
              <AppText variant="caption" tone="tertiary" style={{ marginTop: 1 }}>
                {item.note}
              </AppText>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
          </TactilePressable>
        ))}
      </View>

      {/* Reflection sign-off — Still Water quote */}
      <View style={{ alignItems: 'center', marginTop: 36, marginBottom: 12, paddingHorizontal: 20 }}>
        <View style={{ width: 26, height: 1, backgroundColor: colors.border.strong, marginBottom: 16 }} />
        <AppText variant="bodySmall" tone="secondary" center style={{ fontStyle: 'italic', maxWidth: 280, lineHeight: 20 }}>
          You do not have to finish the day before it starts.
        </AppText>
      </View>
    </ScreenContainer>
  );
}
