import React, { useRef, useState, useCallback } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types/navigation';
import { habitRepository } from '../../database/repositories/habitRepository';
import Habit from '../../database/models/Habit';
import { getIconName } from '../../utils/iconMap';
import { AppText, Button, TactilePressable } from '../../components';
import { useAppTheme } from '../../theme/ThemeContext';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { ListSkeleton } from '../../components/interactive/LoadingState';
import { hapticFeedback } from '../../utils/haptics';

type NavigationProp = NativeStackScreenProps<RootStackParamList, 'Habits'>['navigation'];

const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Daily',
  weekdays: 'Weekdays',
  custom: 'Custom',
};

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type Slot = 'Morning' | 'Afternoon' | 'Evening' | 'Anytime';
const SLOT_ORDER: Slot[] = ['Morning', 'Afternoon', 'Evening', 'Anytime'];

function slotFor(habit: Habit): Slot {
  const reminder = habit?.reminderTime;
  if (!reminder) return 'Anytime';
  const hour = parseInt(reminder.split(':')[0] ?? '', 10);
  if (!Number.isFinite(hour)) return 'Anytime';
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
}

/**
 * Habits — direction A.
 *
 * Grouped by the time of day they belong to. One progress line, then rows.
 * A check is a plain square, not a celebration.
 */
export function HabitListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useAppTheme();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [todayCompletions, setTodayCompletions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const hasLoadedRef = useRef(false);

  const loadData = useCallback(async () => {
    if (!hasLoadedRef.current) setLoading(true);
    try {
      const [allHabits, completions] = await Promise.all([
        habitRepository.getAll(false),
        habitRepository.getTodayCompletions(),
      ]);
      setHabits(allHabits ?? []);
      setTodayCompletions(completions ?? {});
    } catch (error) {
      console.error('Failed to load habits:', error);
      setHabits((prev) => prev ?? []);
      setTodayCompletions((prev) => prev ?? {});
    } finally {
      hasLoadedRef.current = true;
      setLoading(false);
    }
  }, []);

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
        hapticFeedback.light();
      }
      setTodayCompletions((prev) => ({ ...prev, [habit.id]: !completed }));
    } catch (error) {
      console.error('Failed to toggle habit:', error);
    }
  };

  const handleAddHabit = () => navigation.navigate('HabitForm');

  const handleHabitPress = (habit: Habit) => {
    if (!habit?.id) return;
    navigation.navigate('HabitDetail', {
      id: habit.id,
      preview: {
        name: habit.name,
        icon: habit.icon,
        color: habit.color,
        frequency: habit.frequency,
        customDays: habit.customDays,
      },
    });
  };

  const isDueToday = (habit: Habit): boolean => {
    if (!habit) return true;
    const dayOfWeek = new Date().getDay();
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
      <ScreenContainer animate={false} contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16 }}>
        <ListSkeleton rows={4} />
      </ScreenContainer>
    );
  }

  const dueHabits = (habits ?? []).filter(isDueToday);
  const completedCount = dueHabits.filter((h) => h?.id && todayCompletions[h.id]).length;
  const totalDue = dueHabits.length;
  const progress = totalDue > 0 ? Math.round((completedCount / totalDue) * 100) : 0;

  const query = searchQuery.trim().toLowerCase();
  const filteredHabits = query
    ? dueHabits.filter((h) => {
        const name = (h.name ?? '').toLowerCase();
        const notes = (h.notes ?? '').toLowerCase();
        const freq = (FREQUENCY_LABELS[h.frequency] ?? h.frequency ?? '').toLowerCase();
        return name.includes(query) || notes.includes(query) || freq.includes(query);
      })
    : dueHabits;

  const grouped = SLOT_ORDER.map((slot) => ({
    slot,
    habits: filteredHabits.filter((habit) => slotFor(habit) === slot),
  })).filter((group) => group.habits.length > 0);

  const habitMeta = (habit: Habit): string => {
    const frequency = FREQUENCY_LABELS[habit.frequency] || habit.frequency || '';
    if (habit.frequency === 'custom') {
      try {
        const parsed = JSON.parse(habit.customDays || '[]');
        const days = Array.isArray(parsed)
          ? parsed.map((d: string) => DAY_LABELS[parseInt(d, 10)] ?? '').filter(Boolean)
          : [];
        return days.length ? `Custom · ${days.join(', ')}` : frequency;
      } catch {
        return frequency;
      }
    }
    return frequency;
  };

  const encouragement =
    totalDue === 0
      ? 'Nothing scheduled today'
      : completedCount === totalDue
        ? 'All done'
        : completedCount > 0
          ? 'A good day'
          : 'One is enough';

  return (
    <ScreenContainer
      contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 40 }}
      backgroundColor={colors.background.default}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <AppText variant="overline" tone="tertiary">
            Habits
          </AppText>
          <AppText variant="h2" style={{ marginTop: 6 }}>
            Your rhythm
          </AppText>
        </View>
        <TactilePressable
          onPress={handleAddHabit}
          scaleDownTo={0.92}
          hapticStyle="medium"
          accessibilityRole="button"
          accessibilityLabel="Add habit"
          style={{
            width: 44,
            height: 44,
            borderRadius: 15,
            backgroundColor: colors.primary.default,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="add" size={20} color={colors.primary.foreground} />
        </TactilePressable>
      </View>

      {/* Progress */}
      {totalDue > 0 ? (
        <View
          style={{
            marginTop: 22,
            backgroundColor: colors.surface.selected,
            borderRadius: 18,
            paddingVertical: 16,
            paddingHorizontal: 18,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <AppText variant="label" tone="link">
              {completedCount} of {totalDue} done today
            </AppText>
            <AppText variant="caption" tone="tertiary">
              {encouragement}
            </AppText>
          </View>
          <View
            style={{
              height: 5,
              borderRadius: 3,
              backgroundColor: colors.border.default,
              marginTop: 12,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                width: `${Math.min(progress, 100)}%`,
                height: '100%',
                borderRadius: 3,
                backgroundColor: colors.primary.default,
              }}
            />
          </View>
        </View>
      ) : null}

      {/* Search appears only when the list is long enough to need it. */}
      {dueHabits.length > 5 ? (
        <View
          style={{
            marginTop: 20,
            height: 42,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            paddingHorizontal: 14,
            borderRadius: 12,
            backgroundColor: colors.surface.muted,
          }}
        >
          <Ionicons name="search-outline" size={17} color={colors.text.tertiary} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Find a habit"
            placeholderTextColor={colors.text.tertiary}
            style={{ flex: 1, fontSize: 15, color: colors.text.primary, padding: 0 }}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            accessibilityLabel="Search habits"
          />
          {searchQuery.length > 0 ? (
            <TactilePressable
              onPress={() => setSearchQuery('')}
              scaleDownTo={0.88}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              style={{ padding: 4 }}
            >
              <Ionicons name="close-circle" size={17} color={colors.text.tertiary} />
            </TactilePressable>
          ) : null}
        </View>
      ) : null}

      {totalDue === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: 48, paddingHorizontal: 16 }}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 18,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.surface.selected,
            }}
          >
            <Ionicons name="leaf-outline" size={24} color={colors.primary.default} />
          </View>
          <AppText variant="h3" center style={{ marginTop: 16 }}>
            Nothing scheduled today
          </AppText>
          <AppText variant="bodySmall" tone="tertiary" center style={{ marginTop: 6, maxWidth: 260 }}>
            Start with one small habit. You can always add more.
          </AppText>
          <Button
            title="Create a habit"
            variant="secondary"
            size="sm"
            onPress={handleAddHabit}
            style={{ marginTop: 18 }}
          />
        </View>
      ) : grouped.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: 36 }}>
          <AppText variant="title" center>
            Nothing matches “{searchQuery.trim()}”
          </AppText>
          <AppText variant="bodySmall" tone="tertiary" center style={{ marginTop: 4 }}>
            Try a different word.
          </AppText>
        </View>
      ) : (
        grouped.map((group) => (
          <View key={group.slot} style={{ marginTop: 22 }}>
            <AppText variant="overline" tone="tertiary" style={{ marginBottom: 2 }}>
              {group.slot}
            </AppText>
            {group.habits.map((habit) => {
              const isCompleted = !!(habit?.id && todayCompletions[habit.id]);
              return (
                <View
                  key={habit.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 14,
                    paddingVertical: 13,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border.default,
                  }}
                >
                  <TactilePressable
                    onPress={() => handleHabitPress(habit)}
                    scaleDownTo={0.98}
                    hapticStyle="none"
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${habit.name}`}
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 14,
                    }}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isCompleted ? colors.surface.selected : colors.surface.muted,
                      }}
                    >
                      <Ionicons
                        name={getIconName(habit.icon) as any}
                        size={17}
                        color={isCompleted ? colors.primary.default : colors.text.secondary}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppText
                        variant="bodyLarge"
                        tone={isCompleted ? 'tertiary' : 'primary'}
                        numberOfLines={1}
                        style={isCompleted ? { textDecorationLine: 'line-through' } : undefined}
                      >
                        {habit.name}
                      </AppText>
                      <AppText variant="caption" tone="tertiary" style={{ marginTop: 1 }}>
                        {habitMeta(habit)}
                        {habit.reminderTime ? ` · ${habit.reminderTime}` : ''}
                      </AppText>
                    </View>
                  </TactilePressable>

                  <TactilePressable
                    onPress={() => toggleHabit(habit, isCompleted)}
                    scaleDownTo={0.86}
                    hapticStyle="light"
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isCompleted }}
                    accessibilityLabel={`${habit.name}, ${isCompleted ? 'done' : 'not done'}`}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 8,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isCompleted ? colors.primary.default : 'transparent',
                      borderWidth: isCompleted ? 0 : 1.5,
                      borderColor: colors.border.strong,
                    }}
                  >
                    {isCompleted ? (
                      <Ionicons name="checkmark" size={13} color={colors.primary.foreground} />
                    ) : null}
                  </TactilePressable>
                </View>
              );
            })}
          </View>
        ))
      )}

      {habits.length > dueHabits.length ? (
        <AppText variant="caption" tone="tertiary" center style={{ marginTop: 20 }}>
          {habits.length - dueHabits.length} more scheduled for other days
        </AppText>
      ) : null}

      {/* Routines */}
      <TactilePressable
        onPress={() => navigation.navigate('Routines')}
        scaleDownTo={0.99}
        hapticStyle="light"
        accessibilityRole="button"
        accessibilityLabel="Open mindful routines"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          marginTop: 32,
          paddingTop: 18,
          borderTopWidth: 1,
          borderTopColor: colors.border.default,
        }}
      >
        <Ionicons name="list-outline" size={19} color={colors.text.secondary} />
        <View style={{ flex: 1 }}>
          <AppText variant="title">Mindful routines</AppText>
          <AppText variant="caption" tone="tertiary" style={{ marginTop: 1 }}>
            Morning and evening sequences
          </AppText>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
      </TactilePressable>
    </ScreenContainer>
  );
}
