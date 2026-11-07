import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { insightsRepository } from '../../database/repositories/insightsRepository';
import { MoodEntry } from '../../database/models';
import { AppText, AppIcon, moodIcon, ScreenHeader, TactilePressable } from '../../components';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useAppTheme } from '../../theme/ThemeContext';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { PopIn } from '../../components/interactive/PopIn';
import { GridSkeleton } from '../../components/interactive/LoadingState';

type NavigationProp = NativeStackScreenProps<RootStackParamList, 'MoodCalendar'>['navigation'];

/** Split a stored mood field that may hold several feelings. */
function moodLabels(value: unknown): string[] {
  return String(value ?? '')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => name.charAt(0).toUpperCase() + name.slice(1));
}

interface DayMoodData {
  mood: string;
  intensity: number;
  stress: number;
  energy: string;
  hasJournal: boolean;
  habitsCompleted: number;
  habitsTotal: number;
}

/**
 * Mood calendar — one month at a glance.
 *
 * A day with a check-in carries a small pine dot. The selected day fills with
 * pine. Everything else stays on the ground so the pattern is easy to read.
 */
export function MoodCalendarScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useAppTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [moodData, setMoodData] = useState<Record<number, DayMoodData>>({});
  const [initialLoading, setInitialLoading] = useState(true);
  const [fetching, setFetching] = useState(false);

  const loadMonthData = useCallback(async (isInitial = false) => {
    if (isInitial) {
      setInitialLoading(true);
    } else {
      setFetching(true);
    }
    try {
      const safeDate = currentDate ?? new Date();
      const year = safeDate?.getFullYear?.() ?? new Date().getFullYear();
      const month = safeDate?.getMonth?.() ?? 0;

      const data = (await insightsRepository.getMoodCalendarData(year, month)) ?? {};

      const entriesByDay: Record<number, MoodEntry[]> = {};
      Object.values(data ?? {}).forEach((entry: any) => {
        if (!entry?.createdAt) return;
        const d = new Date(entry.createdAt);
        if (isNaN(d?.getTime?.() ?? NaN)) return;
        const day = d.getDate();
        if (day == null || isNaN(day)) return;
        if (!entriesByDay[day]) entriesByDay[day] = [];
        entriesByDay[day].push(entry);
      });

      const enriched: Record<number, DayMoodData> = {};
      Object.entries(entriesByDay ?? {}).forEach(([dayStr, entries]) => {
        const day = parseInt(dayStr ?? '', 10);
        if (isNaN(day)) return;
        const safeEntries = entries ?? [];
        if (!safeEntries.length) return;
        const latest = safeEntries[0];
        if (!latest) return;
        enriched[day] = {
          mood: (latest as any)?.mood ?? 'happy',
          intensity: (latest as any)?.intensity ?? 0,
          stress: (latest as any)?.stress ?? 0,
          energy: (latest as any)?.energy ?? '',
          hasJournal: false,
          habitsCompleted: 0,
          habitsTotal: 0,
        };
      });

      setMoodData(enriched ?? {});
      setSelectedDay(null);
    } catch (error) {
      console.error('Failed to load mood calendar:', error);
      setMoodData({});
      setSelectedDay(null);
    } finally {
      setInitialLoading(false);
      setFetching(false);
    }
  }, [currentDate]);

  useEffect(() => {
    loadMonthData(true);
  }, []);

  useEffect(() => {
    loadMonthData(false);
  }, [currentDate]);

  const safeCurrentDate = currentDate ?? new Date();
  const year = safeCurrentDate?.getFullYear?.() ?? new Date().getFullYear();
  const month = safeCurrentDate?.getMonth?.() ?? 0;
  let monthName = '';
  try {
    monthName = safeCurrentDate?.toLocaleString?.('default', { month: 'long' }) ?? '';
  } catch {
    monthName = '';
  }

  const daysInMonth = new Date(year, month + 1, 0)?.getDate?.() ?? 30;
  const firstDay = new Date(year, month, 1)?.getDay?.() ?? 0;

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleDayPress = (day: number) => {
    if ((moodData ?? {})?.[day]) {
      setSelectedDay(day);
    }
  };

  const renderDay = (day: number) => {
    const isSelected = selectedDay === day;
    const hasData = !!(moodData ?? {})?.[day];
    let isTodayDay = false;
    try {
      const todayStr = format(new Date(), 'yyyy-MM-dd') ?? '';
      const thisDayStr = format(new Date(year, month, day), 'yyyy-MM-dd') ?? '';
      isTodayDay = !!todayStr && todayStr === thisDayStr;
    } catch {
      isTodayDay = false;
    }

    const dayData = hasData ? (moodData ?? {})[day] ?? null : null;
    const moodKey = String((dayData as any)?.mood ?? '').split(',')[0].trim();

    return (
      <View key={day} style={styles.dayCellContainer}>
        <TactilePressable
          onPress={() => handleDayPress(day)}
          disabled={!hasData}
          scaleDownTo={0.92}
          hapticStyle="selection"
          accessibilityRole="button"
          accessibilityLabel={`Day ${day}${hasData ? ', has a check-in' : ''}`}
          style={[
            styles.dayCell,
            isSelected && { backgroundColor: colors.primary.default },
            isTodayDay && !isSelected && { borderWidth: 1.5, borderColor: colors.primary.default },
          ]}
        >
          <AppText
            variant="label"
            tone={isSelected ? 'onPrimary' : hasData ? 'primary' : 'tertiary'}
          >
            {day}
          </AppText>
          {hasData ? (
            <View
              style={[
                styles.moodDot,
                {
                  backgroundColor: isSelected ? colors.primary.foreground : colors.primary.default,
                },
              ]}
            >
              <AppIcon name={moodIcon(moodKey)} size={8} loop={false} />
            </View>
          ) : null}
        </TactilePressable>
      </View>
    );
  };

  const selectedDayData = selectedDay != null ? ((moodData ?? {})?.[selectedDay] ?? null) : null;

  const DISCLAIMER = 'Trends show your own logged reflections only. They are not medical advice. For diagnosis and treatment, consult a trained professional.';

  if (initialLoading) {
    return (
      <ScreenContainer
        scroll={false}
        backgroundColor={colors.background.default}
        style={{ paddingHorizontal: 24, paddingTop: 16 }}
      >
        <GridSkeleton cells={12} columns={3} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll={false} backgroundColor={colors.background.default}>
      <ScreenHeader title="Mood calendar" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.monthNav}>
          <TactilePressable
            onPress={handlePrevMonth}
            scaleDownTo={0.92}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Previous month"
            style={styles.arrowButton}
          >
            <Ionicons name="chevron-back" size={20} color={colors.text.secondary} />
          </TactilePressable>
          <AppText variant="h3" style={{ flex: 1, textAlign: 'center' }}>
            {monthName} {year}
          </AppText>
          <TactilePressable
            onPress={handleNextMonth}
            scaleDownTo={0.92}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Next month"
            style={styles.arrowButton}
          >
            <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
          </TactilePressable>
        </View>

        <PopIn index={0}>
          <View style={{ marginTop: 20 }}>
            <View style={styles.weekdays}>
              {(weekDays ?? []).map((day, index) => (
                <AppText key={day ?? 'ph-' + index} variant="caption" tone="tertiary" style={styles.weekday}>
                  {day ?? ''}
                </AppText>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {[...Array(Math.max(0, firstDay ?? 0))].map((_, i) => (
                <View key={`empty-${i}`} style={styles.dayCellContainer}>
                  <View style={styles.dayCellEmpty} />
                </View>
              ))}
              {[...Array(Math.max(0, daysInMonth ?? 0))].map((_, i) => renderDay(i + 1))}
            </View>
          </View>
        </PopIn>

        {selectedDayData ? (
          <PopIn index={1}>
            <View style={[styles.detailCard, { backgroundColor: colors.surface.default }]}>
              <AppText variant="overline" tone="tertiary" center>
                {selectedDay ?? ''} {monthName ?? ''} {year ?? ''}
              </AppText>
              <View style={styles.detailMoodRow}>
                <View style={[styles.moodCircle, { backgroundColor: colors.primary.subtle }]}>
                  <AppIcon
                    name={moodIcon(String((selectedDayData as any)?.mood ?? '').split(',')[0].trim())}
                    size={28}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="title">
                    {moodLabels((selectedDayData as any)?.mood).join(' · ') || 'Unknown'}
                  </AppText>
                  <AppText variant="caption" tone="tertiary" style={{ marginTop: 3 }}>
                    Intensity {(selectedDayData as any)?.intensity ?? 0}/10 · Stress{' '}
                    {(selectedDayData as any)?.stress ?? 0}/10
                  </AppText>
                </View>
              </View>

              <View style={[styles.detailStats, { borderTopColor: colors.border.default }]}>
                <View style={{ flex: 1 }}>
                  <AppText variant="caption" tone="tertiary">
                    Journal entry
                  </AppText>
                  <AppText variant="body" style={{ marginTop: 2 }}>
                    {(selectedDayData as any)?.hasJournal ? 'Recorded' : 'None'}
                  </AppText>
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="caption" tone="tertiary">
                    Habits done
                  </AppText>
                  <AppText variant="body" style={{ marginTop: 2 }}>
                    {(selectedDayData as any)?.habitsCompleted ?? 0}/
                    {(selectedDayData as any)?.habitsTotal ?? 0}
                  </AppText>
                </View>
              </View>
            </View>
          </PopIn>
        ) : (
          <PopIn index={1}>
            <View style={{ alignItems: 'center', paddingVertical: 32 }}>
              <Ionicons name="calendar-outline" size={26} color={colors.text.tertiary} />
              <AppText variant="body" center style={{ marginTop: 12 }}>
                Tap a marked day
              </AppText>
              <AppText variant="bodySmall" tone="tertiary" center style={{ marginTop: 4, maxWidth: 270 }}>
                Days with a check-in carry a dot. Tap one to read the details.
              </AppText>
            </View>
          </PopIn>
        )}

        <AppText variant="caption" tone="tertiary" style={{ marginTop: 24, lineHeight: 18 }}>
          {DISCLAIMER}
        </AppText>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 48 },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  arrowButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdays: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 6,
  },
  weekday: {
    width: '14.285%',
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
  },
  dayCellContainer: {
    width: '14.285%',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },
  dayCell: {
    width: 40,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellEmpty: {
    width: 40,
    height: 48,
  },
  moodDot: {
    marginTop: 3,
    width: 13,
    height: 13,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailCard: {
    marginTop: 28,
    borderRadius: 20,
    padding: 20,
  },
  detailMoodRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 12 },
  moodCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailStats: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
  },
});
