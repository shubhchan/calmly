import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, Alert, Share } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { insightsRepository, WeeklyStats, Insight, HabitStats } from '../../database/repositories/insightsRepository';
import { Card, CardContent, PrimaryButton, AppIcon } from '../../components';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useThemeColors } from '../../theme/ThemeContext';

type NavigationProp = NativeStackScreenProps<RootStackParamList, 'Insights'>['navigation'];

interface MoodTrendPoint {
  date: string;
  intensity: number;
  stress: number;
}

export function InsightsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const colors = useThemeColors();
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [habitStats, setHabitStats] = useState<HabitStats[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [moodTrend, setMoodTrend] = useState<MoodTrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [s, h, i, m] = await Promise.all([
        insightsRepository.getWeeklyStats(),
        insightsRepository.getHabitStats(),
        insightsRepository.generateInsights(),
        loadMoodTrend(),
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
      setLoading(false);
    }
  }, [timeRange]);

  const loadMoodTrend = async (): Promise<MoodTrendPoint[]> => {
    try {
      const { database } = require('../../database');
      const { Q } = require('@nozbe/watermelondb');

      const moodCollection = database?.get('mood_entries');
      if (!moodCollection) return [];
      const now = Date.now();
      const daysBack = timeRange === 'week' ? 7 : 30;
      const safeDaysBack = Number.isFinite(daysBack) && daysBack > 0 ? daysBack : 7;
      const start = now - safeDaysBack * 86400000;
      const safeStart = Number.isFinite(start) ? start : 0;
      const safeNow = Number.isFinite(now) ? now : Date.now();
      if (safeStart > safeNow) return [];

      const entries = (await moodCollection
        .query(Q.where('created_at', Q.between(safeStart, safeNow)), Q.sortBy('created_at', Q.asc))
        .fetch()) ?? [];

      const byDate: Record<string, MoodTrendPoint> = {};
      (entries ?? []).forEach((e: any) => {
        const rawDate = e?.createdAt ? new Date(e.createdAt) : null;
        if (!rawDate || Number.isNaN(rawDate.getTime())) return;
        const date = format(rawDate, 'MM/dd');
        if (!date) return;
        if (!byDate[date]) {
          byDate[date] = { date, intensity: 0, stress: 0 };
        }
        const intensity = typeof e?.intensity === 'number' && Number.isFinite(e.intensity) ? e.intensity : 0;
        const stress = typeof e?.stress === 'number' && Number.isFinite(e.stress) ? e.stress : 0;
        byDate[date].intensity = Math.max(byDate[date]?.intensity ?? 0, intensity);
        byDate[date].stress = Math.max(byDate[date]?.stress ?? 0, stress);
      });

      return Object.values(byDate ?? {}).sort((a, b) => (a?.date ?? '').localeCompare(b?.date ?? ''));
    } catch (error) {
      console.error('Failed to load mood trend:', error);
      return [];
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData, timeRange]);

  const handleExport = async () => {
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
    } catch (error) {
      console.error('Export failed:', error);
      Alert.alert('Export Failed', 'Could not export data. Please try again.');
    }
  };

  const handleDeleteAll = () => {
    Alert.alert(
      'Delete All Data?',
      'This will permanently delete all your mood entries, journals, habits, gratitudes, and calm sessions. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
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
              Alert.alert('Done', 'All data has been deleted.');
              loadData();
            } catch (error) {
              console.error('Delete failed:', error);
              Alert.alert('Error', 'Failed to delete data.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.bgPrimary }]}>
        <ActivityIndicator size="large" color={colors.accentPrimary} />
      </View>
    );
  }

  const activeHabitsCount = (habitStats ?? []).filter(h => (h.completedThisWeek || 0) > 0).length;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bgPrimary }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Insights</Text>
          <View style={[styles.headerBadge, { backgroundColor: colors.accentBg, borderColor: colors.accentBorder }]}>
            <AppIcon name="l-chart" size={18} loop />
            <Text style={[styles.headerBadgeText, { color: colors.accentPrimary }]}>Mindful Data</Text>
          </View>
        </View>
        <Text style={[styles.subtitle, { color: colors.textTertiary }]}>
          Understand your personal emotional rhythms and consistency
        </Text>
      </View>

      {/* Segmented Time Range Picker */}
      <View style={[styles.segmentedControl, { backgroundColor: colors.bgCard, borderColor: colors.borderLight }]}>
        <Pressable
          onPress={() => setTimeRange('week')}
          style={[
            styles.segmentButton,
            timeRange === 'week' && [styles.segmentButtonActive, { backgroundColor: colors.accentPrimary }],
          ]}
        >
          <Text
            style={[
              styles.segmentText,
              { color: colors.textSecondary },
              timeRange === 'week' && styles.segmentTextActive,
            ]}
          >
            Past 7 Days
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setTimeRange('month')}
          style={[
            styles.segmentButton,
            timeRange === 'month' && [styles.segmentButtonActive, { backgroundColor: colors.accentPrimary }],
          ]}
        >
          <Text
            style={[
              styles.segmentText,
              { color: colors.textSecondary },
              timeRange === 'month' && styles.segmentTextActive,
            ]}
          >
            Past 30 Days
          </Text>
        </Pressable>
      </View>

      {/* 2x2 Metric Grid (Symmetrical 2-row layout) */}
      <View style={{ gap: 12 }}>
        <View style={styles.metricRow}>
          {/* Metric 1: Avg Mood */}
          <Card variant="elevated" style={styles.metricCard}>
            <CardContent style={styles.metricCardContent}>
              <View style={styles.metricTopRow}>
                <View style={[styles.metricIconOrb, { backgroundColor: colors.accentBg }]}>
                  <AppIcon name="l-heart" size={26} loop />
                </View>
                <View style={[styles.trendBadge, { backgroundColor: ((stats?.avgMood ?? 0) >= 6 ? colors.success : colors.textTertiary) + '15' }]}>
                  <Text style={[styles.trendBadgeText, { color: (stats?.avgMood ?? 0) >= 6 ? colors.success : colors.textTertiary }]}>
                    {(stats?.avgMood ?? 0) >= 6 ? '↑ Good' : '→ Calm'}
                  </Text>
                </View>
              </View>
              <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
                {stats?.avgMood ? `${stats.avgMood}/10` : '—'}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.textTertiary }]}>
                Average Mood
              </Text>
            </CardContent>
          </Card>

          {/* Metric 2: Mindful Minutes */}
          <Card variant="elevated" style={styles.metricCard}>
            <CardContent style={styles.metricCardContent}>
              <View style={styles.metricTopRow}>
                <View style={[styles.metricIconOrb, { backgroundColor: (colors.accentSky || '#6B9BCD') + '15' }]}>
                  <AppIcon name="l-expand" size={26} loop />
                </View>
                <View style={[styles.trendBadge, { backgroundColor: colors.accentBg }]}>
                  <Text style={[styles.trendBadgeText, { color: colors.accentPrimary }]}>
                    Somatic
                  </Text>
                </View>
              </View>
              <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
                {stats?.breathingMinutes ? `${stats.breathingMinutes}m` : '0m'}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.textTertiary }]}>
                Mindful Breathwork
              </Text>
            </CardContent>
          </Card>
        </View>

        <View style={styles.metricRow}>
          {/* Metric 3: Journal Entries */}
          <Card variant="elevated" style={styles.metricCard}>
            <CardContent style={styles.metricCardContent}>
              <View style={styles.metricTopRow}>
                <View style={[styles.metricIconOrb, { backgroundColor: (colors.accentLavender || '#877FC5') + '15' }]}>
                  <AppIcon name="l-book" size={26} loop />
                </View>
                <View style={[styles.trendBadge, { backgroundColor: (colors.accentLavender || '#877FC5') + '15' }]}>
                  <Text style={[styles.trendBadgeText, { color: colors.accentLavender || '#877FC5' }]}>
                    {(stats?.journalCount ?? 0) >= 3 ? 'Active' : 'Light'}
                  </Text>
                </View>
              </View>
              <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
                {stats?.journalCount ? `${stats.journalCount} logs` : '0 logs'}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.textTertiary }]}>
                Journal Reflections
              </Text>
            </CardContent>
          </Card>

          {/* Metric 4: Active Habits */}
          <Card variant="elevated" style={styles.metricCard}>
            <CardContent style={styles.metricCardContent}>
              <View style={styles.metricTopRow}>
                <View style={[styles.metricIconOrb, { backgroundColor: (colors.accentPeach || '#EB876D') + '15' }]}>
                  <AppIcon name="l-star" size={26} loop />
                </View>
                <View style={[styles.trendBadge, { backgroundColor: (colors.accentPeach || '#EB876D') + '15' }]}>
                  <Text style={[styles.trendBadgeText, { color: colors.accentPeach || '#EB876D' }]}>
                    Streak
                  </Text>
                </View>
              </View>
              <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
                {activeHabitsCount > 0 ? `${activeHabitsCount} active` : '0 active'}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.textTertiary }]}>
                Habits Maintained
              </Text>
            </CardContent>
          </Card>
        </View>
      </View>

      {/* Mood & Stress Trend Chart Card */}
      <Card variant="elevated" style={styles.sectionCard}>
        <CardContent style={styles.sectionCardContent}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Mood & Stress Rhythm</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textTertiary }]}>
                {timeRange === 'week' ? 'Daily emotional progression' : 'Monthly overview'}
              </Text>
            </View>
            <Pressable
              onPress={() => navigation.navigate('MoodCalendar')}
              style={[styles.calendarLink, { backgroundColor: colors.accentBg }]}
            >
              <Ionicons name="calendar-outline" size={14} color={colors.accentPrimary} />
              <Text style={[styles.calendarLinkText, { color: colors.accentPrimary }]}>Calendar</Text>
            </Pressable>
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
                            backgroundColor: colors.accentPrimary,
                          },
                        ]}
                      />
                      <View
                        style={[
                          styles.barSecondary,
                          {
                            height: Math.max(((point?.stress ?? 0) / 10) * 110, 8),
                            backgroundColor: colors.accentRose || '#EB697F',
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.chartDayLabel, { color: colors.textTertiary }]}>
                      {point?.date ?? ''}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.chartLegend}>
                <View style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: colors.accentPrimary }]} />
                  <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>Mood Intensity</Text>
                </View>
                <View style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: colors.accentRose || '#EB697F' }]} />
                  <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>Stress Level</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.emptyChartBox}>
              <AppIcon name="l-chart" size={38} loop />
              <Text style={[styles.emptyChartTitle, { color: colors.textPrimary }]}>
                No data points yet
              </Text>
              <Text style={[styles.emptyChartSub, { color: colors.textTertiary }]}>
                Check in your mood each day to see your rhythm chart appear here.
              </Text>
            </View>
          )}
        </CardContent>
      </Card>

      {/* Habit Consistency Progress Card */}
      <Card variant="elevated" style={styles.sectionCard}>
        <CardContent style={styles.sectionCardContent}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 4 }]}>
            Habit Consistency
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textTertiary, marginBottom: 14 }]}>
            Completion rates over the past 7 days
          </Text>

          {(habitStats ?? []).length === 0 ? (
            <View style={styles.emptyInlineBox}>
              <AppIcon name="l-walk" size={32} loop />
              <Text style={[styles.emptyInlineText, { color: colors.textTertiary }]}>
                No habits tracked yet this week.
              </Text>
            </View>
          ) : (
            <View style={styles.habitList}>
              {(habitStats ?? []).slice(0, 5).map((h) => {
                const completed = h?.completedThisWeek ?? 0;
                const total = h?.totalThisWeek ?? 0;
                const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
                const habitColor = h?.color || colors.accentPrimary;

                return (
                  <View
                    key={h?.id ?? Math.random().toString()}
                    style={[styles.habitRowCard, { backgroundColor: colors.bgSecondary ?? '#F4EFE6', borderColor: colors.borderLight }]}
                  >
                    <View style={styles.habitRowHeader}>
                      <View style={styles.habitTitleRow}>
                        <View style={[styles.habitColorDot, { backgroundColor: habitColor }]} />
                        <Text style={[styles.habitName, { color: colors.textPrimary }]} numberOfLines={1}>
                          {h?.name ?? 'Habit'}
                        </Text>
                      </View>
                      <View style={[styles.habitRateBadge, { backgroundColor: habitColor + '18' }]}>
                        <Text style={[styles.habitRateText, { color: habitColor }]}>
                          {completed}/{total} ({percentage}%)
                        </Text>
                      </View>
                    </View>

                    <View style={[styles.progressBarTrack, { backgroundColor: colors.borderLight }]}>
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            width: `${Math.min(percentage, 100)}%`,
                            backgroundColor: habitColor,
                          },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </CardContent>
      </Card>

      {/* Mindful Reflections & Insights Card */}
      <Card variant="outlined" style={styles.sectionCard}>
        <CardContent style={styles.sectionCardContent}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 4 }]}>
            Mindful Reflections
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textTertiary, marginBottom: 14 }]}>
            Observations tailored to your patterns
          </Text>

          {(insights ?? []).length === 0 ? (
            <View style={styles.emptyInlineBox}>
              <AppIcon name="l-star" size={32} loop />
              <Text style={[styles.emptyInlineText, { color: colors.textTertiary }]}>
                Keep tracking daily to unlock mindful personal reflections.
              </Text>
            </View>
          ) : (
            <View style={styles.insightsList}>
              {(insights ?? []).map((insight) => (
                <View
                  key={insight?.id ?? Math.random().toString()}
                  style={[
                    styles.insightCard,
                    {
                      backgroundColor: colors.bgSecondary ?? '#F4EFE6',
                      borderColor: colors.borderLight,
                    },
                    insight?.type === 'positive' && {
                      borderColor: colors.accentPrimary + '50',
                      backgroundColor: colors.accentPrimary + '0E',
                    },
                    insight?.type === 'action' && {
                      borderColor: (colors.accentPeach || '#EB876D') + '50',
                      backgroundColor: (colors.accentPeach || '#EB876D') + '0E',
                    },
                  ]}
                >
                  <View style={styles.insightIconOrb}>
                    <AppIcon
                      name={insight?.type === 'positive' ? 'l-heart' : insight?.type === 'action' ? 'l-star' : 'l-calm'}
                      size={24}
                      loop
                    />
                  </View>
                  <Text style={[styles.insightText, { color: colors.textPrimary }]}>
                    {insight?.text ?? ''}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </CardContent>
      </Card>

      {/* Export & Actions */}
      <Card variant="elevated" style={styles.sectionCard}>
        <CardContent style={styles.sectionCardContent}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 12 }]}>
            Data Management
          </Text>
          <View style={styles.actionButtons}>
            <View style={{ flex: 1 }}>
              <PrimaryButton
                title="Mood Calendar"
                variant="primary"
                size="md"
                onPress={() => navigation.navigate('MoodCalendar')}
                fullWidth
                leftIcon={<Ionicons name="calendar-outline" size={18} color="#FFFFFF" />}
              />
            </View>
            <View style={{ flex: 1 }}>
              <PrimaryButton
                title="Export JSON"
                variant="outline"
                size="md"
                onPress={handleExport}
                fullWidth
                leftIcon={<Ionicons name="download-outline" size={18} color={colors.accentPrimary} />}
              />
            </View>
          </View>
          <Pressable onPress={handleDeleteAll} style={styles.deleteLink}>
            <Ionicons name="trash-outline" size={15} color={colors.accentRose || '#EB697F'} />
            <Text style={[styles.deleteLinkText, { color: colors.accentRose || '#EB697F' }]}>
              Clear all app records
            </Text>
          </Pressable>
        </CardContent>
      </Card>
    </ScrollView>
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
  header: {
    marginBottom: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1,
  },
  headerBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    padding: 4,
    gap: 6,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentButtonActive: {
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
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
  trendBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  trendBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  metricLabel: {
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
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
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
    fontSize: 15,
    fontWeight: '700',
  },
  emptyChartSub: {
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
    fontSize: 13,
  },
  habitList: {
    gap: 10,
  },
  habitRowCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  habitRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  habitTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  habitColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  habitName: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  habitRateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  habitRateText: {
    fontSize: 11,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  insightsList: {
    gap: 10,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  insightIconOrb: {
    marginTop: 2,
  },
  insightText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
    paddingVertical: 6,
  },
  deleteLinkText: {
    fontSize: 12,
    fontWeight: '600',
  },
});