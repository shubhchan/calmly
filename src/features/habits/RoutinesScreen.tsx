import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { routineRepository, TimeOfDay } from '../../database/repositories/routineRepository';
import Habit from '../../database/models/Habit';
import { Card } from '../../components/Card';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Ionicons } from '@expo/vector-icons';

type NavigationProp = NativeStackScreenProps<RootStackParamList, 'Routines'>['navigation'];

const TIME_OF_DAY_CONFIG: Record<TimeOfDay, { label: string; icon: string; color: string; emoji: string }> = {
  morning: { label: 'Morning', icon: 'sunny', color: '#F5C6A5', emoji: '🌅' },
  afternoon: { label: 'Afternoon', icon: 'sunny-outline', color: '#A8D0E6', emoji: '☀️' },
  evening: { label: 'Evening', icon: 'moon', color: '#B19CD9', emoji: '🌙' },
};

export function RoutinesScreen() {
  const navigation = useNavigation<NavigationProp>();
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
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading routines...</Text>
      </View>
    );
  }

  const safeRoutines = routines ?? { morning: [], afternoon: [], evening: [] };
  const hasRoutines = (safeRoutines?.morning ?? []).length > 0 || (safeRoutines?.afternoon ?? []).length > 0 || (safeRoutines?.evening ?? []).length > 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>My Routines</Text>
      </View>

      {hasRoutines ? (
        <>
          {(Object.keys(TIME_OF_DAY_CONFIG ?? {}) as TimeOfDay[] ?? []).map((timeOfDay) => {
            const config = (TIME_OF_DAY_CONFIG ?? {})[timeOfDay] ?? { label: '', icon: 'list-outline', color: '#8FBC8F', emoji: '' };
            const dayRoutines = (safeRoutines?.[timeOfDay] ?? []) as any[];

            return (
              <View key={timeOfDay} style={styles.timeOfDaySection}>
                <View style={styles.timeOfDayHeader}>
                  <View style={[styles.timeOfDayIcon, { backgroundColor: config?.color ?? '#8FBC8F' }]}>
                    <Ionicons name={config?.icon ?? 'list-outline'} size={24} color="white" />
                  </View>
                  <Text style={styles.timeOfDayLabel}>
                    {config?.emoji ?? ''} {config?.label ?? ''}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleCreateRoutine(timeOfDay)}
                    style={styles.addRoutineButton}
                  >
                    <Ionicons name="add" size={20} color="#5A955A" />
                  </TouchableOpacity>
                </View>

                {(dayRoutines ?? []).length === 0 ? (
                  <View style={styles.emptyRoutine}>
                    <Text style={styles.emptyRoutineText}>
                      No {(config?.label ?? '').toLowerCase()} routine yet
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleCreateRoutine(timeOfDay)}
                      style={styles.createFirstButton}
                    >
                      <Text style={styles.createFirstButtonText}>Create one</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.routineList}>
                    {(dayRoutines ?? []).map((routine) => (
                      <TouchableOpacity
                        key={routine?.id ?? Math.random().toString()}
                        onPress={() => routine?.id && handleEditRoutine(routine)}
                        style={styles.routineCard}
                        activeOpacity={0.8}
                      >
                        <View style={styles.routineCardLeft}>
                          <Text style={styles.routineName}>{routine?.name ?? ''}</Text>
                          <Text style={styles.routineHabitCount}>
                            {(routine?.items ?? []).length} habit{(routine?.items ?? []).length !== 1 ? 's' : ''}
                          </Text>
                        </View>
                        <View style={styles.routineCardRight}>
                          {(routine?.items ?? []).slice(0, 3).map((item: any, i: number) => (
                            <View
                              key={item?.habitId ?? `${routine?.id ?? 'r'}-${i}`}
                              style={[
                                styles.habitMiniIcon,
                                { backgroundColor: item?.habit?.color || '#8FBC8F' },
                              ]}
                            >
                              <Ionicons
                                name={item?.habit ? getIconName(item?.habit?.icon ?? '') : 'checkbox-outline'}
                                size={16}
                                color="white"
                              />
                            </View>
                          ))}
                          {(routine?.items ?? []).length > 3 && (
                            <View style={styles.habitMiniIconMore}>
                              <Text style={styles.habitMiniIconMoreText}>
                                +{(routine?.items ?? []).length - 3}
                              </Text>
                            </View>
                          )}
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation();
                              handleDeleteRoutine(routine);
                            }}
                            style={styles.deleteIcon}
                          >
                            <Ionicons name="trash-outline" size={20} color="#F5A9A9" />
                          </TouchableOpacity>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="list-outline" size={64} color="#425474" />
          <Text style={styles.emptyTitle}>No routines yet</Text>
          <Text style={styles.emptyText}>
            Build your perfect morning, afternoon, and evening routines
          </Text>
          <View style={styles.emptyButtons}>
            <PrimaryButton
              onPress={() => handleCreateRoutine('morning')}
              title="Create Morning Routine"
              style={styles.emptyButton}
            />
            <PrimaryButton
              onPress={() => handleCreateRoutine('evening')}
              title="Create Evening Routine"
              style={styles.emptyButton}
              variant="outline"
            />
          </View>
        </View>
      )}
    </ScrollView>
  );
}

function getIconName(icon?: string | null): string {
  const iconMap: Record<string, string> = {
    water: 'water', fitness: 'fitness', book: 'book', meditation: 'meditation',
    sunny: 'sunny', moon: 'moon', leaf: 'leaf', heart: 'heart',
    'musical-notes': 'musical-notes', camera: 'camera', bicycle: 'bicycle',
    walk: 'walk', sleep: 'bed', nutrition: 'nutrition', code: 'code',
    brush: 'brush', pill: 'pill', flash: 'flash', diamond: 'diamond',
    star: 'star', flower: 'flower', tree: 'tree', cloud: 'cloud', flame: 'flame',
  };
  return iconMap[icon ?? ''] || 'checkbox-outline';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFBF7',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
    gap: 24,
  },
  header: {
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E232E',
  },
  timeOfDaySection: {
    gap: 12,
  },
  timeOfDayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeOfDayIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeOfDayLabel: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E232E',
  },
  addRoutineButton: {
    marginLeft: 'auto',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4DEBC',
  },
  emptyRoutine: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  emptyRoutineText: {
    fontSize: 15,
    color: '#425474',
  },
  createFirstButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(143, 188, 143, 0.1)',
    borderWidth: 1,
    borderColor: '#5A955A',
  },
  createFirstButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5A955A',
  },
  routineList: {
    gap: 10,
  },
  routineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E4DEBC',
  },
  routineCardLeft: {
    flex: 1,
    gap: 4,
  },
  routineName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1E232E',
  },
  routineHabitCount: {
    fontSize: 13,
    color: '#425474',
  },
  routineCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  habitMiniIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
    borderWidth: 2,
    borderColor: '#FDFBF7',
  },
  habitMiniIconMore: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
    backgroundColor: '#E4DEBC',
    borderWidth: 2,
    borderColor: '#FDFBF7',
  },
  habitMiniIconMoreText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#34415A',
  },
  deleteIcon: {
    marginLeft: 8,
    padding: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E232E',
  },
  emptyText: {
    fontSize: 16,
    color: '#34415A',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  emptyButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  emptyButton: {
    flex: 1,
    minWidth: 150,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 100,
    color: '#425474',
  },
});