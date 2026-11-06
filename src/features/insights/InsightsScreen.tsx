import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Share } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { differenceInCalendarDays } from 'date-fns';
import { RootStackParamList } from '../../types/navigation';
import { insightsRepository, WeeklyStats, Insight, HabitStats } from '../../database/repositories/insightsRepository';
import { AppText, Card, CardContent, ProgressBar, ListItem, Divider, ConfirmDialog, InlineAlert, AppIcon, IconButton, PageHeader, Chip, DateRangePicker, formatDateRange, MoodLandscapeIllustration, HabitPlantingIllustration, MoodAuraIllustration, TactilePressable, type DateRange } from '../../components';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useAppTheme } from '../../theme/ThemeContext';
import { hapticFeedback } from '../../utils/haptics';
import { fontFamilies } from '../../theme/typography';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { PopIn } from '../../components/interactive/PopIn';
import { DetailSkeleton } from '../../components/interactive/LoadingState';
import { resolveTint } from '../../theme/tints';
import { borderWidths, radius, shape, spacing } from '../../theme/tokens';
import { moodRepository } from '../../database/repositories/moodRepository';
import { journalRepository } from '../../database/repositories/journalRepository';

type NavigationProp = NativeStackScreenProps<RootStackParamList, 'Insights'>['navigation'];

interface MoodTrendPoint {
  date: string;
  intensity: number;
  stress: number;
}

export function InsightsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDark } = useAppTheme();
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [habitStats, setHabitStats] = useState<HabitStats[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [moodTrend, setMoodTrend] = useState<MoodTrendPoint[]>([]);
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
    // Read the repository rather than WatermelonDB directly so fallback data
    // (including restored entries) is reflected consistently in the chart.
    const entries = await moodRepository.getByDateRange(range.start, range.end);
    const byDate = new Map<string, { sumIntensity: number; sumStress: number; count: number }>();
    for (const e of entries || []) {
      const date = format(new Date(e.createdAt), 'yyyy-MM-dd');
      const value = byDate.get(date) || { sumIntensity: 0, sumStress: 0, count: 0 };
      value.sumIntensity += Number(e.intensity) || 0;
      value.sumStress += Number(e.stress) || 0;
      value.count += 1;
      byDate.set(date, value);
    }
    return [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, v]) => ({ date: format(new Date(`${date}T12:00:00`), 'MM/dd'), intensity: v.sumIntensity / v.count, stress: v.sumStress / v.count }));
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
      <ScreenContainer contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16 }}>
        <DetailSkeleton />
      </ScreenContainer>
    );
  }

  const lilacTint = resolveTint(!!isDark, 'lilac');
  const skyTint = resolveTint(!!isDark, 'sky');
  const creamTint = resolveTint(!!isDark, 'cream');
  const coralTint = resolveTint(!!isDark, 'coral');
  const navyTint = resolveTint(!!isDark, 'navy');
  const mintTint = resolveTint(!!isDark, 'mint');

  const activeHabitsCount = (habitStats ?? []).filter(h => (h.completedThisWeek || 0) > 0).length;

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      {/* Header */}
      <PageHeader
        title="Insights"
        subtitle="Understand your personal emotional rhythms and consistency"
        style={{ marginBottom: 2 }}
      />

      <TactilePressable
        onPress={() => navigation.navigate('ReflectionReport')}
        accessibilityRole="button"
        style={[
          styles.mapCard,
          { backgroundColor: colors.primary.subtle, borderColor: colors.primary.subtleBorder },
        ]}
      >
        <View style={[styles.mapIcon, { backgroundColor: colors.surface.default }]}>
          <AppIcon name="i-git-network-outline" size={22} color={colors.primary.default} />
        </View>
        <View style={styles.mapCopy}>
          <Text style={[styles.mapTitle, { color: colors.text.primary }]}>Your reflection map</Text>
          <Text style={[styles.mapBody, { color: colors.text.secondary }]}>
            Real saved moods, daily notes and weekly, monthly or yearly patterns
          </Text>
        </View>
        <AppIcon name="i-chevron-forward" size={18} color={colors.primary.default} />
      </TactilePressable>

      {/* Range pill selector */}
      <View style={styles.rangeRow}>
        {(['today', 'week', 'month', 'year'] as const).map((value) => (
          <Chip
            key={value}
            label={value === 'today' ? 'Today' : value === 'week' ? 'Week' : value === 'month' ? 'Month' : 'Year'}
            selected={timeRange === value}
            onPress={() => setTimeRange(value)}
            style={styles.rangeChip}
          />
        ))}
        <IconButton
          icon="i-calendar"
          accessibilityLabel="Choose a custom date range"
          variant={timeRange === 'custom' ? 'solid' : 'outline'}
          onPress={() => setRangePickerVisible(true)}
        />
      </View>
      {timeRange === 'custom' && customRange ? (
        <AppText variant="caption" tone="tertiary" style={styles.rangeCaption}>
          {formatDateRange(customRange)}
        </AppText>
      ) : null}

      {/* 2x2 Metric Grid (Symmetrical 2-row layout) */}
      <PopIn index={0}>
      <View style={{ gap: 12 }}>
        <View style={styles.metricRow}>
          {/* Metric 1: Avg Mood — lilac pop card */}
          <Card variant="elevated" tone="lilac" style={styles.metricCard}>
            <CardContent style={styles.metricCardContent}>
              <View style={styles.metricTopRow}>
                <View style={[styles.metricIconOrb, { backgroundColor: lilacTint.plate }]}>
                  <AppIcon name="l-heart" size={26} loop />
                </View>
              </View>
              <Text style={[styles.metricValue, { color: lilacTint.text }]}>
                {stats?.avgMood ? `${stats.avgMood}/10` : '—'}
              </Text>
              <Text style={[styles.metricLabel, { color: lilacTint.muted }]}>
                Emotion Intensity
              </Text>
            </CardContent>
          </Card>

          {/* Metric 2: Mindful Minutes — sky pop card */}
          <Card variant="elevated" tone="sky" style={styles.metricCard}>
            <CardContent style={styles.metricCardContent}>
              <View style={styles.metricTopRow}>
                <View style={[styles.metricIconOrb, { backgroundColor: skyTint.plate }]}>
                  <AppIcon name="l-expand" size={26} loop />
                </View>
              </View>
              <Text style={[styles.metricValue, { color: skyTint.text }]}>
                {stats?.breathingMinutes ? `${stats.breathingMinutes}m` : '0m'}
              </Text>
              <Text style={[styles.metricLabel, { color: skyTint.muted }]}>
                Mindful Breathwork
              </Text>
            </CardContent>
          </Card>
        </View>

        <View style={styles.metricRow}>
          {/* Metric 3: Journal Entries — cream pop card */}
          <Card variant="elevated" tone="cream" style={styles.metricCard}>
            <CardContent style={styles.metricCardContent}>
              <View style={styles.metricTopRow}>
                <View style={[styles.metricIconOrb, { backgroundColor: creamTint.plate }]}>
                  <AppIcon name="l-book" size={26} loop />
                </View>
              </View>
              <Text style={[styles.metricValue, { color: creamTint.text }]}>
                {stats?.journalCount ? `${stats.journalCount} logs` : '0 logs'}
              </Text>
              <Text style={[styles.metricLabel, { color: creamTint.muted }]}>
                Journal Reflections
              </Text>
            </CardContent>
          </Card>

          {/* Metric 4: Active Habits — coral pop card */}
          <Card variant="elevated" tone="coral" style={styles.metricCard}>
            <CardContent style={styles.metricCardContent}>
              <View style={styles.metricTopRow}>
                <View style={[styles.metricIconOrb, { backgroundColor: coralTint.plate }]}>
                  <AppIcon name="l-star" size={26} loop />
                </View>
              </View>
              <Text style={[styles.metricValue, { color: coralTint.text }]}>
                {activeHabitsCount > 0 ? `${activeHabitsCount} active` : '0 active'}
              </Text>
              <Text style={[styles.metricLabel, { color: coralTint.muted }]}>
                Habits Maintained
              </Text>
            </CardContent>
          </Card>
        </View>
      </View>
      </PopIn>

      {/* Mood & Stress Trend Chart Card — navy pop card */}
      <PopIn index={1}>
      <Card variant="elevated" tone="navy" style={styles.sectionCard}>
        <CardContent style={styles.sectionCardContent}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={[styles.sectionTitle, { color: navyTint.text }]}>Mood & Stress Rhythm</Text>
              <Text style={[styles.sectionSubtitle, { color: navyTint.muted }]}>
                {timeRange === 'today' ? "Today's snapshot" : timeRange === 'week' ? 'Daily emotional progression' : timeRange === 'month' ? 'Monthly overview' : timeRange === 'year' ? 'Yearly patterns' : 'Custom date range'}
              </Text>
            </View>
            <TactilePressable
              onPress={() => navigation.navigate('MoodCalendar')}
              scaleDownTo={0.94}
              style={[styles.calendarLink, { backgroundColor: navyTint.plate }]}
              hitSlop={8}
            >
              <Ionicons name="calendar-outline" size={14} color={navyTint.accent} />
              <Text style={[styles.calendarLinkText, { color: navyTint.accent }]}>Calendar</Text>
            </TactilePressable>
          </View>

          {(moodTrend ?? []).length > 0 ? (
            <View style={styles.chartWrapper}>
              <View style={styles.chartContainer}>
                {(moodTrend ?? []).map((point, i) => (
                  <View key={point?.date ?? `point-${i}`} style={styles.chartCol}>
                    <View style={styles.barsContainer}>
                      <View
                        style={[
                          styles.barPrimary,
                          {
                            height: Math.max(((point?.intensity ?? 0) / 10) * 110, 8),
                            backgroundColor: colors.primary.default,
                          },
                        ]}
                      />
                      <View
                        style={[
                          styles.barSecondary,
                          {
                            height: Math.max(((point?.stress ?? 0) / 10) * 110, 8),
                            backgroundColor: colors.accents.rose,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.chartDayLabel, { color: navyTint.muted }]}>
                      {point?.date ?? ''}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.chartLegend}>
                <View style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: colors.primary.default }]} />
                  <Text style={[styles.legendLabel, { color: navyTint.muted }]}>Mood Intensity</Text>
                </View>
                <View style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: colors.accents.rose }]} />
                  <Text style={[styles.legendLabel, { color: navyTint.muted }]}>Stress Level</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.emptyChartBox}>
              <MoodLandscapeIllustration width={190} height={125} style={{ marginBottom: 6 }} />
              <Text style={[styles.emptyChartTitle, { color: navyTint.text }]}>
                No data points yet
              </Text>
              <Text style={[styles.emptyChartSub, { color: navyTint.muted }]}>
                Check in your mood each day to see your rhythm chart appear here.
              </Text>
            </View>
          )}
        </CardContent>
      </Card>
      </PopIn>

      {/* Habit Consistency Progress Card — mint pop card */}
      <PopIn index={2}>
      <Card variant="elevated" tone="mint" style={styles.sectionCard}>
        <CardContent style={styles.sectionCardContent}>
          <Text style={[styles.sectionTitle, { color: mintTint.text, marginBottom: 4 }]}>
            Habit Consistency
          </Text>
          <Text style={[styles.sectionSubtitle, { color: mintTint.muted, marginBottom: 14 }]}>
            Completion rates
          </Text>

          {(habitStats ?? []).length === 0 ? (
            <View style={styles.emptyInlineBox}>
              <HabitPlantingIllustration width={120} height={100} style={{ marginBottom: 4 }} />
              <Text style={[styles.emptyInlineText, { color: mintTint.muted }]}>
                No habits tracked in this range.
              </Text>
            </View>
          ) : (
            <View>
              {(habitStats ?? []).slice(0, 5).map((h, index, habits) => {
                const completed = h?.completedThisWeek ?? 0;
                const total = h?.totalThisWeek ?? 0;
                const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
                const habitColor = h?.color || colors.primary.default;

                return (
                  <View key={h?.id ?? 'ph-' + index}>
                    <ListItem
                      title={h?.name ?? 'Habit'}
                      left={<View style={[styles.habitColorDot, { backgroundColor: habitColor }]} />}
                      right={
                        <Text style={{ fontSize: 13, fontWeight: '700', color: mintTint.text }}>
                          {`${completed}/${total} · ${percentage}%`}
                        </Text>
                      }
                      density="compact"
                    />
                    <ProgressBar
                      value={Math.min(percentage, 100) / 100}
                      color={habitColor}
                      trackColor={mintTint.border}
                      style={{ marginBottom: 8 }}
                    />
                    {index < habits.length - 1 ? <Divider /> : null}
                  </View>
                );
              })}
            </View>
          )}
        </CardContent>
      </Card>
      </PopIn>

      {/* Mindful Reflections — flat rows, no nested cards */}
      <PopIn index={3}>
      <Card variant="elevated" tone="lilac" style={styles.sectionCard}>
        <CardContent style={styles.sectionCardContent}>
          <Text style={[styles.sectionTitle, { color: lilacTint.text, marginBottom: 4 }]}>
            Mindful Reflections
          </Text>
          <Text style={[styles.sectionSubtitle, { color: lilacTint.muted, marginBottom: 14 }]}>
            Observations tailored to your patterns
          </Text>

          {(insights ?? []).length === 0 ? (
            <View style={styles.emptyInlineBox}>
              <MoodAuraIllustration width={120} height={100} style={{ marginBottom: 4 }} />
              <Text style={[styles.emptyInlineText, { color: lilacTint.muted }]}>
                Keep tracking daily to unlock mindful personal reflections.
              </Text>
            </View>
          ) : (
            <View>
              {(insights ?? []).map((insight, index) => {
                const isLast = index === (insights ?? []).length - 1;
                const iconColor =
                  insight?.type === 'positive'
                    ? colors.primary.default
                    : insight?.type === 'action'
                      ? colors.accents.peach
                      : lilacTint.accent;

                return (
                  <View
                    key={insight?.id ?? 'ph-' + index}
                    style={[
                      styles.insightRow,
                      !isLast && {
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: lilacTint.border,
                      },
                    ]}
                  >
                    <AppIcon
                      name={insight?.type === 'positive' ? 'l-heart' : insight?.type === 'action' ? 'l-star' : 'l-calm'}
                      size={22}
                      color={iconColor}
                      animated={false}
                    />
                    <Text style={[styles.insightText, { color: lilacTint.text }]}>
                      {insight?.text ?? ''}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </CardContent>
      </Card>
      </PopIn>

      {/* Data Management — flat action rows, no nested cards */}
      <PopIn index={4}>
      <Card variant="elevated" tone="cream" style={styles.sectionCard}>
        <CardContent style={styles.sectionCardContent}>
          <Text style={[styles.sectionTitle, { color: creamTint.text, marginBottom: 4 }]}>
            Data Management
          </Text>
          <Text style={[styles.sectionSubtitle, { color: creamTint.muted, marginBottom: 14 }]}>
            Review, export, or clear the records saved on this device
          </Text>

          {status ? (
            <InlineAlert
              tone={status.tone}
              title={status.title}
              message={status.message}
              onDismiss={() => setStatus(null)}
              style={{ marginBottom: 12 }}
            />
          ) : null}

          <View>
            <ListItem
              title="Mood calendar"
              leftIconName="i-calendar"
              chevron
              onPress={() => navigation.navigate('MoodCalendar')}
            />
            <Divider spacingToken={1} />
            <ListItem
              title={exporting ? 'Preparing export…' : 'Export data as JSON'}
              leftIconName="i-download"
              right={
                exporting ? <ActivityIndicator size="small" color={creamTint.accent} /> : undefined
              }
              chevron={!exporting}
              disabled={exporting}
              onPress={handleExport}
            />
            <Divider spacingToken={1} />
            <ListItem
              title="Clear all app records"
              left={
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.status.error.subtle,
                  }}
                >
                  <AppIcon name="l-trash" size={20} color={colors.status.error.default} animated={false} />
                </View>
              }
              chevron
              onPress={handleDeleteAll}
            />
          </View>

          <Text style={[styles.disclaimer, { color: creamTint.muted }]}>
            Trends show your own logged reflections only. They are not medical advice. For diagnosis and treatment, consult a trained professional.
          </Text>
        </CardContent>
      </Card>
      </PopIn>

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 110,
    gap: 16,
  },
  mapCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[4],
    borderRadius: shape.card,
    borderWidth: borderWidths.thin,
  },
  mapIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapCopy: {
    flex: 1,
    gap: spacing[1],
  },
  mapTitle: {
    fontFamily: fontFamilies.sans.bold,
    fontSize: 16,
    fontWeight: '700',
  },
  mapBody: {
    fontFamily: fontFamilies.sans.regular,
    fontSize: 12.5,
    lineHeight: 18,
  },
  rangeRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  rangeChip: {
    flex: 1,
    paddingHorizontal: spacing[1],
  },
  rangeCaption: {
    marginTop: -spacing[2],
    textAlign: 'center',
  },
  metricRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    borderRadius: 20,
  },
  metricCardContent: {
    padding: 16,
    gap: 6,
  },
  metricTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  metricIconOrb: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontFamily: fontFamilies.sans.bold,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  metricLabel: {
    fontFamily: fontFamilies.sans.medium,
    fontSize: 12,
    fontWeight: '500',
  },
  sectionCard: {
    borderRadius: 22,
  },
  sectionCardContent: {
    padding: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: fontFamilies.serif.bold,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontFamily: fontFamilies.sans.regular,
    fontSize: 12,
    marginTop: 2,
  },
  calendarLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  calendarLinkText: {
    fontFamily: fontFamilies.sans.bold,
    fontSize: 12,
    fontWeight: '700',
  },
  chartWrapper: {
    gap: 16,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 140,
    gap: 8,
    paddingBottom: 24,
    paddingHorizontal: 4,
  },
  chartCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    width: '100%',
    justifyContent: 'center',
  },
  barPrimary: {
    flex: 1,
    maxWidth: 14,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    minHeight: 6,
  },
  barSecondary: {
    flex: 1,
    maxWidth: 14,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    minHeight: 6,
    opacity: 0.85,
  },
  chartDayLabel: {
    fontFamily: fontFamilies.sans.semiBold,
    fontSize: 10,
    fontWeight: '600',
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    paddingTop: 4,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontFamily: fontFamilies.sans.semiBold,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyChartBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyChartTitle: {
    fontFamily: fontFamilies.serif.bold,
    fontSize: 15,
    fontWeight: '700',
  },
  emptyChartSub: {
    fontFamily: fontFamilies.sans.regular,
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 18,
  },
  emptyInlineBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyInlineText: {
    fontFamily: fontFamilies.sans.regular,
    fontSize: 13,
  },
  habitColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 13,
  },
  insightText: {
    fontFamily: fontFamilies.sans.regular,
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },
  disclaimer: {
    fontFamily: fontFamilies.sans.regular,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 14,
  },
});