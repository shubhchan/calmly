import React, { useState, useEffect, useCallback } from 'react';
import { View, TextInput, ScrollView, StyleSheet } from 'react-native';
import { Alert } from '../../services/appAlert';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { routineRepository, TimeOfDay } from '../../database/repositories/routineRepository';
import { habitRepository } from '../../database/repositories/habitRepository';
import Habit from '../../database/models/Habit';
import { AppText, Button, ScreenHeader, TactilePressable } from '../../components';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme/ThemeContext';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { PopIn } from '../../components/interactive/PopIn';
import { DetailSkeleton } from '../../components/interactive/LoadingState';

type NavigationProp = NativeStackScreenProps<RootStackParamList, 'RoutineDetail'>['navigation'];
type RouteProp = NativeStackScreenProps<RootStackParamList, 'RoutineDetail'>['route'];

const SECTIONS: Record<TimeOfDay, { label: string; icon: keyof typeof Ionicons.glyphMap; hint: string }> = {
  morning: { label: 'Morning', icon: 'sunny-outline', hint: 'Start gentle' },
  afternoon: { label: 'Afternoon', icon: 'partly-sunny-outline', hint: 'Midday pause' },
  evening: { label: 'Evening', icon: 'moon-outline', hint: 'Wind down' },
};

const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Daily',
  weekdays: 'Weekdays',
  custom: 'Custom',
};

function getIconName(icon?: string | null): any {
  const iconMap: Record<string, string> = {
    water: 'water-outline', fitness: 'fitness-outline', book: 'book-outline', meditation: 'flower-outline',
    sunny: 'sunny-outline', moon: 'moon-outline', leaf: 'leaf-outline', heart: 'heart-outline',
    'musical-notes': 'musical-notes-outline', camera: 'camera-outline', bicycle: 'bicycle-outline',
    walk: 'walk-outline', sleep: 'bed-outline', nutrition: 'nutrition-outline', code: 'code-slash-outline',
    brush: 'brush-outline', pill: 'medical-outline', flash: 'flash-outline', diamond: 'diamond-outline',
    star: 'star-outline', flower: 'flower-outline', tree: 'leaf-outline', cloud: 'cloud-outline', flame: 'flame-outline',
  };
  return iconMap[icon ?? ''] || 'checkbox-outline';
}

/**
 * Routine detail — a name, then a list of habits in order.
 *
 * The form is a page, not a stack of boxes: one field, one selectable list,
 * one action at the end.
 */
export function RoutineDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp>();
  const { colors } = useAppTheme();
  const { timeOfDay = 'morning', routine } = route.params ?? {};
  const isEditing = !!routine;

  const config = SECTIONS[timeOfDay] ?? SECTIONS.morning;
  const [name, setName] = useState(routine?.name ?? '');
  const [habits, setHabits] = useState<Habit[]>([]);
  const [selectedHabitIds, setSelectedHabitIds] = useState<string[]>(() => {
    try {
      const items = Array.isArray(routine?.items) ? routine.items : [];
      return items.map((i: any) => i?.habitId).filter(Boolean);
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);
  const [loadingHabits, setLoadingHabits] = useState(true);

  const loadHabits = useCallback(async () => {
    try {
      const allHabits = await habitRepository.getAll(false);
      setHabits(allHabits ?? []);
    } catch (error) {
      console.error('Failed to load habits:', error);
      setHabits((prev) => prev ?? []);
    } finally {
      setLoadingHabits(false);
    }
  }, []);

  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  const toggleHabit = (habitId: string) => {
    if (!habitId) return;
    setSelectedHabitIds((prev) =>
      (prev ?? []).includes(habitId) ? (prev ?? []).filter((id) => id !== habitId) : [...(prev ?? []), habitId]
    );
  };

  const validate = (): boolean => {
    if (!(name ?? '').trim()) {
      Alert.alert('Missing name', 'Please enter a routine name');
      return false;
    }
    if ((selectedHabitIds ?? []).length === 0) {
      Alert.alert('No habits', 'Please select at least one habit for this routine');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    if (isEditing && !routine?.id) {
      Alert.alert('Error', 'Missing routine id. Please try again.');
      return;
    }
    setLoading(true);
    try {
      if (isEditing) {
        await routineRepository.update(routine.id, { name: (name ?? '').trim(), habitIds: selectedHabitIds ?? [] });
      } else {
        await routineRepository.create({ name: (name ?? '').trim(), timeOfDay: timeOfDay ?? 'morning', habitIds: selectedHabitIds ?? [] });
      }
      navigation.goBack();
    } catch (error) {
      console.error('Failed to save routine:', error);
      Alert.alert('Error', 'Failed to save routine. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!routine?.id) return;
    Alert.alert('Delete routine?', 'This will remove the routine but your habits will remain safe.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!routine?.id) return;
          await routineRepository.delete(routine.id);
          navigation.goBack();
        },
      },
    ]);
  };

  if (loadingHabits) {
    return (
      <ScreenContainer animate={false} contentContainerStyle={styles.scrollContent}>
        <DetailSkeleton />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll={false} animate={false} backgroundColor={colors.background.default}>
      <ScreenHeader title={isEditing ? 'Edit routine' : `${config.label} routine`} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 15,
              backgroundColor: colors.primary.subtle,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name={config.icon} size={21} color={colors.primary.default} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="overline" tone="tertiary">
              {config.hint}
            </AppText>
            <AppText variant="body" tone="secondary" style={{ marginTop: 2 }}>
              {isEditing ? 'Adjust the sequence or its habits.' : 'Give the routine a name and link its habits.'}
            </AppText>
          </View>
        </View>

        <View style={{ marginTop: 32 }}>
          <AppText variant="overline" tone="tertiary" style={{ marginBottom: 8 }}>
            Routine name
          </AppText>
          <TextInput
            style={[
              styles.input,
              {
                color: colors.text.primary,
                backgroundColor: colors.surface.default,
                borderColor: colors.border.default,
              },
            ]}
            placeholder={`e.g. ${config.label} awakening`}
            value={name}
            onChangeText={setName}
            placeholderTextColor={colors.text.tertiary}
            autoCapitalize="words"
            maxLength={50}
            accessibilityLabel="Routine name"
          />
        </View>

        <PopIn index={1}>
          <View style={{ marginTop: 32 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <AppText variant="overline" tone="tertiary">
                Linked habits
              </AppText>
              <AppText variant="caption" tone="tertiary">
                {selectedHabitIds.length} selected
              </AppText>
            </View>

            {habits.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Ionicons name="leaf-outline" size={26} color={colors.text.tertiary} />
                <AppText variant="bodyLarge" center style={{ marginTop: 12 }}>
                  No habits yet
                </AppText>
                <AppText variant="bodySmall" tone="tertiary" center style={{ marginTop: 4, maxWidth: 280 }}>
                  Create habits in the Habits tab first, then link them to this routine.
                </AppText>
              </View>
            ) : (
              <View style={{ marginTop: 4 }}>
                {habits.map((item, index) => {
                  const isSelected = selectedHabitIds.includes(item.id);
                  const order = selectedHabitIds.indexOf(item.id) + 1;
                  return (
                    <View
                      key={item.id}
                      style={{
                        borderTopWidth: index === 0 ? 0 : 1,
                        borderTopColor: colors.border.default,
                      }}
                    >
                      <TactilePressable
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 12,
                          paddingVertical: 13,
                        }}
                        onPress={() => toggleHabit(item.id)}
                        scaleDownTo={0.99}
                        hapticStyle="selection"
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: isSelected }}
                        accessibilityLabel={item.name}
                      >
                        <View
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 11,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: isSelected ? colors.primary.subtle : colors.surface.muted,
                          }}
                        >
                          <Ionicons
                            name={getIconName(item.icon)}
                            size={16}
                            color={isSelected ? colors.primary.default : colors.text.secondary}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <AppText variant="body" numberOfLines={1}>
                            {item.name}
                          </AppText>
                          <AppText variant="caption" tone="tertiary" style={{ marginTop: 1 }}>
                            {FREQUENCY_LABELS[item.frequency] || item.frequency}
                          </AppText>
                        </View>
                        {isSelected ? (
                          <AppText variant="caption" tone="link">
                            {order}
                          </AppText>
                        ) : null}
                        <Ionicons
                          name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                          size={21}
                          color={isSelected ? colors.primary.default : colors.text.tertiary}
                        />
                      </TactilePressable>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </PopIn>

        <PopIn index={2}>
          <View style={{ marginTop: 36, gap: 12 }}>
            <Button
              onPress={handleSave}
              loading={loading}
              title={isEditing ? 'Save routine' : 'Create routine'}
              fullWidth
            />
            {isEditing ? (
              <Button onPress={handleDelete} variant="ghost" title="Delete routine" fullWidth />
            ) : null}
          </View>
        </PopIn>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 10, paddingBottom: 48 },
  input: {
    fontSize: 17,
    lineHeight: 24,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
  },
});
