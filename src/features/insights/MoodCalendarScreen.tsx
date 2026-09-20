import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { insightsRepository } from '../../database/repositories/insightsRepository';
import { MoodEntry } from '../../database/models';
import { Card, CardContent } from '../../components';
import { Ionicons } from '@expo/vector-icons';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from 'date-fns';

const MOOD_COLORS = {
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

const MOOD_EMOJIS: Record<string, string> = {
  happy: '😊',
  peaceful: '😌',
  grateful: '🙏',
  stressed: '😰',
  overwhelmed: '🤯',
  anxious: '😟',
  sad: '😢',
  angry: '😠',
  exhausted: '😴',
  excited: '🤩',
  content: '😌',
  hopeful: '🌱',
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
    const moodColor = hasData ? (MOOD_COLORS as any)?.[moodKey] || '#5A955A' : '#5A955A';
    const moodEmoji = hasData ? (MOOD_EMOJIS as any)?.[moodKey] || '😊' : '😊';

    return (
      <Pressable
        key={day}
        onPress={() => handleDayPress(day)}
        disabled={!hasData}
        style={[
          styles.dayCell,
          isSelected && styles.daySelected,
          isTodayDay && !isSelected && styles.dayToday,
          !hasData && styles.dayEmpty,
        ]}
        activeOpacity={0.8}
      >
        <Text style={[
          styles.dayText,
          isSelected && styles.dayTextSelected,
          isTodayDay && !isSelected && styles.dayTextToday,
        ]}>
          {day}
        </Text>
        {hasData && (
          <View style={[styles.moodIndicator, { backgroundColor: moodColor }]}>
            <Text style={{ fontSize: 12 }}>{moodEmoji}</Text>
          </View>
        )}
      </Pressable>
    );
  };

  const selectedDayData = selectedDay != null ? ((moodData ?? {})?.[selectedDay] ?? null) : null;

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#5A955A" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={handlePrevMonth} style={styles.navButton}>
          <Ionicons name="chevron-back" size={28} color="#1E232E" />
        </Pressable>
        <Text style={styles.headerTitle}>
          {monthName} {year}
        </Text>
        <Pressable onPress={handleNextMonth} style={styles.navButton}>
          <Ionicons name="chevron-forward" size={28} color="#1E232E" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.weekdays}>
          {(weekDays ?? []).map((day) => (
            <Text key={day ?? Math.random().toString()} style={styles.weekday}>{day ?? ''}</Text>
          ))}
        </View>

        <View style={styles.calendarGrid}>
          {[...Array(Math.max(0, firstDay ?? 0))].map((_, i) => (
            <View key={`empty-${i}`} style={styles.dayCell} />
          ))}
          {[...Array(Math.max(0, daysInMonth ?? 0))].map((_, i) => renderDay(i + 1))}
        </View>

        {selectedDayData && (
          <Card variant="elevated" style={styles.detailCard}>
            <CardContent>
              <Text style={styles.detailDate}>
                {selectedDay ?? ''} {monthName ?? ''} {year ?? ''}
              </Text>
              <View style={styles.detailMoodRow}>
                <View style={[
                  styles.moodCircle,
                  { backgroundColor: ((MOOD_COLORS as any)?.[(selectedDayData as any)?.mood] ?? '#5A955A') + '20' },
                ]}>
                  <Text style={{ fontSize: 32 }}>{(MOOD_EMOJIS as any)?.[(selectedDayData as any)?.mood] || '😊'}</Text>
                </View>
                <View style={styles.detailMoodInfo}>
                  <Text style={styles.detailMoodLabel}>
                    {typeof (selectedDayData as any)?.mood === 'string' && (selectedDayData as any).mood.length > 0
                      ? (selectedDayData as any).mood.charAt(0).toUpperCase() + (selectedDayData as any).mood.slice(1)
                      : 'Unknown'}
                  </Text>
                  <Text style={styles.detailMoodMeta}>
                    Intensity: {(selectedDayData as any)?.intensity ?? 0}/10 · Stress: {(selectedDayData as any)?.stress ?? 0}/10 · Energy: {(selectedDayData as any)?.energy ?? '—'}
                  </Text>
                </View>
              </View>

              <View style={styles.detailStats}>
                <View style={styles.detailStat}>
                  <Text style={styles.detailStatLabel}>Journal</Text>
                  <Text style={styles.detailStatValue}>
                    {(selectedDayData as any)?.hasJournal ? '✓ Written' : '—'}
                  </Text>
                </View>
                <View style={styles.detailStat}>
                  <Text style={styles.detailStatLabel}>Habits</Text>
                  <Text style={styles.detailStatValue}>
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
              <Text style={{ fontSize: 48 }}>📅</Text>
              <Text style={styles.emptyTitle}>Tap a day with mood data</Text>
              <Text style={styles.emptyText}>
                Days with entries show an emoji. Tap to see details.
              </Text>
            </CardContent>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFBF7' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  navButton: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: '600', color: '#1E232E' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },
  weekdays: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  weekday: { width: 40, textAlign: 'center', fontSize: 12, fontWeight: '600', color: '#425474' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  dayCell: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  daySelected: { backgroundColor: '#5A955A' },
  dayToday: { borderWidth: 2, borderColor: '#5A955A' },
  dayEmpty: { opacity: 0.3 },
  dayText: { fontSize: 14, fontWeight: '500', color: '#1E232E' },
  dayTextSelected: { color: 'white' },
  dayTextToday: { color: '#5A955A' },
  moodIndicator: { marginTop: 2, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8 },
  detailCard: { marginTop: 16 },
  detailDate: { fontSize: 18, fontWeight: '600', color: '#1E232E', marginBottom: 12, textAlign: 'center' },
  detailMoodRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  moodCircle: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  detailMoodInfo: { flex: 1, gap: 4 },
  detailMoodLabel: { fontSize: 18, fontWeight: '600', color: '#1E232E' },
  detailMoodMeta: { fontSize: 13, color: '#425474' },
  detailStats: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#E4DEBC' },
  detailStat: { alignItems: 'center', gap: 4 },
  detailStatLabel: { fontSize: 12, fontWeight: '500', color: '#425474' },
  detailStatValue: { fontSize: 14, fontWeight: '600', color: '#1E232E' },
  emptyCard: { marginTop: 16 },
  emptyCardContent: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#34415A' },
  emptyText: { fontSize: 14, color: '#425474', textAlign: 'center', paddingHorizontal: 20 },
});