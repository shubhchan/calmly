import React, { useState, useRef, useCallback, useMemo } from 'react';
import { View } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { differenceInCalendarDays, format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
import { RootStackParamList } from '../../types/navigation';
import { insightsRepository, WeeklyStats, Insight } from '../../database/repositories/insightsRepository';
import {
  AppText,
  DateRangePicker,
  TactilePressable,
  formatDateRange,
  type DateRange,
} from '../../components';
import { useAppTheme } from '../../theme/ThemeContext';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { DetailSkeleton } from '../../components/interactive/LoadingState';
import { moodRepository } from '../../database/repositories/moodRepository';

type NavigationProp = NativeStackScreenProps<RootStackParamList, 'Insights'>['navigation'];

interface MoodTrendPoint {
  date: string;
  intensity: number;
  stress: number;
}

type RangeKey = 'week' | 'month' | 'year' | 'custom';

/** Three ranges plus a picker. Enough to look, never a wall of tabs. */
const RANGES: { value: Exclude<RangeKey, 'custom'>; label: string }[] = [
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
];

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
 * Insights — one headline, one wave, one observation.
 *
 * The page answers a single question: "how have I been?" Everything that
 * needs a spreadsheet lives in the mood calendar or the reflection report.
 */
export function InsightsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDark } = useAppTheme();
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [moodTrend, setMoodTrend] = useState<MoodTrendPoint[]>([]);
  const [timeOfDay, setTimeOfDay] = useState({
    morning: { avg: 7.4, pct: 74 },
    afternoon: { avg: 6.5, pct: 65 },
    evening: { avg: 5.9, pct: 59 },
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<RangeKey>('week');
  const [customRange, setCustomRange] = useState<DateRange | null>(null);
  const [rangePickerVisible, setRangePickerVisible] = useState(false);
  const hasLoadedRef = useRef(false);

  const resolveRange = useCallback((): DateRange => {
    if (timeRange === 'custom' && customRange) return customRange;
    const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 365;
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
      const [s, i, m] = await Promise.all([
        insightsRepository.getStatsForRange(range.start, range.end),
        insightsRepository.generateInsights(days, range),
        loadMoodTrend(range),
      ]);
      setStats(s ?? null);
      setInsights(Array.isArray(i) ? i : []);
      setMoodTrend(Array.isArray(m) ? m : []);
    } catch (error) {
      console.error('Failed to load insights:', error);
      setStats(null);
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

  const chartPoints = useMemo(() => (moodTrend ?? []).slice(-12), [moodTrend]);

  const trendDelta = useMemo(() => {
    if (chartPoints.length < 4) return null;
    const half = Math.floor(chartPoints.length / 2);
    const avg = (list: MoodTrendPoint[]) =>
      list.reduce((sum, p) => sum + p.intensity, 0) / list.length;
    const delta = avg(chartPoints.slice(half)) - avg(chartPoints.slice(0, half));
    return Number.isFinite(delta) ? +delta.toFixed(1) : null;
  }, [chartPoints]);

  const rangeLabel =
    timeRange === 'custom' && customRange
      ? 'Your range'
      : timeRange === 'month'
        ? 'This month'
        : timeRange === 'year'
          ? 'This year'
          : 'This week';

  if (loading) {
    return (
      <ScreenContainer contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20 }}>
        <DetailSkeleton />
      </ScreenContainer>
    );
  }

  const wavePaths = buildWavePaths(chartPoints);
  const observation = insights[0];
  const averageMood = stats?.avgMood ? stats.avgMood.toFixed(1) : '—';

  return (
    <ScreenContainer
      contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 120 }}
      backgroundColor={colors.background.default}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginTop: 10 }}>
        <View>
          <AppText variant="overline" tone="tertiary" style={{ letterSpacing: 1.2 }}>
            Insights
          </AppText>
          <AppText variant="display" style={{ fontSize: 32, lineHeight: 42, paddingBottom: 4, marginTop: 4 }}>
            {rangeLabel}
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

      {/* Range — three spans, plus a picker */}
      <View style={{ flexDirection: 'row', gap: 6, marginTop: 18 }}>
        {RANGES.map((option) => {
          const selected = timeRange === option.value;
          return (
            <TactilePressable
              key={option.value}
              onPress={() => setTimeRange(option.value)}
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
                {option.label}
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

      {/* Headline */}
      <View style={{ marginTop: 22 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 14 }}>
          <AppText variant="display" style={{ fontSize: 52, lineHeight: 62, paddingBottom: 4 }}>
            {averageMood}
          </AppText>
          <View style={{ paddingBottom: 6 }}>
            <AppText variant="caption" tone="tertiary">
              average mood
            </AppText>
            {trendDelta !== null && trendDelta !== 0 ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <Ionicons
                  name={trendDelta > 0 ? 'arrow-up' : 'arrow-down'}
                  size={12}
                  color={trendDelta > 0 ? colors.primary.default : colors.text.tertiary}
                />
                <AppText variant="caption" tone="secondary">
                  {`${trendDelta > 0 ? '+' : ''}${trendDelta} across the span`}
                </AppText>
              </View>
            ) : null}
          </View>
        </View>
        <AppText variant="caption" tone="tertiary" style={{ marginTop: 6 }}>
          {stats?.calmSessions ?? 0} sessions · {stats?.breathingMinutes ?? 0} quiet minutes
        </AppText>
      </View>

      {/* The wave */}
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
            Your mood, day by day
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

      {/* When the days felt best */}
      <View style={{ marginTop: 24 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
          <AppText variant="label" tone="secondary" style={{ fontWeight: '600' }}>
            Best hours
          </AppText>
          <AppText variant="caption" tone="tertiary">
            by time of day
          </AppText>
        </View>

        <TimeBar label="Morning" avg={timeOfDay.morning.avg} pct={timeOfDay.morning.pct} fill={colors.primary.default} />
        <TimeBar
          label="Afternoon"
          avg={timeOfDay.afternoon.avg}
          pct={timeOfDay.afternoon.pct}
          fill={isDark ? '#4D6B5E' : '#7FA394'}
        />
        <TimeBar
          label="Evening"
          avg={timeOfDay.evening.avg}
          pct={timeOfDay.evening.pct}
          fill={isDark ? '#2E473D' : '#C9DCD3'}
          last
        />
      </View>

      {/* One observation */}
      {observation ? (
        <View
          style={{
            marginTop: 26,
            flexDirection: 'row',
            gap: 14,
            paddingTop: 16,
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
          <AppText variant="bodySmall" tone="secondary" style={{ flex: 1, lineHeight: 20 }}>
            {observation.text}
          </AppText>
        </View>
      ) : null}

      {/* Two ways deeper */}
      <View style={{ marginTop: 26, gap: 8 }}>
        <QuietLink
          icon="calendar-outline"
          label="Open the mood calendar"
          onPress={() => navigation.navigate('MoodCalendar')}
        />
        <QuietLink
          icon="git-network-outline"
          label="See the reflection map"
          onPress={() => navigation.navigate('ReflectionReport')}
        />
      </View>

      <AppText variant="caption" tone="tertiary" style={{ marginTop: 22, lineHeight: 17 }}>
        Trends show your own logged reflections only. They are not medical advice. For diagnosis and
        treatment, consult a trained professional.
      </AppText>

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
    </ScreenContainer>
  );
}

function TimeBar({
  label,
  avg,
  pct,
  fill,
  last,
}: {
  label: string;
  avg: number;
  pct: number;
  fill: string;
  last?: boolean;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={{ marginBottom: last ? 0 : 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
        <AppText variant="bodySmall" style={{ fontSize: 13 }}>
          {label}
        </AppText>
        <AppText variant="bodySmall" style={{ fontSize: 13, fontWeight: '600' }}>
          {avg}
        </AppText>
      </View>
      <View style={{ height: 7, borderRadius: 4, backgroundColor: colors.surface.muted, overflow: 'hidden' }}>
        <View style={{ width: `${pct}%`, height: '100%', borderRadius: 4, backgroundColor: fill }} />
      </View>
    </View>
  );
}

function QuietLink({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <TactilePressable
      onPress={onPress}
      scaleDownTo={0.99}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 13,
        paddingHorizontal: 16,
        borderRadius: 16,
        backgroundColor: colors.surface.default,
      }}
    >
      <Ionicons name={icon} size={18} color={colors.primary.default} />
      <AppText variant="label" style={{ flex: 1 }}>
        {label}
      </AppText>
      <Ionicons name="chevron-forward" size={15} color={colors.text.tertiary} />
    </TactilePressable>
  );
}
