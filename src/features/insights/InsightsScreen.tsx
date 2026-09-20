import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { insightsRepository, WeeklyStats, Insight, HabitStats } from '../../database/repositories/insightsRepository';
import { Card, CardContent, PrimaryButton, StatPill, MoodStatPill, ProgressRing } from '../../components';
import { Ionicons } from '@expo/vector-icons';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';

type NavigationProp = NativeStackScreenProps<RootStackParamList, 'Insights'>['navigation'];

interface MoodTrendPoint {
  date: string;
  intensity: number;
  stress: number;
}

export function InsightsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [habitStats, setHabitStats] = useState<HabitStats[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [moodTrend, setMoodTrend] = useState<MoodTrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');
  const [totalMoods, setTotalMoods] = useState(0);

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
  }, []);

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

  useEffect(() => {
    const loadMoodCount = async () => {
      try {
        const { database } = require('../../database');
        const { Q } = require('@nozbe/watermelondb');
        const moodCollection = database?.get('mood_entries');
        if (!moodCollection) {
          setTotalMoods(0);
          return;
        }
        const now = Date.now();
        const weekAgo = now - 7 * 86400000;
        const safeNow = Number.isFinite(now) ? now : Date.now();
        const safeWeekAgo = Number.isFinite(weekAgo) ? weekAgo : 0;
        if (safeWeekAgo > safeNow) {
          setTotalMoods(0);
          return;
        }
        const entries = (await moodCollection.query(Q.where('created_at', Q.between(safeWeekAgo, safeNow))).fetch()) ?? [];
        setTotalMoods((entries ?? []).length ?? 0);
      } catch (error) {
        console.error('Failed to load mood count:', error);
        setTotalMoods(0);
      }
    };
    loadMoodCount();
  }, [timeRange]);

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

      const { Share } = require('react-native');
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
      'This will permanently delete ALL your data: mood entries, journals, habits, gratitudes, and calm sessions. This cannot be undone.',
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
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#5A955A" style={{ marginTop: 100 }} />
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No data yet. Start tracking to see insights!</Text>
      </View>
    );
  }

  const moodColors = [
    { mood: 'Happy', percentage: 0, color: '#5A955A' },
    { mood: 'Peaceful', percentage: 0, color: '#6B9BCD' },
    { mood: 'Grateful', percentage: 0, color: '#EB876D' },
    { mood: 'Stressed', percentage: 0, color: '#EB697F' },
    { mood: 'Anxious', percentage: 0, color: '#EF8799' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Insights</Text>
        <Text style={styles.subtitle}>Patterns from your journey</Text>
      </View>

      <View style={styles.timeRangePicker}>
        <Pressable
          onPress={() => setTimeRange('week')}
          style={[styles.timeRangeButton, timeRange === 'week' && styles.timeRangeButtonActive]}
        >
          <Text style={[styles.timeRangeButtonText, timeRange === 'week' && styles.timeRangeButtonTextActive]}>Week</Text>
        </Pressable>
        <Pressable
          onPress={() => setTimeRange('month')}
          style={[styles.timeRangeButton, timeRange === 'month' && styles.timeRangeButtonActive]}
        >
          <Text style={[styles.timeRangeButtonText, timeRange === 'month' && styles.timeRangeButtonTextActive]}>Month</Text>
        </Pressable>
      </View>

      <Card variant="elevated" style={styles.card}>
        <CardContent>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mood Distribution</Text>
            <Pressable onPress={() => navigation.navigate('MoodCalendar')} style={styles.link}>
              <Text style={styles.linkText}>View calendar</Text>
              <Ionicons name="chevron-forward" size={16} color="#5A955A" />
            </Pressable>
          </View>

          {(moodTrend ?? []).length > 0 && (
            <View style={styles.chartContainer}>
              <Text style={styles.chartLabel}>Mood & Stress Trend ({timeRange === 'week' ? '7' : '30'} days)</Text>
              <View style={styles.chart}>
                {(moodTrend ?? []).map((point, i) => (
                  <View key={point?.date ?? `point-${i}`} style={styles.chartBarWrapper}>
                    <View style={[
                      styles.chartBar,
                      { height: Math.max(((point?.intensity ?? 0) / 10) * 100, 4) },
                    ]} />
                    <View style={[
                      styles.chartBarStress,
                      { height: Math.max(((point?.stress ?? 0) / 10) * 100, 4) },
                    ]} />
                    <Text style={styles.chartBarLabel}>{point?.date ?? ''}</Text>
                  </View>
                ))}
                <View style={styles.chartLegend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#5A955A' }]} />
                    <Text style={styles.legendText}>Mood</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#EB697F' }]} />
                    <Text style={styles.legendText}>Stress</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          <View style={styles.statsRow}>
            <StatPill
              label="Avg Mood"
              value={`${stats?.avgMood ?? 0}/10`}
              trend={(stats?.avgMood ?? 0) >= 6 ? 'up' : 'neutral'}
              accentColor="#5A955A"
              icon={<Ionicons name="happy" size={16} color="#5A955A" />}
            />
            <StatPill
              label="Journaling"
              value={`${stats?.journalCount ?? 0}/7 days`}
              trend={(stats?.journalCount ?? 0) >= 3 ? 'up' : 'neutral'}
              accentColor="#877FC5"
              icon={<Ionicons name="book" size={16} color="#877FC5" />}
            />
            <StatPill
              label="Breathing"
              value={`${stats?.breathingMinutes ?? 0} min`}
              trend={(stats?.breathingMinutes ?? 0) > 10 ? 'up' : 'neutral'}
              accentColor="#6B9BCD"
              icon={<Ionicons name="flower" size={16} color="#6B9BCD" />}
            />
          </View>
        </CardContent>
      </Card>

      <Card variant="elevated" style={styles.card}>
        <CardContent>
          <Text style={styles.sectionTitle}>Habit Consistency</Text>
          {(habitStats ?? []).length === 0 ? (
            <Text style={styles.emptyHabits}>No habits yet. Create one to track consistency.</Text>
          ) : (
            <View style={styles.habitList}>
              {(habitStats ?? []).slice(0, 5).map((h) => {
                const completed = h?.completedThisWeek ?? 0;
                const total = h?.totalThisWeek ?? 0;
                const rate = total > 0 ? completed / total : 0;
                return (
                <StatPill
                  key={h?.id ?? Math.random().toString()}
                  label={h?.name ?? 'Habit'}
                  value={`${completed}/${total}`}
                  trend={rate >= 0.7 ? 'up' : rate >= 0.4 ? 'neutral' : 'down'}
                  accentColor={h?.color ?? '#5A955A'}
                  icon={<Ionicons name="checkmark-circle" size={16} color={h?.color ?? '#5A955A'} />}
                />
                );
              })}
            </View>
          )}
        </CardContent>
      </Card>

      <Card variant="outlined" style={styles.card}>
        <CardContent>
          <Text style={styles.sectionTitle}>Your Insights</Text>
          {(insights ?? []).length === 0 ? (
            <Text style={styles.emptyInsights}>Keep tracking to unlock personalized insights.</Text>
          ) : (
            <View style={styles.insightsList}>
              {(insights ?? []).map((insight) => (
                <View key={insight?.id ?? Math.random().toString()} style={[
                  styles.insightCard,
                  insight?.type === 'positive' && styles.insightPositive,
                  insight?.type === 'action' && styles.insightAction,
                ]}>
                  <View style={styles.insightIcon}>
                    <Ionicons
                      name={
                        insight?.type === 'positive' ? 'checkmark-circle' :
                        insight?.type === 'action' ? 'alert-circle' : 'information-circle'
                      }
                      size={20}
                      color={
                        insight?.type === 'positive' ? '#5A955A' :
                        insight?.type === 'action' ? '#EB876D' : '#6B9BCD'
                      }
                    />
                  </View>
                  <Text style={styles.insightText}>{insight?.text ?? ''}</Text>
                </View>
              ))}
            </View>
          )}
        </CardContent>
      </Card>

      <Card variant="elevated" style={styles.card}>
        <CardContent>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionButtons}>
            <PrimaryButton
              title="Mood Calendar"
              variant="primary"
              size="md"
              onPress={() => navigation.navigate('MoodCalendar')}
              className="flex-1"
              fullWidth
              leftIcon={<Text style={{ fontSize: 18 }}>📅</Text>}
            />
            <PrimaryButton
              title="Export Data"
              variant="outline"
              size="md"
              onPress={handleExport}
              className="flex-1"
              fullWidth
              leftIcon={<Text style={{ fontSize: 18 }}>📊</Text>}
            />
          </View>
          <PrimaryButton
            title="Delete All Data"
            variant="ghost"
            size="sm"
            onPress={handleDeleteAll}
            style={styles.dangerButton}
            fullWidth={false}
          />
        </CardContent>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFBF7' },
  content: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 100, gap: 16 },
  header: { marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '700', color: '#1E232E' },
  subtitle: { fontSize: 15, color: '#34415A', marginTop: 4 },
  timeRangePicker: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  timeRangeButton: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E4DEBC', alignItems: 'center' },
  timeRangeButtonActive: { backgroundColor: '#5A955A', borderColor: '#5A955A' },
  timeRangeButtonText: { fontSize: 14, fontWeight: '600', color: '#1E232E' },
  timeRangeButtonTextActive: { color: 'white' },
  card: { marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '600', color: '#1E232E' },
  link: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  linkText: { fontSize: 14, color: '#5A955A' },
  chartContainer: { gap: 8, marginBottom: 16 },
  chartLabel: { fontSize: 13, fontWeight: '500', color: '#34415A', marginBottom: 8 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 120, gap: 4, paddingBottom: 20 },
  chartBarWrapper: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  chartBar: { width: '100%', backgroundColor: '#5A955A', borderRadius: 2, minHeight: 4 },
  chartBarStress: { width: '100%', backgroundColor: '#EB697F', borderRadius: 2, minHeight: 4, marginTop: -2 },
  chartBarLabel: { fontSize: 9, color: '#425474', marginTop: 4 },
  chartLegend: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: '#425474' },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  habitList: { gap: 10 },
  emptyHabits: { textAlign: 'center', color: '#425474', paddingVertical: 16 },
  insightsList: { gap: 10 },
  insightCard: { flexDirection: 'row', gap: 10, padding: 12, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E4DEBC' },
  insightPositive: { borderColor: '#5A955A', backgroundColor: 'rgba(90, 149, 90, 0.1)' },
  insightAction: { borderColor: '#EB876D', backgroundColor: 'rgba(235, 135, 109, 0.1)' },
  insightIcon: { marginTop: 2 },
  insightText: { flex: 1, fontSize: 14, color: '#1E232E', lineHeight: 20 },
  emptyInsights: { textAlign: 'center', color: '#425474', paddingVertical: 16 },
  actionButtons: { flexDirection: 'row', gap: 10, marginTop: 12 },
  dangerButton: { marginTop: 12, alignSelf: 'center' },
  emptyText: { textAlign: 'center', color: '#425474', marginTop: 100 },
});