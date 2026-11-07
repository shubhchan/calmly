import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types/navigation';
import { routineRepository, TimeOfDay } from '../../database/repositories/routineRepository';
import { AppText, Button, ScreenHeader, TactilePressable } from '../../components';
import { Alert } from '../../services/appAlert';
import { useAppTheme } from '../../theme/ThemeContext';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { ListSkeleton } from '../../components/interactive/LoadingState';

type NavigationProp = NativeStackScreenProps<RootStackParamList, 'Routines'>['navigation'];

const SECTIONS: { key: TimeOfDay; label: string; hint: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'morning', label: 'Morning', hint: 'Begin before the day begins', icon: 'sunny-outline' },
  { key: 'afternoon', label: 'Afternoon', hint: 'A pause in the middle', icon: 'partly-sunny-outline' },
  { key: 'evening', label: 'Evening', hint: 'Set the day down', icon: 'moon-outline' },
];

/**
 * Routines — a quiet list of morning, afternoon and evening sequences.
 *
 * Each section is a heading and hairline rows, not a boxed card. Adding a
 * routine is a small inline action, not a floating button.
 */
export function RoutinesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useAppTheme();
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
    Alert.alert('Delete routine?', `This will remove "${routine?.name ?? ''}".`, [
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
    ]);
  };

  if (loading) {
    return (
      <ScreenContainer animate={false} contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16 }}>
        <ListSkeleton rows={3} />
      </ScreenContainer>
    );
  }

  const safeRoutines = routines ?? { morning: [], afternoon: [], evening: [] };

  return (
    <ScreenContainer
      scroll={false}
      backgroundColor={colors.background.default}
      contentContainerStyle={{ flex: 1 }}
    >
      <ScreenHeader title="Mindful routines" />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        <AppText variant="body" tone="secondary" style={{ maxWidth: 300 }}>
          Short sequences that hold the shape of a day. Add a routine, then attach habits to it.
        </AppText>

        {SECTIONS.map((section) => {
          const list = safeRoutines[section.key] ?? [];

          return (
            <View key={section.key} style={{ marginTop: 32 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons name={section.icon} size={17} color={colors.text.tertiary} />
                <AppText variant="overline" tone="tertiary" style={{ flex: 1 }}>
                  {section.label}
                </AppText>
                <TactilePressable
                  onPress={() => handleCreateRoutine(section.key)}
                  scaleDownTo={0.9}
                  hapticStyle="light"
                  accessibilityRole="button"
                  accessibilityLabel={`Add ${section.label.toLowerCase()} routine`}
                  hitSlop={8}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4 }}
                >
                  <Ionicons name="add" size={15} color={colors.primary.default} />
                  <AppText variant="caption" tone="link">
                    Add
                  </AppText>
                </TactilePressable>
              </View>

              {list.length === 0 ? (
                <AppText variant="bodySmall" tone="tertiary" style={{ marginTop: 10 }}>
                  {section.hint}. No routine yet.
                </AppText>
              ) : (
                <View style={{ marginTop: 6 }}>
                  {list.map((routine, index) => (
                    <View
                      key={routine?.id ?? `${section.key}-${index}`}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        borderTopWidth: index === 0 ? 0 : 1,
                        borderTopColor: colors.border.default,
                      }}
                    >
                      <TactilePressable
                        onPress={() => handleEditRoutine(routine)}
                        scaleDownTo={0.99}
                        hapticStyle="light"
                        accessibilityRole="button"
                        accessibilityLabel={`Open ${routine?.name ?? 'routine'}`}
                        style={{
                          flex: 1,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 12,
                          paddingVertical: 14,
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <AppText variant="bodyLarge" numberOfLines={1}>
                            {routine?.name ?? 'Untitled routine'}
                          </AppText>
                          <AppText variant="caption" tone="tertiary" style={{ marginTop: 2 }}>
                            {routine?.items?.length ?? 0}{' '}
                            {(routine?.items?.length ?? 0) === 1 ? 'habit' : 'habits'} linked
                          </AppText>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
                      </TactilePressable>

                      <TactilePressable
                        onPress={() => handleDeleteRoutine(routine)}
                        scaleDownTo={0.88}
                        hapticStyle="medium"
                        accessibilityRole="button"
                        accessibilityLabel={`Delete ${routine?.name ?? 'routine'}`}
                        hitSlop={10}
                        style={{ padding: 8, marginLeft: 4 }}
                      >
                        <Ionicons name="trash-outline" size={16} color={colors.text.tertiary} />
                      </TactilePressable>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}

        <Button
          title="New routine"
          variant="secondary"
          size="sm"
          onPress={() => handleCreateRoutine('morning')}
          style={{ marginTop: 36, alignSelf: 'flex-start' }}
        />
      </ScrollView>
    </ScreenContainer>
  );
}
