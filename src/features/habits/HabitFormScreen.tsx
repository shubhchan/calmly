import React, { useState, useEffect, useCallback } from 'react';
import { View, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Alert } from '../../services/appAlert';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { habitRepository } from '../../database/repositories/habitRepository';
import { notificationService } from '../../services/notifications';
import { getIconName } from '../../utils/iconMap';
import { AppText, Button, ScreenHeader, TactilePressable } from '../../components';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme/ThemeContext';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { PopIn } from '../../components/interactive/PopIn';
import { FormSkeleton } from '../../components/interactive/LoadingState';

type NavigationProp = NativeStackScreenProps<RootStackParamList, 'HabitForm'>['navigation'];
type RouteProp = NativeStackScreenProps<RootStackParamList, 'HabitForm'>['route'];

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily', description: 'Every single day' },
  { value: 'weekdays', label: 'Weekdays', description: 'Monday to Friday only' },
  { value: 'custom', label: 'Custom days', description: 'Select specific days' },
];

const DAYS = [
  { value: '0', label: 'Sun', short: 'S' },
  { value: '1', label: 'Mon', short: 'M' },
  { value: '2', label: 'Tue', short: 'T' },
  { value: '3', label: 'Wed', short: 'W' },
  { value: '4', label: 'Thu', short: 'T' },
  { value: '5', label: 'Fri', short: 'F' },
  { value: '6', label: 'Sat', short: 'S' },
];

const ICONS = [
  'water', 'fitness', 'book', 'meditation', 'sunny', 'moon', 'leaf', 'heart',
  'musical-notes', 'camera', 'bicycle', 'walk', 'sleep', 'nutrition', 'code',
  'brush', 'pill', 'flash', 'diamond', 'star', 'flower', 'tree', 'cloud', 'flame',
];

/** Muted identity colors that sit inside the Still Water palette. */
const COLORS = [
  '#2C4F45', '#5F5A6B', '#41626E', '#8E5F42',
  '#7F5257', '#356B6D', '#3F6E58', '#9A7434',
];

const REMINDER_TIMES = ['06:00', '07:00', '08:00', '09:00', '12:00', '17:00', '18:00', '20:00', '21:00', '22:00'];

/**
 * Habit form — one page, read top to bottom.
 *
 * Each question is an overline and its control, separated by hairlines.
 * Pickers open as calm sheets over the page.
 */
export function HabitFormScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp>();
  const { colors } = useAppTheme();
  const { id, preview } = route.params ?? {};
  const isEditing = !!id;

  const initialCustomDays = (() => {
    try {
      const parsed = JSON.parse(preview?.customDays || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();

  const [name, setName] = useState(preview?.name ?? '');
  const [icon, setIcon] = useState(preview?.icon ?? 'water');
  const [color, setColor] = useState(preview?.color ?? COLORS[0]);
  const [frequency, setFrequency] = useState<'daily' | 'weekdays' | 'custom'>(
    (preview?.frequency as 'daily' | 'weekdays' | 'custom') ?? 'daily'
  );
  const [customDays, setCustomDays] = useState<string[]>(initialCustomDays);
  const [reminderTime, setReminderTime] = useState(preview?.reminderTime ?? '');
  const [goal, setGoal] = useState(preview?.goal ?? 1);
  const [notes, setNotes] = useState(preview?.notes ?? '');
  const [loading, setLoading] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const loadHabit = useCallback(async () => {
    if (!id) return;
    if (!preview) setLoading(true);
    try {
      const habit = await habitRepository.getById(id);
      if (habit) {
        setName(habit?.name ?? '');
        setIcon(habit?.icon ?? 'water');
        setColor(habit?.color ?? COLORS[0]);
        setFrequency((habit?.frequency as 'daily' | 'weekdays' | 'custom') ?? 'daily');
        try {
          const parsed = JSON.parse(habit?.customDays || '[]');
          setCustomDays(Array.isArray(parsed) ? parsed : []);
        } catch {
          setCustomDays([]);
        }
        setReminderTime(habit?.reminderTime || '');
        setGoal(habit?.goal ?? 1);
        setNotes(habit?.notes || '');
      }
    } catch (error) {
      console.error('Failed to load habit:', error);
      setCustomDays((prev) => prev ?? []);
    } finally {
      setLoading(false);
    }
  }, [id, preview]);

  useEffect(() => {
    loadHabit();
  }, [loadHabit]);

  const validate = (): boolean => {
    if (!(name ?? '').trim()) {
      Alert.alert('Missing name', 'Please enter a habit name');
      return false;
    }
    if (frequency === 'custom' && (customDays ?? []).length === 0) {
      Alert.alert('Select days', 'Please choose at least one day for custom frequency');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    if (isEditing && !id) {
      Alert.alert('Error', 'Missing habit id. Please try again.');
      return;
    }
    setLoading(true);
    try {
      if (isEditing) {
        await habitRepository.update(id, {
          name: (name ?? '').trim(),
          icon: icon ?? 'water',
          color: color ?? COLORS[0],
          frequency,
          customDays: JSON.stringify(frequency === 'custom' ? (customDays ?? []) : []),
          reminderTime: reminderTime ?? '',
          goal: goal ?? 1,
          notes: (notes ?? '').trim(),
        });
      } else {
        await habitRepository.create({
          name: (name ?? '').trim(),
          icon: icon ?? 'water',
          color: color ?? COLORS[0],
          frequency,
          customDays: frequency === 'custom' ? (customDays ?? []) : [],
          reminderTime: reminderTime ?? '',
          goal: goal ?? 1,
          notes: (notes ?? '').trim(),
        });
      }
      await notificationService?.syncHabitReminders?.();
      navigation.goBack();
    } catch (error) {
      console.error('Failed to save habit:', error);
      Alert.alert('Error', 'Failed to save habit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    Alert.alert('Delete habit?', 'This will remove the habit and all its completion history.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await habitRepository.delete(id!);
          await notificationService?.syncHabitReminders?.();
          navigation.goBack();
        },
      },
    ]);
  };

  const toggleDay = (day: string) => {
    if (!day) return;
    setCustomDays((prev) =>
      (prev ?? []).includes(day) ? (prev ?? []).filter((d) => d !== day) : [...(prev ?? []), day]
    );
  };

  const renderIconPicker = () => (
    <View style={[styles.sheet, { backgroundColor: colors.surface.default }]}>
      <AppText variant="h3" center>
        Choose an icon
      </AppText>
      <ScrollView horizontal style={{ marginTop: 18 }} showsHorizontalScrollIndicator={false}>
        {(ICONS ?? []).map((i) => (
          <TactilePressable
            key={i}
            onPress={() => {
              setIcon(i);
              setShowIconPicker(false);
            }}
            scaleDownTo={0.94}
            hapticStyle="selection"
            accessibilityRole="button"
            accessibilityLabel={`Choose ${i} icon`}
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              marginRight: 10,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: icon === i ? colors.primary.default : colors.surface.muted,
            }}
          >
            <Ionicons
              name={getIconName(i) as any}
              size={24}
              color={icon === i ? colors.primary.foreground : colors.text.secondary}
            />
          </TactilePressable>
        ))}
      </ScrollView>
    </View>
  );

  const renderColorPicker = () => (
    <View style={[styles.sheet, { backgroundColor: colors.surface.default }]}>
      <AppText variant="h3" center>
        Choose a color
      </AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, justifyContent: 'center', marginTop: 18 }}>
        {(COLORS ?? []).map((c) => (
          <TactilePressable
            key={c}
            onPress={() => {
              setColor(c);
              setShowColorPicker(false);
            }}
            scaleDownTo={0.94}
            hapticStyle="selection"
            accessibilityRole="button"
            accessibilityLabel={`Choose color ${c}`}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 2,
              borderColor: color === c ? colors.text.primary : 'transparent',
            }}
          >
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: c }} />
          </TactilePressable>
        ))}
      </View>
    </View>
  );

  if (isEditing && loading && !name) {
    return (
      <ScreenContainer animate={false} contentContainerStyle={styles.scrollContent}>
        <FormSkeleton fields={5} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll={false} animate={false} backgroundColor={colors.background.default}>
      <ScreenHeader title={isEditing ? 'Edit habit' : 'New habit'} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <AppText variant="body" tone="secondary" style={{ maxWidth: 300 }}>
          {isEditing ? 'Adjust the details of this practice.' : 'One small action, repeated. Keep it easy enough to do on a hard day.'}
        </AppText>

        <PopIn index={1}>
          <View style={{ marginTop: 32 }}>
            <AppText variant="overline" tone="tertiary" style={{ marginBottom: 8 }}>
              Name
            </AppText>
            <TextInput
              style={[
                styles.input,
                { color: colors.text.primary, backgroundColor: colors.surface.default, borderColor: colors.border.default },
              ]}
              placeholder="e.g. Mindful morning walk"
              value={name}
              onChangeText={setName}
              placeholderTextColor={colors.text.tertiary}
              autoCapitalize="words"
              maxLength={50}
              accessibilityLabel="Habit name"
            />
          </View>
        </PopIn>

        <PopIn index={2}>
          <View style={{ marginTop: 32, flexDirection: 'row', gap: 12 }}>
            <TactilePressable
              onPress={() => setShowIconPicker(true)}
              scaleDownTo={0.97}
              hapticStyle="light"
              accessibilityRole="button"
              accessibilityLabel="Select icon"
              style={{ flex: 1, alignItems: 'center', gap: 8 }}
            >
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 18,
                  backgroundColor: color,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name={getIconName(icon) as any} size={26} color={colors.primary.foreground} />
              </View>
              <AppText variant="caption" tone="secondary">
                Icon
              </AppText>
            </TactilePressable>

            <TactilePressable
              onPress={() => setShowColorPicker(true)}
              scaleDownTo={0.97}
              hapticStyle="light"
              accessibilityRole="button"
              accessibilityLabel="Select color"
              style={{ flex: 1, alignItems: 'center', gap: 8 }}
            >
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 18,
                  backgroundColor: colors.surface.muted,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: color }} />
              </View>
              <AppText variant="caption" tone="secondary">
                Color
              </AppText>
            </TactilePressable>
          </View>
        </PopIn>

        <PopIn index={3}>
          <View style={{ marginTop: 36 }}>
            <AppText variant="overline" tone="tertiary">
              How often
            </AppText>
            <View style={{ marginTop: 4 }}>
              {(FREQUENCY_OPTIONS ?? []).map((opt, index) => {
                const isSelected = frequency === opt?.value;
                return (
                  <View key={opt?.value ?? 'ph-' + index}>
                    <TactilePressable
                      onPress={() => opt?.value && setFrequency(opt.value as 'daily' | 'weekdays' | 'custom')}
                      scaleDownTo={0.99}
                      hapticStyle="selection"
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isSelected }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        paddingVertical: 14,
                        borderTopWidth: index === 0 ? 0 : 1,
                        borderTopColor: colors.border.default,
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <AppText variant="body" tone={isSelected ? 'primary' : 'secondary'}>
                          {opt?.label ?? ''}
                        </AppText>
                        <AppText variant="caption" tone="tertiary" style={{ marginTop: 1 }}>
                          {opt?.description ?? ''}
                        </AppText>
                      </View>
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

            {frequency === 'custom' ? (
              <View style={{ marginTop: 14 }}>
                <AppText variant="caption" tone="tertiary" style={{ marginBottom: 8 }}>
                  Active days
                </AppText>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  {(DAYS ?? []).map((day, index) => {
                    const isDaySelected = (customDays ?? []).includes(day?.value);
                    return (
                      <TactilePressable
                        key={day?.value ?? 'ph-' + index}
                        onPress={() => day?.value && toggleDay(day.value)}
                        scaleDownTo={0.92}
                        hapticStyle="selection"
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: isDaySelected }}
                        accessibilityLabel={day?.label ?? ''}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: isDaySelected ? colors.primary.default : colors.surface.muted,
                        }}
                      >
                        <AppText
                          variant="label"
                          tone={isDaySelected ? 'onPrimary' : 'secondary'}
                        >
                          {day?.short ?? ''}
                        </AppText>
                      </TactilePressable>
                    );
                  })}
                </View>
              </View>
            ) : null}
          </View>
        </PopIn>

        <PopIn index={4}>
          <View style={{ marginTop: 36 }}>
            <AppText variant="overline" tone="tertiary">
              Reminder
            </AppText>
            <TactilePressable
              onPress={() => setShowTimePicker(true)}
              scaleDownTo={0.99}
              hapticStyle="light"
              accessibilityRole="button"
              accessibilityLabel="Set reminder time"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 14,
              }}
            >
              <Ionicons name="alarm-outline" size={19} color={colors.text.secondary} />
              <AppText variant="body" style={{ flex: 1 }}>
                {reminderTime || 'No reminder'}
              </AppText>
              <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
            </TactilePressable>
          </View>
        </PopIn>

        <PopIn index={5}>
          <View style={{ marginTop: 32 }}>
            <AppText variant="overline" tone="tertiary">
              Daily repetitions
            </AppText>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 }}>
              <TactilePressable
                onPress={() => setGoal(Math.max(1, (goal ?? 1) - 1))}
                scaleDownTo={0.9}
                hapticStyle="light"
                accessibilityRole="button"
                accessibilityLabel="Decrease repetitions"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.surface.muted,
                }}
              >
                <Ionicons name="remove" size={18} color={colors.text.primary} />
              </TactilePressable>
              <AppText variant="h3" style={{ minWidth: 28, textAlign: 'center' }}>
                {goal ?? 1}
              </AppText>
              <TactilePressable
                onPress={() => setGoal((goal ?? 1) + 1)}
                scaleDownTo={0.9}
                hapticStyle="light"
                accessibilityRole="button"
                accessibilityLabel="Increase repetitions"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.surface.muted,
                }}
              >
                <Ionicons name="add" size={18} color={colors.text.primary} />
              </TactilePressable>
              <AppText variant="bodySmall" tone="secondary">
                time{(goal ?? 1) !== 1 ? 's' : ''} per day
              </AppText>
            </View>
          </View>
        </PopIn>

        <PopIn index={6}>
          <View style={{ marginTop: 32 }}>
            <AppText variant="overline" tone="tertiary" style={{ marginBottom: 8 }}>
              Intention
            </AppText>
            <TextInput
              style={[
                styles.textArea,
                { color: colors.text.primary, borderColor: colors.border.default, backgroundColor: colors.surface.default },
              ]}
              placeholder="Why does this matter to you?"
              value={notes}
              onChangeText={setNotes}
              placeholderTextColor={colors.text.tertiary}
              multiline
              maxLength={500}
              accessibilityLabel="Habit intention"
            />
          </View>
        </PopIn>

        <PopIn index={7}>
          <View style={{ marginTop: 40, gap: 12 }}>
            <Button
              onPress={handleSave}
              loading={loading}
              title={isEditing ? 'Save changes' : 'Create habit'}
              fullWidth
            />
            {isEditing ? (
              <Button onPress={handleDelete} variant="ghost" title="Delete habit" fullWidth />
            ) : null}
          </View>
        </PopIn>
      </ScrollView>

      {showIconPicker ? (
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay.scrim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowIconPicker(false)} />
          {renderIconPicker()}
        </View>
      ) : null}

      {showColorPicker ? (
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay.scrim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowColorPicker(false)} />
          {renderColorPicker()}
        </View>
      ) : null}

      {showTimePicker ? (
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay.scrim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowTimePicker(false)} />
          <View style={[styles.sheet, { backgroundColor: colors.surface.default }]}>
            <AppText variant="h3" center>
              Reminder time
            </AppText>
            <AppText variant="h2" center style={{ marginTop: 10 }}>
              {reminderTime || '--:--'}
            </AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 18 }}>
              {REMINDER_TIMES.map((t) => {
                const selected = reminderTime === t;
                return (
                  <TactilePressable
                    key={t}
                    onPress={() => {
                      setReminderTime(t);
                      setShowTimePicker(false);
                    }}
                    hapticStyle="selection"
                    accessibilityRole="button"
                    accessibilityLabel={`Remind at ${t}`}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      borderRadius: 12,
                      backgroundColor: selected ? colors.primary.default : colors.surface.muted,
                    }}
                  >
                    <AppText variant="label" tone={selected ? 'onPrimary' : 'secondary'}>
                      {t}
                    </AppText>
                  </TactilePressable>
                );
              })}
            </View>
            <Button
              title="Clear reminder"
              variant="ghost"
              size="sm"
              onPress={() => {
                setReminderTime('');
                setShowTimePicker(false);
              }}
              style={{ marginTop: 16, alignSelf: 'center' }}
            />
          </View>
        </View>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 10, paddingBottom: 56 },
  input: {
    fontSize: 17,
    lineHeight: 24,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
  },
  textArea: {
    fontSize: 15,
    lineHeight: 22,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 96,
    textAlignVertical: 'top',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  sheet: {
    borderRadius: 28,
    padding: 22,
    width: '100%',
    maxHeight: '80%',
  },
});
