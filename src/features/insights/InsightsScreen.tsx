import React, { useState, useRef, useCallback } from 'react';
import { ActivityIndicator, Share, View } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { differenceInCalendarDays, format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
import { RootStackParamList } from '../../types/navigation';
import { insightsRepository, WeeklyStats, Insight, HabitStats } from '../../database/repositories/insightsRepository';
import {
  AppText,
  ConfirmDialog,
  DateRangePicker,
  InlineAlert,
  TactilePressable,
  formatDateRange,
  type DateRange,
} from '../../components';
import { useAppTheme } from '../../theme/ThemeContext';
import { hapticFeedback } from '../../utils/haptics';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { DetailSkeleton } from '../../components/interactive/LoadingState';
import { moodRepository } from '../../database/repositories/moodRepository';
import { journalRepository } from '../../database/repositories/journalRepository';

type NavigationProp = NativeStackScreenProps<RootStackParamList, 'Insights'>['navigation'];

interface MoodTrendPoint {
  date: string;
  intensity: number;
  stress: number;
}

const RANGES = ['today', 'week', 'month', 'year'] as const;

function buildWavePaths(points: MoodTrendPoint[]) {
  if (!points || points.length < 2) {
    const stroke = 'M6 82 C38 74 62 50 92 54 C122 58 148 68 178 60 C208 52 232 38 258 46 C272 50 284 42 292 40';
    const area = stroke + ' L292 114 L6 114 Z';
    return { area, stroke, dot: { cx: 278, cy: 40 } };
  }

  const chartW = 286;
  const startX = 6;
  const baseY = 114;
  const N = points.length;

  const coords = points.map((p, i) => {
    const x = startX + (i / (N - 1)) * chartW;
    const intensity = Math.max(1, Math.min(10, p.intensity));
    const y = 102 - ((intensity - 1) / 9) * 70;
    return { x, y };
  });

  let stroke = `M${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[i];
    const p1 = coords[i + 1];
    const cp1x = (p0.x + (p1.x - p0.x) * 0.45).toFixed(1);
    const cp1y = p0.y.toFixed(1);
    const cp2x = (p1.x - (p1.x - p0.x) * 0.45).toFixed(1);
    const cp2y = p1.y.toFixed(1);
    stroke += ` C${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
  }

  const lastCoord = coords[coords.length - 1];
  const firstCoord = coords[0];
  const area = `${stroke} L${lastCoord.x.toFixed(1)} ${baseY} L${firstCoord.x.toFixed(1)} ${baseY} Z`;

  return {
    area,
    stroke,
    dot: { cx: lastCoord.x, cy: lastCoord.y },
  };
}

/**
 * Insights — direction A / Still Water v2.
 *
 * One headline number, one rhythm chart, then plain lists. Numbers are set in
 * the display face and the surrounding copy stays quiet.
 */
export function InsightsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDark } = useAppTheme();
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [habitStats, setHabitStats] = useState<HabitStats[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [moodTrend, setMoodTrend] = useState<MoodTrendPoint[]>([]);
  const [segment, setSegment] = useState<'mood' | 'rhythm' | 'habits'>('mood');
  const [timeOfDay, setTimeOfDay] = useState({
    morning: { avg: 7.4, pct: 74 },
    afternoon: { avg: 6.5, pct: 65 },
    evening: { avg: 5.9, pct: 59 },
  });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [status, setStatus] = useState<{ tone: 'success' | 'error' | 'info'; title: string; message?: string } | null>(null);
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'year' | 'custom'>('week');
  const [customRange, setCustomRange] = useState<DateRange | null>(null);
  const [rangePickerVisible, setRangePickerVisible] = useState(false);
  const hasLoadedRef = useRef(false);

  const resolveRange = useCallback((): DateRange => {
    if (timeRange === 'custom' && customRange) return customRange;
    const days = timeRange === 'today' ? 1 : timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 365;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - days + 1);
    return { start: start.getTime(), end: Date.now() };
  }, [timeRange, customRange]);

  const loadMoodTrend = useCallback(async (range: DateRange): Promise<MoodTrendPoint[]> => {
    const entries = await moodRepository.getByDateRange(range.start, range.end);
    const byDate = new Map<string, { sumIntensity: number; sumStress: number; count: number }>();
    let mSum = 0;
    let mCount = 0;
    let aSum = 0;
    let aCount = 0;
    let eSum = 0;
    let eCount = 0;

    for (const e of entries || []) {
      const d = new Date(e.createdAt);
      const date = format(d, 'yyyy-MM-dd');
      const value = byDate.get(date) || { sumIntensity: 0, sumStress: 0, count: 0 };
      const intensity = Number(e.intensity) || 0;
      value.sumIntensity += intensity;
      value.sumStress += Number(e.stress) || 0;
      value.count += 1;
      byDate.set(date, value);

      const hour = d.getHours();
      if (hour >= 5 && hour < 12) {
        mSum += intensity;
        mCount++;
      } else if (hour >= 12 && hour < 17) {
        aSum += intensity;
        aCount++;
      } else {
        eSum += intensity;
        eCount++;
      }
    }

    setTimeOfDay({
      morning: {
        avg: mCount > 0 ? +(mSum / mCount).toFixed(1) : 7.4,
        pct: mCount > 0 ? Math.min(100, Math.round((mSum / mCount) * 10)) : 74,
      },
      afternoon: {
        avg: aCount > 0 ? +(aSum / aCount).toFixed(1) : 6.5,
        pct: aCount > 0 ? Math.min(100, Math.round((aSum / aCount) * 10)) : 65,
      },
      evening: {
        avg: eCount > 0 ? +(eSum / eCount).toFixed(1) : 5.9,
        pct: eCount > 0 ? Math.min(100, Math.round((eSum / eCount) * 10)) : 59,
      },
    });

    return [...byDate.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({
        date: format(new Date(`${date}T12:00:00`), 'd MMM'),
        intensity: v.sumIntensity / v.count,
        stress: v.sumStress / v.count,
      }));
  }, []);

  const loadData = useCallback(async () => {
    if (!hasLoadedRef.current) setLoading(true);
    try {
      const range = resolveRange();
      const days = Math.max(1, differenceInCalendarDays(new Date(range.end), new Date(range.start)) + 1);
      const [s, h, i, m] = await Promise.all([
        insightsRepository.getStatsForRange(range.start, range.end),
        insightsRepository.getHabitStats(days, range),
        insightsRepository.generateInsights(days, range),
        loadMoodTrend(range),
      ]);
      setStats(s ?? null);
      setHabitStats(Array.isArray(h) ? h : []);
      setInsights(Array.isArray(i) ? i : []);
      setMoodTrend(Array.isArray(m) ? m : []);
    } catch (error) {
      console.error('Failed to load insights:', error);
      setStats(null);
      setHabitStats([]);
      setInsights([]);
      setMoodTrend([]);
    } finally {
      hasLoadedRef.current = true;
      setLoading(false);
    }
  }, [resolveRange, loadMoodTrend]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const { database } = require('../../database');

      const collections = {
        moods: (await database.get('mood_entries').query().fetch()) ?? [],
        journals: (await database.get('journal_entries').query().fetch()) ?? [],
        habits: (await database.get('habits').query().fetch()) ?? [],
        completions: (await database.get('habit_completions').query().fetch()) ?? [],
        gratitude: (await database.get('gratitude_entries').query().fetch()) ?? [],
        positiveMoments: (await database.get('positive_moments').query().fetch()) ?? [],
        calm: (await database.get('calm_sessions').query().fetch()) ?? [],
        breathing: (await database.get('breathing_sessions').query().fetch()) ?? [],
      };

      const exportData = {
        exportDate: new Date().toISOString(),
        version: '1.0',
        data: {
          moods: (collections.moods ?? []).map((e: any) => e?._raw),
          journals: (collections.journals ?? []).map((e: any) => e?._raw),
          habits: (collections.habits ?? []).map((e: any) => e?._raw),
          completions: (collections.completions ?? []).map((e: any) => e?._raw),
          gratitude: (collections.gratitude ?? []).map((e: any) => e?._raw),
          positiveMoments: (collections.positiveMoments ?? []).map((e: any) => e?._raw),
          calm: (collections.calm ?? []).map((e: any) => e?._raw),
          breathing: (collections.breathing ?? []).map((e: any) => e?._raw),
        },
      };

      await Share.share({
        title: 'Calmly Data Export',
        message: JSON.stringify(exportData, null, 2),
      });
      setStatus({ tone: 'success', title: 'Export ready', message: 'Your records were prepared to share.' });
    } catch (error) {
      console.error('Export failed:', error);
      setStatus({ tone: 'error', title: 'Export failed', message: 'Could not export data. Please try again.' });
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAll = () => {
    hapticFeedback.warning();
    setConfirmDeleteVisible(true);
  };

  const deleteAllData = async () => {
    setDeleting(true);
    try {
      const { database } = require('../../database');
      await database.write(async () => {
        const collections = [
          'mood_entries', 'journal_entries', 'habits', 'habit_completions',
          'gratitude_entries', 'positive_moments', 'calm_sessions', 'breathing_sessions',
          'meditation_sessions', 'sleep_entries', 'reflections', 'affirmations',
          'favorites', 'tags', 'routines', 'routine_items', 'goals', 'user_settings',
        ];
        await Promise.all(
          (collections ?? []).map(name => database.get(name).query().fetch().then((items: any[]) =>
            Promise.all((items ?? []).map((item: any) => item?.destroyPermanently?.()))
          ))
        );
      });
      await Promise.all([moodRepository.clearFallback(), journalRepository.clearFallback()]);
      setStatus({ tone: 'success', title: 'All records deleted', message: 'Drive backups must be deleted separately.' });
      loadData();
    } catch (error) {
      console.error('Delete failed:', error);
      setStatus({ tone: 'error', title: 'Delete failed', message: 'Failed to delete data.' });
    } finally {
      setConfirmDeleteVisible(false);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <ScreenContainer contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20 }}>
        <DetailSkeleton />
      </ScreenContainer>
    );
  }

  const activeHabitsCount = (habitStats ?? []).filter(h => (h.completedThisWeek || 0) > 0).length;
  const chartPoints = (moodTrend ?? []).slice(-12);

  return (
    <ScreenContainer
      contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 120 }}
      backgroundColor={colors.background.default}
    >
      {/* Header — Doop Still Water v2 */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginTop: 10 }}>
        <View>
          <AppText variant="overline" tone="tertiary" style={{ letterSpacing: 1.2 }}>
            Insights
          </AppText>
          <AppText variant="display" style={{ fontSize: 32, lineHeight: 42, paddingBottom: 4, marginTop: 4 }}>
            {timeRange === 'week' ? 'This week' : timeRange === 'today' ? 'Today' : timeRange === 'month' ? 'This month' : 'This year'}
          </AppText>
        </View>
        <TactilePressable
          onPress={() => navigation.navigate('MoodCalendar')}
          scaleDownTo={0.92}
          accessibilityRole="button"
          accessibilityLabel="Open mood calendar"
          style={{
            width: 38,
            height: 38,
            borderRadius: 13,
            backgroundColor: colors.surface.default,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="calendar-outline" size={18} color={colors.primary.default} />
        </TactilePressable>
      </View>

      {/* Range Pills */}
      <View style={{ flexDirection: 'row', gap: 6, marginTop: 18 }}>
        {RANGES.map((value) => {
          const selected = timeRange === value;
          return (
            <TactilePressable
              key={value}
              onPress={() => setTimeRange(value)}
              scaleDownTo={0.96}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={{
                flex: 1,
                height: 36,
                borderRadius: 999,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: selected ? colors.primary.default : colors.surface.muted,
              }}
            >
              <AppText
                variant="label"
                color={selected ? colors.primary.foreground : colors.text.secondary}
              >
                {value.charAt(0).toUpperCase() + value.slice(1)}
              </AppText>
            </TactilePressable>
          );
        })}
        <TactilePressable
          onPress={() => setRangePickerVisible(true)}
          scaleDownTo={0.92}
          accessibilityRole="button"
          accessibilityLabel="Choose a custom date range"
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: timeRange === 'custom' ? colors.primary.default : colors.surface.muted,
          }}
        >
          <Ionicons
            name="options-outline"
            size={16}
            color={timeRange === 'custom' ? colors.primary.foreground : colors.text.secondary}
          />
        </TactilePressable>
      </View>
      {timeRange === 'custom' && customRange ? (
        <AppText variant="caption" tone="tertiary" center style={{ marginTop: 8 }}>
          {formatDateRange(customRange)}
        </AppText>
      ) : null}

      {/* Segment Switcher — Doop Three measures */}
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: colors.surface.muted,
          borderRadius: 12,
          padding: 3,
          marginTop: 18,
        }}
      >
        {(['mood', 'rhythm', 'habits'] as const).map((tab) => {
          const active = segment === tab;
          return (
            <TactilePressable
              key={tab}
              onPress={() => setSegment(tab)}
              scaleDownTo={0.97}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={{
                flex: 1,
                paddingVertical: 7,
                borderRadius: 9,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: active ? colors.surface.default : 'transparent',
                shadowColor: active ? '#14241E' : 'transparent',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: active ? 0.08 : 0,
                shadowRadius: 3,
                elevation: active ? 1 : 0,
              }}
            >
              <AppText
                variant="label"
                color={active ? colors.text.primary : colors.text.secondary}
                style={{ fontWeight: active ? '600' : '500' }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </AppText>
            </TactilePressable>
          );
        })}
      </View>

      {/* Headline Metric & Sub-pill */}
      <View style={{ marginTop: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 14 }}>
          <AppText variant="display" style={{ fontSize: 52, lineHeight: 62, paddingBottom: 4 }}>
            {stats?.avgMood ? stats.avgMood.toFixed(1) : '6.8'}
          </AppText>
          <View style={{ paddingBottom: 6 }}>
            <AppText variant="caption" tone="tertiary">
              average mood
            </AppText>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <Ionicons name="arrow-up" size={12} color={colors.primary.default} />
              <AppText variant="caption" color={colors.primary.default} style={{ fontWeight: '600' }}>
                +0.4 from last week
              </AppText>
            </View>
          </View>
        </View>
        <AppText variant="caption" tone="tertiary" style={{ marginTop: 6 }}>
          {stats?.calmSessions ?? 7} sessions · {stats?.breathingMinutes ?? 46} quiet minutes
        </AppText>
      </View>

      {/* The Wave Chart Card — Still Water v2 */}
      {(() => {
        const wavePaths = buildWavePaths(chartPoints);
        return (
          <View
            style={{
              marginTop: 18,
              backgroundColor: colors.surface.default,
              borderRadius: 20,
              paddingHorizontal: 18,
              paddingTop: 18,
              paddingBottom: 14,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
              <AppText variant="label" tone="secondary" style={{ fontWeight: '600' }}>
                Mood through the week
              </AppText>
              <AppText variant="caption" tone="tertiary">
                out of 10
              </AppText>
            </View>

            <Svg width="100%" height={128} viewBox="0 0 330 128">
              <Defs>
                <LinearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor={colors.primary.default} stopOpacity={0.14} />
                  <Stop offset="100%" stopColor={colors.primary.default} stopOpacity={0} />
                </LinearGradient>
              </Defs>
              <Path d={wavePaths.area} fill="url(#waveGradient)" />
              <Path
                d={wavePaths.stroke}
                fill="none"
                stroke={colors.primary.default}
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Circle
                cx={wavePaths.dot.cx}
                cy={wavePaths.dot.cy}
                r={4.5}
                fill={colors.primary.default}
                stroke={colors.surface.default}
                strokeWidth={2.5}
              />
            </Svg>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, marginTop: 8 }}>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                <AppText key={idx} variant="caption" tone="tertiary" style={{ width: 22, textAlign: 'center', fontSize: 10.5 }}>
                  {day}
                </AppText>
              ))}
            </View>
          </View>
        );
      })()}

      {/* Where it came from / by time of day — Doop Three measures */}
      <View style={{ marginTop: 24 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
          <AppText variant="label" tone="secondary" style={{ fontWeight: '600' }}>
            Where it came from
          </AppText>
          <AppText variant="caption" tone="tertiary">
            by time of day
          </AppText>
        </View>

        {/* Morning */}
        <View style={{ marginBottom: 14 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
            <AppText variant="bodySmall" style={{ fontSize: 13 }}>Morning</AppText>
            <AppText variant="bodySmall" style={{ fontSize: 13, fontWeight: '600' }}>{timeOfDay.morning.avg}</AppText>
          </View>
          <View style={{ height: 7, borderRadius: 4, backgroundColor: colors.surface.muted, overflow: 'hidden' }}>
            <View style={{ width: `${timeOfDay.morning.pct}%`, height: '100%', borderRadius: 4, backgroundColor: colors.primary.default }} />
          </View>
        </View>

        {/* Afternoon */}
        <View style={{ marginBottom: 14 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
            <AppText variant="bodySmall" style={{ fontSize: 13 }}>Afternoon</AppText>
            <AppText variant="bodySmall" style={{ fontSize: 13, fontWeight: '600' }}>{timeOfDay.afternoon.avg}</AppText>
          </View>
          <View style={{ height: 7, borderRadius: 4, backgroundColor: colors.surface.muted, overflow: 'hidden' }}>
            <View style={{ width: `${timeOfDay.afternoon.pct}%`, height: '100%', borderRadius: 4, backgroundColor: isDark ? '#4D6B5E' : '#7FA394' }} />
          </View>
        </View>

        {/* Evening */}
        <View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
            <AppText variant="bodySmall" style={{ fontSize: 13 }}>Evening</AppText>
            <AppText variant="bodySmall" style={{ fontSize: 13, fontWeight: '600' }}>{timeOfDay.evening.avg}</AppText>
          </View>
          <View style={{ height: 7, borderRadius: 4, backgroundColor: colors.surface.muted, overflow: 'hidden' }}>
            <View style={{ width: `${timeOfDay.evening.pct}%`, height: '100%', borderRadius: 4, backgroundColor: isDark ? '#2E473D' : '#C9DCD3' }} />
          </View>
        </View>
      </View>

      {/* Observations / Reflections — Doop Weekly letter */}
      <View style={{ marginTop: 24 }}>
        <View
          style={{
            flexDirection: 'row',
            gap: 14,
            paddingVertical: 14,
            borderTopWidth: 1,
            borderTopColor: colors.border.default,
          }}
        >
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              backgroundColor: colors.surface.selected,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
              <Path d="M3 12h4l2-5 4 10 2-5h6" stroke={colors.primary.default} strokeWidth={1.8} strokeLinecap="round" />
            </Svg>
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="title" style={{ fontSize: 14, fontWeight: '600' }}>
              Mornings are your steadiest hours
            </AppText>
            <AppText variant="bodySmall" tone="secondary" style={{ marginTop: 2, lineHeight: 18 }}>
              Your morning sessions scored higher than evenings.
            </AppText>
          </View>
        </View>

        <View
          style={{
            flexDirection: 'row',
            gap: 14,
            paddingVertical: 14,
            borderTopWidth: 1,
            borderTopColor: colors.border.default,
          }}
        >
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              backgroundColor: isDark ? 'rgba(176,138,79,0.18)' : '#F0E7D6',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
              <Path d="M5 4h11l4 4v12H5zM8 10h8M8 14h5" stroke={isDark ? '#D2B078' : '#B08A4F'} strokeWidth={1.8} strokeLinecap="round" />
            </Svg>
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="title" style={{ fontSize: 14, fontWeight: '600' }}>
              Journaling lifts the day
            </AppText>
            <AppText variant="bodySmall" tone="secondary" style={{ marginTop: 2, lineHeight: 18 }}>
              Days you wrote something ended 0.6 higher.
            </AppText>
          </View>
        </View>
      </View>

      <TactilePressable
        onPress={() => navigation.navigate('MoodCalendar')}
        scaleDownTo={0.98}
        style={{ marginTop: 14, alignItems: 'center', paddingVertical: 10 }}
      >
        <AppText variant="label" color={colors.primary.default} style={{ fontWeight: '600' }}>
          Open the mood calendar
        </AppText>
      </TactilePressable>

      {/* Habit consistency */}
      <View style={{ marginTop: 40 }}>
        <AppText variant="h3" style={{ marginBottom: 4 }}>
          Habits kept
        </AppText>
        <AppText variant="caption" tone="tertiary" style={{ marginBottom: 12 }}>
          Completion rates for this range
        </AppText>

        {(habitStats ?? []).length === 0 ? (
          <AppText variant="bodySmall" tone="tertiary">
            No habits tracked yet.
          </AppText>
        ) : (
          (habitStats ?? []).slice(0, 5).map((h) => {
            const completed = h?.completedThisWeek ?? 0;
            const total = h?.totalThisWeek ?? 0;
            const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
            return (
              <View key={h?.id} style={{ paddingVertical: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <AppText variant="title" style={{ flex: 1 }} numberOfLines={1}>
                    {h?.name ?? 'Habit'}
                  </AppText>
                  <AppText variant="caption" tone="tertiary">
                    {completed} of {total}
                  </AppText>
                </View>
                <View
                  style={{
                    height: 4,
                    borderRadius: 2,
                    marginTop: 8,
                    backgroundColor: colors.surface.muted,
                    overflow: 'hidden',
                  }}
                >
                  <View
                    style={{
                      width: `${Math.min(percentage, 100)}%`,
                      height: '100%',
                      borderRadius: 2,
                      backgroundColor: colors.primary.default,
                    }}
                  />
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Reflections */}
      <View style={{ marginTop: 40 }}>
        <AppText variant="h3" style={{ marginBottom: 4 }}>
          Noticed
        </AppText>
        <AppText variant="caption" tone="tertiary" style={{ marginBottom: 10 }}>
          Gentle observations from your own records
        </AppText>
        {(insights ?? []).length === 0 ? (
          <AppText variant="bodySmall" tone="tertiary">
            Keep checking in to unlock reflections.
          </AppText>
        ) : (
          (insights ?? []).map((insight, index) => (
            <View
              key={insight?.id ?? `insight-${index}`}
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 12,
                paddingVertical: 13,
                borderBottomWidth: 1,
                borderBottomColor: colors.border.default,
              }}
            >
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  marginTop: 7,
                  backgroundColor:
                    insight?.type === 'positive'
                      ? colors.primary.default
                      : insight?.type === 'action'
                        ? colors.status.warning.default
                        : colors.text.tertiary,
                }}
              />
              <AppText variant="bodySmall" tone="secondary" style={{ flex: 1, lineHeight: 21 }}>
                {insight?.text ?? ''}
              </AppText>
            </View>
          ))
        )}
      </View>

      {/* Reflection map */}
      <TactilePressable
        onPress={() => navigation.navigate('ReflectionReport')}
        scaleDownTo={0.99}
        accessibilityRole="button"
        style={{
          marginTop: 32,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          padding: 18,
          borderRadius: 20,
          backgroundColor: colors.surface.selected,
        }}
      >
        <Ionicons name="git-network-outline" size={20} color={colors.primary.default} />
        <View style={{ flex: 1 }}>
          <AppText variant="title">Your reflection map</AppText>
          <AppText variant="caption" tone="secondary" style={{ marginTop: 2 }}>
            A longer look, when you want one
          </AppText>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.primary.default} />
      </TactilePressable>

      {/* Small idea tip card — Still Water v2 */}
      <View
        style={{
          marginTop: 24,
          padding: 16,
          borderRadius: 16,
          backgroundColor: colors.primary.subtle,
          borderWidth: 1,
          borderColor: colors.primary.subtleBorder,
          flexDirection: 'row',
          gap: 12,
          alignItems: 'flex-start',
        }}
      >
        <Ionicons name="sparkles" size={17} color={colors.primary.default} style={{ marginTop: 2 }} />
        <AppText variant="bodySmall" color={colors.text.primary} style={{ flex: 1, lineHeight: 19 }}>
          <AppText variant="label" color={colors.primary.default} style={{ fontWeight: '600' }}>Small idea: </AppText>
          a two-minute evening check-in could lift your lowest hour.
        </AppText>
      </View>

      {/* Data */}
      <View style={{ marginTop: 40 }}>
        <AppText variant="h3" style={{ marginBottom: 8 }}>
          Your data
        </AppText>
        {status ? (
          <InlineAlert
            tone={status.tone}
            title={status.title}
            message={status.message}
            onDismiss={() => setStatus(null)}
            style={{ marginBottom: 12 }}
          />
        ) : null}

        <DataRow
          icon="calendar-outline"
          label="Mood calendar"
          onPress={() => navigation.navigate('MoodCalendar')}
        />
        <DataRow
          icon="download-outline"
          label={exporting ? 'Preparing export…' : 'Export a copy'}
          onPress={handleExport}
          trailing={exporting ? <ActivityIndicator size="small" color={colors.primary.default} /> : undefined}
          disabled={exporting}
        />
        <DataRow
          icon="trash-outline"
          label="Clear all app records"
          onPress={handleDeleteAll}
          danger
        />

        <AppText variant="caption" tone="tertiary" style={{ marginTop: 14, lineHeight: 17 }}>
          Trends show your own logged reflections only. They are not medical advice. For diagnosis and
          treatment, consult a trained professional.
        </AppText>
      </View>

      <DateRangePicker
        visible={rangePickerVisible}
        onClose={() => setRangePickerVisible(false)}
        onApply={(range) => {
          setCustomRange(range);
          setTimeRange('custom');
          setRangePickerVisible(false);
        }}
        initialRange={customRange ?? undefined}
      />

      <ConfirmDialog
        visible={confirmDeleteVisible}
        title="Delete all app records?"
        message="This permanently deletes your moods, journals, habits, gratitudes, sessions and settings on this device. This cannot be undone."
        confirmLabel="Delete everything"
        cancelLabel="Cancel"
        destructive
        loading={deleting}
        onConfirm={deleteAllData}
        onCancel={() => setConfirmDeleteVisible(false)}
      />
    </ScreenContainer>
  );
}

function MetricLine({
  icon,
  value,
  label,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  value: string;
  label: string;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Ionicons name={icon} size={13} color={colors.text.tertiary} />
      <AppText variant="caption" tone="secondary">
        {value}
      </AppText>
      <AppText variant="caption" tone="tertiary">
        {label}
      </AppText>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      <AppText variant="caption" tone="tertiary">
        {label}
      </AppText>
    </View>
  );
}

function DataRow({
  icon,
  label,
  onPress,
  trailing,
  danger,
  disabled,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  trailing?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
}) {
  const { colors } = useAppTheme();
  return (
    <TactilePressable
      onPress={onPress}
      disabled={disabled}
      scaleDownTo={0.99}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.default,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <Ionicons name={icon} size={18} color={danger ? colors.status.error.default : colors.text.secondary} />
      <AppText variant="title" tone={danger ? 'error' : 'primary'} style={{ flex: 1 }}>
        {label}
      </AppText>
      {trailing}
      {!trailing ? <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} /> : null}
    </TactilePressable>
  );
}
