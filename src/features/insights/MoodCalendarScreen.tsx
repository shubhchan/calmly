import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { insightsRepository } from '../../database/repositories/insightsRepository';
import { MoodEntry } from '../../database/models';
import { Card, CardContent, AppIcon, moodIcon } from '../../components';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useThemeColors } from '../../theme/ThemeContext';

const MOOD_COLORS: Record<string, string> = {
  happy: '#5A955A',
  peaceful: '#6B9BCD',
  grateful: '#EB876D',
  stressed: '#EB697F',
  overwhelmed: '#EF8799',
  anxious: '#EF8799',
  sad: '#877FC5',
  angry: '#EB697F',
  exhausted: '#74AC74',
  excited: '#EB876D',
  content: '#5A955A',
  hopeful: '#6B9BCD',
};

type NavigationProp = NativeStackScreenProps<RootStackParamList, 'MoodCalendar'>['navigation'];

interface DayMoodData {
  mood: string;
  intensity: number;
  stress: number;
  energy: string;
  hasJournal: boolean;
  habitsCompleted: number;
  habitsTotal: number;
}

export function MoodCalendarScreen() {
  const navigation = useNavigation<NavigationProp>();
  const colors = useThemeColors();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [moodData, setMoodData] = useState<Record<number, DayMoodData>>({});
  const [loading, setLoading] = useState(true);

  const loadMonthData = useCallback(async () => {
    setLoading(true);
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
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    loadMonthData();
  }, [loadMonthData]);

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
    let todayStr = '';
    let thisDayStr = '';
    let isTodayDay = false;
    try {
      todayStr = format(new Date(), 'yyyy-MM-dd') ?? '';
      thisDayStr = format(new Date(year, month, day), 'yyyy-MM-dd') ?? '';
      isTodayDay = !!todayStr && todayStr === thisDayStr;
    } catch {
      isTodayDay = false;
    }

    const dayData = hasData ? (moodData ?? {})[day] ?? null : null;
    const moodKey = (dayData as any)?.mood ?? '';
    const moodColor = hasData ? MOOD_COLORS[moodKey] || colors.accentPrimary : colors.accentPrimary;
    const moodIconName = hasData ? moodIcon(moodKey) : moodIcon(null);

    return (
      <Pressable
        key={day}
        onPress={() => handleDayPress(day)}
        disabled={!hasData}
        style={[
          styles.dayCell,
          isSelected && { backgroundColor: colors.accentPrimary },
          isTodayDay && !isSelected && { borderWidth: 2, borderColor: colors.accentPrimary },
          !hasData && { opacity: 0.4 },
        ]}
      >
        <Text
          style={[
            styles.dayText,
            { color: colors.textPrimary },
            isSelected && { color: '#FFFFFF', fontWeight: '700' },
            isTodayDay && !isSelected && { color: colors.accentPrimary, fontWeight: '700' },
          ]}
        >
          {day}
        </Text>
        {hasData && (
          <View style={[styles.moodIndicator, { backgroundColor: moodColor }]}>
            <AppIcon name={moodIconName} size={10} loop={false} />
          </View>
        )}
      </Pressable>
    );
  };

  const selectedDayData = selectedDay != null ? ((moodData ?? {})?.[selectedDay] ?? null) : null;

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bgPrimary, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.accentPrimary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          style={[styles.navButton, { backgroundColor: colors.bgCard, borderColor: colors.borderLight }]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.monthNav}>
          <Pressable onPress={handlePrevMonth} hitSlop={10} style={styles.arrowButton}>
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            {monthName} {year}
          </Text>
          <Pressable onPress={handleNextMonth} hitSlop={10} style={styles.arrowButton}>
            <Ionicons name="chevron-forward" size={22} color={colors.textPrimary} />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.calendarCard, { backgroundColor: colors.bgCard, borderColor: colors.borderLight }]}>
          <View style={styles.weekdays}>
            {(weekDays ?? []).map((day) => (
              <Text key={day ?? Math.random().toString()} style={[styles.weekday, { color: colors.textTertiary }]}>
                {day ?? ''}
              </Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {[...Array(Math.max(0, firstDay ?? 0))].map((_, i) => (
              <View key={`empty-${i}`} style={styles.dayCell} />
            ))}
            {[...Array(Math.max(0, daysInMonth ?? 0))].map((_, i) => renderDay(i + 1))}
          </View>
        </View>

        {selectedDayData && (
          <Card variant="elevated" style={styles.detailCard}>
            <CardContent>
              <Text style={[styles.detailDate, { color: colors.textPrimary }]}>
                {selectedDay ?? ''} {monthName ?? ''} {year ?? ''}
              </Text>
              <View style={styles.detailMoodRow}>
                <View
                  style={[
                    styles.moodCircle,
                    {
                      backgroundColor:
                        ((MOOD_COLORS[(selectedDayData as any)?.mood] || colors.accentPrimary) + '22'),
                    },
                  ]}
                >
                  <AppIcon name={moodIcon((selectedDayData as any)?.mood)} size={32} />
                </View>
                <View style={styles.detailMoodInfo}>
                  <Text style={[styles.detailMoodLabel, { color: colors.textPrimary }]}>
                    {typeof (selectedDayData as any)?.mood === 'string' && (selectedDayData as any).mood.length > 0
                      ? (selectedDayData as any).mood.charAt(0).toUpperCase() + (selectedDayData as any).mood.slice(1)
                      : 'Unknown'}
                  </Text>
                  <Text style={[styles.detailMoodMeta, { color: colors.textTertiary }]}>
                    Intensity: {(selectedDayData as any)?.intensity ?? 0}/10 · Stress: {(selectedDayData as any)?.stress ?? 0}/10
                  </Text>
                </View>
              </View>

              <View style={[styles.detailStats, { borderTopColor: colors.borderLight }]}>
                <View style={styles.detailStat}>
                  <Text style={[styles.detailStatLabel, { color: colors.textTertiary }]}>Journal Entry</Text>
                  <Text style={[styles.detailStatValue, { color: colors.textPrimary }]}>
                    {(selectedDayData as any)?.hasJournal ? 'Recorded' : 'None'}
                  </Text>
                </View>
                <View style={styles.detailStat}>
                  <Text style={[styles.detailStatLabel, { color: colors.textTertiary }]}>Habits Done</Text>
                  <Text style={[styles.detailStatValue, { color: colors.textPrimary }]}>
                    {(selectedDayData as any)?.habitsCompleted ?? 0}/{(selectedDayData as any)?.habitsTotal ?? 0}
                  </Text>
                </View>
              </View>
            </CardContent>
          </Card>
        )}

        {!selectedDayData && (
          <Card variant="outlined" style={styles.emptyCard}>
            <CardContent style={styles.emptyCardContent}>
              <Ionicons name="calendar-outline" size={36} color={colors.textTertiary} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Tap an entry date</Text>
              <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
                Days with logged moods have colored badges. Tap any highlighted date to inspect your state.
              </Text>
            </CardContent>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 12,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthNav: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  arrowButton: {
    padding: 6,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 110, gap: 16 },
  calendarCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  weekdays: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  weekday: { width: 40, textAlign: 'center', fontSize: 12, fontWeight: '600' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 8 },
  dayCell: { width: 40, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  dayText: { fontSize: 14, fontWeight: '500' },
  moodIndicator: { marginTop: 2, width: 14, height: 14, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  detailCard: { marginTop: 0 },
  detailDate: { fontSize: 18, fontWeight: '700', marginBottom: 14, textAlign: 'center' },
  detailMoodRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  moodCircle: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  detailMoodInfo: { flex: 1, gap: 4 },
  detailMoodLabel: { fontSize: 18, fontWeight: '700' },
  detailMoodMeta: { fontSize: 13 },
  detailStats: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 12, borderTopWidth: 1 },
  detailStat: { alignItems: 'center', gap: 4 },
  detailStatLabel: { fontSize: 12, fontWeight: '500' },
  detailStatValue: { fontSize: 15, fontWeight: '600' },
  emptyCard: { marginTop: 0 },
  emptyCardContent: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600' },
  emptyText: { fontSize: 13, textAlign: 'center', paddingHorizontal: 20, lineHeight: 18 },
});