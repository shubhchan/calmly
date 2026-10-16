import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { routineRepository, TimeOfDay } from '../../database/repositories/routineRepository';
import { Card } from '../../components/Card';
import { PrimaryButton } from '../../components/PrimaryButton';
import { TactilePressable } from '../../components/interactive/TactilePressable';
import { StaggeredEntry } from '../../components/interactive/StaggeredEntry';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../theme/ThemeContext';

type NavigationProp = NativeStackScreenProps<RootStackParamList, 'Routines'>['navigation'];

const TIME_OF_DAY_CONFIG: Record<TimeOfDay, { label: string; icon: any; color: string }> = {
  morning: { label: 'Morning', icon: 'sunny-outline', color: '#EB876D' },
  afternoon: { label: 'Afternoon', icon: 'sunny', color: '#5A955A' },
  evening: { label: 'Evening', icon: 'moon-outline', color: '#877FC5' },
};

export function RoutinesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const colors = useThemeColors();
  const [routines, setRoutines] = useState<Record<TimeOfDay, any[]>>({
    morning: [],
    afternoon: [],
    evening: [],
  });
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [morning, afternoon, evening] = await Promise.all([
        routineRepository.getByTimeOfDay('morning'),
        routineRepository.getByTimeOfDay('afternoon'),
        routineRepository.getByTimeOfDay('evening'),
      ]);
      setRoutines({ morning: morning ?? [], afternoon: afternoon ?? [], evening: evening ?? [] });
    } catch (error) {
      console.error('Failed to load routines:', error);
      setRoutines((prev) => ({
        morning: prev?.morning ?? [],
        afternoon: prev?.afternoon ?? [],
        evening: prev?.evening ?? [],
      }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateRoutine = (timeOfDay: TimeOfDay) => {
    navigation.navigate('RoutineDetail', { timeOfDay });
  };

  const handleEditRoutine = (routine: any) => {
    if (!routine?.timeOfDay) return;
    navigation.navigate('RoutineDetail', { timeOfDay: routine.timeOfDay, routine });
  };

  const handleDeleteRoutine = async (routine: any) => {
    if (!routine?.id) return;
    Alert.alert(
      'Delete routine?',
      `This will remove "${routine?.name ?? ''}" routine.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!routine?.id) return;
            await routineRepository.delete(routine.id);
            loadData();
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bgPrimary, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading routines...</Text>
      </View>
    );
  }

  const safeRoutines = routines ?? { morning: [], afternoon: [], evening: [] };
  const hasRoutines =
    (safeRoutines?.morning ?? []).length > 0 ||
    (safeRoutines?.afternoon ?? []).length > 0 ||
    (safeRoutines?.evening ?? []).length > 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bgPrimary }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topNav}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [
            styles.backButton,
            {
              backgroundColor: colors.bgCard,
              borderColor: colors.borderLight,
              transform: [{ scale: pressed ? 0.92 : 1 }],
              opacity: pressed ? 0.8 : 1,
            },
          ]}
          hitSlop={10}
        >
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Mindful Routines</Text>
        <View style={{ width: 40 }} />
      </View>

      {(['morning', 'afternoon', 'evening'] as TimeOfDay[]).map((timeOfDay, sectionIndex) => {
        const config = TIME_OF_DAY_CONFIG[timeOfDay];
        const list = safeRoutines[timeOfDay] ?? [];

        return (
          <StaggeredEntry key={timeOfDay} index={sectionIndex} baseDelay={60}>
            <Card style={styles.sectionCard}>
              <View style={styles.timeOfDayHeader}>
                <View style={[styles.timeOfDayIcon, { backgroundColor: config.color + '20' }]}>
                  <Ionicons name={config.icon} size={22} color={config.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.timeOfDayLabel, { color: colors.textPrimary }]}>{config.label}</Text>
                  <Text style={{ fontSize: 12, color: colors.textTertiary }}>
                    {list.length} {list.length === 1 ? 'routine' : 'routines'}
                  </Text>
                </View>
                <TactilePressable
                  onPress={() => handleCreateRoutine(timeOfDay)}
                  scaleDownTo={0.9}
                  hapticStyle="light"
                  style={[
                    styles.addRoutineButton,
                    {
                      backgroundColor: colors.bgCard,
                      borderColor: colors.borderLight,
                    },
                  ]}
                  hitSlop={8}
                >
                  <Ionicons name="add" size={20} color={colors.accentPrimary} />
                </TactilePressable>
              </View>

              {list.length === 0 ? (
                <View style={styles.emptyRoutine}>
                  <Text style={[styles.emptyRoutineText, { color: colors.textTertiary }]}>
                    No {config.label.toLowerCase()} routine defined
                  </Text>
                  <TactilePressable
                    onPress={() => handleCreateRoutine(timeOfDay)}
                    scaleDownTo={0.96}
                    hapticStyle="light"
                    style={[
                      styles.createFirstButton,
                      {
                        borderColor: config.color,
                        backgroundColor: config.color + '12',
                      },
                    ]}
                  >
                    <Text style={[styles.createFirstButtonText, { color: config.color }]}>Add {config.label} Routine</Text>
                  </TactilePressable>
                </View>
              ) : (
                <View style={styles.routineList}>
                  {list.map((routine, routineIdx) => (
                    <StaggeredEntry key={routine.id} index={routineIdx} delayStep={30}>
                      <TactilePressable
                        onPress={() => handleEditRoutine(routine)}
                        scaleDownTo={0.98}
                        hapticStyle="light"
                        style={[
                          styles.routineCard,
                          {
                            backgroundColor: colors.bgSecondary ?? '#F4EFE6',
                            borderColor: colors.borderLight,
                          },
                        ]}
                      >
                        <View style={styles.routineCardLeft}>
                          <Text style={[styles.routineName, { color: colors.textPrimary }]}>{routine.name}</Text>
                          <Text style={[styles.routineHabitCount, { color: colors.textTertiary }]}>
                            {routine.items?.length ?? 0} {routine.items?.length === 1 ? 'habit' : 'habits'} linked
                          </Text>
                        </View>
                        <View style={styles.routineCardRight}>
                          <TactilePressable
                            onPress={() => handleDeleteRoutine(routine)}
                            scaleDownTo={0.88}
                            hapticStyle="medium"
                            style={styles.deleteIcon}
                            hitSlop={8}
                          >
                            <Ionicons name="trash-outline" size={18} color={colors.accentRose || '#EB697F'} />
                          </TactilePressable>
                          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                        </View>
                      </TactilePressable>
                    </StaggeredEntry>
                  ))}
                </View>
              )}
            </Card>
          </StaggeredEntry>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 110, gap: 16 },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
  sectionCard: {
    padding: 16,
    borderRadius: 20,
    gap: 14,
  },
  timeOfDayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeOfDayIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeOfDayLabel: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  addRoutineButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyRoutine: {
    alignItems: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  emptyRoutineText: {
    fontSize: 14,
  },
  createFirstButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  createFirstButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  routineList: {
    gap: 10,
  },
  routineCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  routineCardLeft: {
    flex: 1,
    gap: 3,
  },
  routineName: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  routineHabitCount: {
    fontSize: 13,
    lineHeight: 18,
  },
  routineCardRight: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 2,
  },
  deleteIcon: {
    padding: 4,
  },
  loadingText: {
    fontSize: 15,
  },
});