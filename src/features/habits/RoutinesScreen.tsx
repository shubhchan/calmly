import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { routineRepository, TimeOfDay } from '../../database/repositories/routineRepository';
import { Card } from '../../components/Card';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenHeader } from '../../components';
import { TactilePressable } from '../../components/interactive/TactilePressable';
import { StaggeredEntry } from '../../components/interactive/StaggeredEntry';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme/ThemeContext';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { ListSkeleton } from '../../components/interactive/LoadingState';
import { resolveTint, tintForIndex } from '../../theme/tints';

type NavigationProp = NativeStackScreenProps<RootStackParamList, 'Routines'>['navigation'];

const TIME_OF_DAY_CONFIG: Record<TimeOfDay, { label: string; icon: any; color: string }> = {
  morning: { label: 'Morning', icon: 'sunny-outline', color: '#EB876D' },
  afternoon: { label: 'Afternoon', icon: 'sunny', color: '#5A955A' },
  evening: { label: 'Evening', icon: 'moon-outline', color: '#877FC5' },
};

export function RoutinesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDark } = useAppTheme();
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
      <ScreenContainer contentContainerStyle={styles.content}>
        <ListSkeleton rows={3} />
      </ScreenContainer>
    );
  }

  const safeRoutines = routines ?? { morning: [], afternoon: [], evening: [] };
  const hasRoutines =
    (safeRoutines?.morning ?? []).length > 0 ||
    (safeRoutines?.afternoon ?? []).length > 0 ||
    (safeRoutines?.evening ?? []).length > 0;

  return (
    <ScreenContainer scroll={false} backgroundColor={colors.background.default}>
      <ScreenHeader title="Mindful Routines" />

      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {(['morning', 'afternoon', 'evening'] as TimeOfDay[]).map((timeOfDay, sectionIndex) => {
        const config = TIME_OF_DAY_CONFIG[timeOfDay];
        const list = safeRoutines[timeOfDay] ?? [];

        return (
          <StaggeredEntry key={timeOfDay} index={sectionIndex}>
            <Card style={styles.sectionCard}>
              <View style={styles.timeOfDayHeader}>
                <View style={[styles.timeOfDayIcon, { backgroundColor: config.color + '20' }]}>
                  <Ionicons name={config.icon} size={22} color={config.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.timeOfDayLabel, { color: colors.text.primary }]}>{config.label}</Text>
                  <Text style={{ fontSize: 12, color: colors.text.tertiary }}>
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
                      backgroundColor: colors.surface.default,
                      borderColor: colors.border.default,
                    },
                  ]}
                  hitSlop={8}
                >
                  <Ionicons name="add" size={20} color={colors.primary.default} />
                </TactilePressable>
              </View>

              {list.length === 0 ? (
                <View style={styles.emptyRoutine}>
                  <Text style={[styles.emptyRoutineText, { color: colors.text.tertiary }]}>
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
                  {list.map((routine, routineIdx) => {
                    const routineTint = resolveTint(!!isDark, tintForIndex(routineIdx));
                    return (
                    <StaggeredEntry key={routine.id} index={routineIdx}>
                      <TactilePressable
                        onPress={() => handleEditRoutine(routine)}
                        scaleDownTo={0.98}
                        hapticStyle="light"
                        style={[
                          styles.routineCard,
                          {
                            backgroundColor: routineTint.bg,
                            borderColor: routineTint.border,
                          },
                        ]}
                      >
                        <View style={styles.routineCardLeft}>
                          <Text style={[styles.routineName, { color: routineTint.text }]}>{routine.name}</Text>
                          <Text style={[styles.routineHabitCount, { color: routineTint.muted }]}>
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
                            <Ionicons name="trash-outline" size={18} color={colors.accents.rose} />
                          </TactilePressable>
                          <Ionicons name="chevron-forward" size={18} color={routineTint.muted} />
                        </View>
                      </TactilePressable>
                    </StaggeredEntry>
                    );
                  })}
                </View>
              )}
            </Card>
          </StaggeredEntry>
        );
      })}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 110, gap: 16 },
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