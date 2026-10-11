import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Keyboard } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { habitRepository } from '../../database/repositories/habitRepository';
import { getIconName } from '../../utils/iconMap';
import { Card } from '../../components/Card';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../theme/ThemeContext';

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

const COLORS = [
  '#5A955A', '#877FC5', '#6B9BCD', '#EB876D', '#EB697F', '#4EA5A5',
  '#B19CD9', '#A8D0E6', '#F5C6A5', '#74AC74', '#9FD8A8', '#E8A8D8',
];

export function HabitFormScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp>();
  const colors = useThemeColors();
  const { id } = route.params ?? {};
  const isEditing = !!id;

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('water');
  const [color, setColor] = useState(COLORS[0]);
  const [frequency, setFrequency] = useState<'daily' | 'weekdays' | 'custom'>('daily');
  const [customDays, setCustomDays] = useState<string[]>([]);
  const [reminderTime, setReminderTime] = useState('');
  const [goal, setGoal] = useState(1);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const loadHabit = useCallback(async () => {
    if (!id) return;
    setLoading(true);
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
  }, [id]);

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
    Alert.alert(
      'Delete habit?',
      'This will remove the habit and all its completion history.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await habitRepository.delete(id!);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const toggleDay = (day: string) => {
    if (!day) return;
    setCustomDays((prev) =>
      (prev ?? []).includes(day) ? (prev ?? []).filter((d) => d !== day) : [...(prev ?? []), day]
    );
  };

  const renderIconPicker = () => (
    <View style={[styles.pickerContainer, { backgroundColor: colors.bgCard, borderColor: colors.borderLight }]}>
      <Text style={[styles.pickerTitle, { color: colors.textPrimary }]}>Choose Icon</Text>
      <ScrollView horizontal style={styles.iconScroll} showsHorizontalScrollIndicator={false}>
        {(ICONS ?? []).map((i) => (
          <TouchableOpacity
            key={i}
            onPress={() => {
              setIcon(i);
              setShowIconPicker(false);
            }}
            style={[
              styles.iconOption,
              { backgroundColor: colors.bgPrimary, borderColor: colors.borderLight },
              icon === i && { backgroundColor: color, borderColor: color },
            ]}
          >
            <Ionicons name={getIconName(i) as any} size={26} color={icon === i ? '#FFFFFF' : colors.textPrimary} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderColorPicker = () => (
    <View style={[styles.pickerContainer, { backgroundColor: colors.bgCard, borderColor: colors.borderLight }]}>
      <Text style={[styles.pickerTitle, { color: colors.textPrimary }]}>Choose Color</Text>
      <View style={styles.colorGrid}>
        {(COLORS ?? []).map((c) => (
          <TouchableOpacity
            key={c}
            onPress={() => {
              setColor(c);
              setShowColorPicker(false);
            }}
            style={[
              styles.colorOption,
              color === c && { borderColor: colors.accentPrimary },
            ]}
          >
            <View style={[styles.colorCircle, { backgroundColor: c }]} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <View style={styles.topNav}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backButton, { backgroundColor: colors.bgCard, borderColor: colors.borderLight }]}
          hitSlop={10}
        >
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          {isEditing ? 'Edit Habit' : 'New Habit'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        onTouchStart={() => Keyboard.dismiss()}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Habit Name</Text>
          <TextInput
            style={[styles.input, { color: colors.textPrimary, borderBottomColor: colors.borderLight }]}
            placeholder="e.g. Mindful Morning Walk"
            value={name}
            onChangeText={setName}
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="words"
            maxLength={50}
          />
        </Card>

        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Icon & Color Identity</Text>
          <View style={styles.iconColorRow}>
            <TouchableOpacity onPress={() => setShowIconPicker(true)} style={styles.iconPreview}>
              <View style={[styles.iconPreviewCircle, { backgroundColor: color }]}>
                <Ionicons name={getIconName(icon) as any} size={28} color="#FFFFFF" />
              </View>
              <Text style={[styles.iconPreviewLabel, { color: colors.textSecondary }]}>Select Icon</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowColorPicker(true)} style={styles.colorPreview}>
              <View style={[styles.colorPreviewCircle, { backgroundColor: color }]} />
              <Text style={[styles.iconPreviewLabel, { color: colors.textSecondary }]}>Select Color</Text>
            </TouchableOpacity>
          </View>
        </Card>

        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Frequency</Text>
          {(FREQUENCY_OPTIONS ?? []).map((opt) => {
            const isSelected = frequency === opt?.value;
            return (
              <TouchableOpacity
                key={opt?.value ?? Math.random().toString()}
                onPress={() => opt?.value && setFrequency(opt.value as 'daily' | 'weekdays' | 'custom')}
                style={[
                  styles.frequencyOption,
                  { backgroundColor: colors.bgSecondary ?? '#F4EFE6', borderColor: isSelected ? colors.accentPrimary : colors.borderLight },
                  isSelected && { backgroundColor: colors.accentPrimary + '14', borderWidth: 2 },
                ]}
              >
                <View style={styles.frequencyOptionContent}>
                  <Text style={[styles.frequencyLabel, { color: colors.textPrimary }, isSelected && { fontWeight: '700' }]}>
                    {opt?.label ?? ''}
                  </Text>
                  <Text style={[styles.frequencyDesc, { color: colors.textTertiary }]}>{opt?.description ?? ''}</Text>
                </View>
                <Ionicons
                  name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                  size={22}
                  color={isSelected ? colors.accentPrimary : colors.textTertiary}
                  style={{ marginTop: 2 }}
                />
              </TouchableOpacity>
            );
          })}

          {frequency === 'custom' && (
            <View style={styles.dayPicker}>
              <Text style={[styles.dayPickerLabel, { color: colors.textSecondary }]}>Active Days</Text>
              <View style={styles.dayButtons}>
                {(DAYS ?? []).map((day) => {
                  const isDaySelected = (customDays ?? []).includes(day?.value);
                  return (
                    <TouchableOpacity
                      key={day?.value ?? Math.random().toString()}
                      onPress={() => day?.value && toggleDay(day.value)}
                      style={[
                        styles.dayButton,
                        { backgroundColor: colors.bgCard, borderColor: colors.borderLight },
                        isDaySelected && { backgroundColor: colors.accentPrimary, borderColor: colors.accentPrimary },
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayButtonText,
                          { color: colors.textPrimary },
                          isDaySelected && { color: '#FFFFFF', fontWeight: '700' },
                        ]}
                      >
                        {day?.short ?? ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </Card>

        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Daily Reminder</Text>
          <TouchableOpacity
            onPress={() => setShowTimePicker(true)}
            style={[styles.reminderButton, { backgroundColor: colors.bgSecondary ?? '#F4EFE6', borderColor: colors.borderLight }]}
          >
            <Ionicons name="alarm-outline" size={22} color={colors.accentPrimary} style={{ marginTop: 2 }} />
            <View style={styles.reminderButtonContent}>
              <Text style={[styles.reminderButtonLabel, { color: colors.textPrimary }]}>Scheduled Time</Text>
              <Text style={[styles.reminderButtonValue, { color: reminderTime ? colors.accentPrimary : colors.textTertiary }]}>
                {reminderTime || 'None set'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} style={{ marginTop: 2 }} />
          </TouchableOpacity>
        </Card>

        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Daily Repetitions</Text>
          <View style={styles.goalRow}>
            <TouchableOpacity
              onPress={() => setGoal(Math.max(1, (goal ?? 1) - 1))}
              style={[styles.goalButton, { backgroundColor: colors.bgCard, borderColor: colors.borderLight }]}
            >
              <Ionicons name="remove" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.goalValue, { color: colors.textPrimary }]}>{goal ?? 1}</Text>
            <TouchableOpacity
              onPress={() => setGoal((goal ?? 1) + 1)}
              style={[styles.goalButton, { backgroundColor: colors.bgCard, borderColor: colors.borderLight }]}
            >
              <Ionicons name="add" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.goalLabel, { color: colors.textSecondary }]}>
              time{(goal ?? 1) !== 1 ? 's' : ''} per day
            </Text>
          </View>
        </Card>

        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Intention & Notes</Text>
          <TextInput
            style={[styles.textArea, { color: colors.textPrimary, borderColor: colors.borderLight, backgroundColor: colors.bgCard }]}
            placeholder="Why is this habit meaningful to you?..."
            value={notes}
            onChangeText={setNotes}
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={3}
            maxLength={500}
          />
        </Card>

        <View style={styles.buttonRow}>
          <View style={{ flex: 1 }}>
            <PrimaryButton
              onPress={handleSave}
              loading={loading}
              title={isEditing ? 'Save Changes' : 'Create Habit'}
              fullWidth
            />
          </View>
          {isEditing && (
            <TouchableOpacity
              onPress={handleDelete}
              style={[styles.deleteButton, { borderColor: colors.accentRose || '#EB697F' }]}
            >
              <Text style={[styles.deleteButtonText, { color: colors.accentRose || '#EB697F' }]}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {showIconPicker && (
        <View style={styles.modalOverlay} onTouchStart={() => setShowIconPicker(false)}>
          {renderIconPicker()}
        </View>
      )}

      {showColorPicker && (
        <View style={styles.modalOverlay} onTouchStart={() => setShowColorPicker(false)}>
          {renderColorPicker()}
        </View>
      )}

      {showTimePicker && (
        <View style={styles.modalOverlay} onTouchStart={() => setShowTimePicker(false)}>
          <View style={[styles.timePickerContainer, { backgroundColor: colors.bgCard, borderColor: colors.borderLight }]}>
            <Text style={[styles.pickerTitle, { color: colors.textPrimary }]}>Set Reminder Time</Text>
            <View style={styles.timePicker}>
              <Text style={[styles.timeDisplay, { color: colors.accentPrimary }]}>{reminderTime || '--:--'}</Text>
              <View style={styles.timeButtons}>
                {['06:00', '07:00', '08:00', '09:00', '12:00', '17:00', '18:00', '20:00', '21:00', '22:00'].map((t) => (
                  <TouchableOpacity
                    key={t}
                    onPress={() => {
                      setReminderTime(t);
                      setShowTimePicker(false);
                    }}
                    style={[
                      styles.timeButton,
                      { backgroundColor: colors.bgPrimary, borderColor: colors.borderLight },
                      reminderTime === t && { backgroundColor: colors.accentPrimary, borderColor: colors.accentPrimary },
                    ]}
                  >
                    <Text
                      style={[
                        styles.timeButtonText,
                        { color: colors.textPrimary },
                        reminderTime === t && { color: '#FFFFFF', fontWeight: '700' },
                      ]}
                    >
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                onPress={() => {
                  setReminderTime('');
                  setShowTimePicker(false);
                }}
                style={[styles.clearTimeButton, { borderColor: colors.borderLight }]}
              >
                <Text style={[styles.clearTimeButtonText, { color: colors.textSecondary }]}>Clear</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 110, gap: 16 },
  section: { gap: 10 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    fontSize: 17,
    fontWeight: '500',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  iconColorRow: { flexDirection: 'row', gap: 16, marginTop: 4 },
  iconPreview: { flex: 1, alignItems: 'center', gap: 6 },
  colorPreview: { flex: 1, alignItems: 'center', gap: 6 },
  iconPreviewCircle: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorPreviewCircle: {
    width: 60,
    height: 60,
    borderRadius: 20,
  },
  iconPreviewLabel: { fontSize: 13, fontWeight: '500' },
  frequencyOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 6,
    gap: 12,
  },
  frequencyOptionContent: { gap: 3, flex: 1 },
  frequencyLabel: { fontSize: 15, fontWeight: '600', lineHeight: 22 },
  frequencyDesc: { fontSize: 12, lineHeight: 16 },
  dayPicker: { marginTop: 10, gap: 8 },
  dayPickerLabel: { fontSize: 12, fontWeight: '500' },
  dayButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButtonText: { fontSize: 14, fontWeight: '600' },
  reminderButton: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  reminderButtonContent: { flex: 1, gap: 2 },
  reminderButtonLabel: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  reminderButtonValue: { fontSize: 13, lineHeight: 18 },
  goalRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  goalButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalValue: { fontSize: 20, fontWeight: '700' },
  goalLabel: { fontSize: 14 },
  textArea: {
    fontSize: 14,
    lineHeight: 20,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  deleteButton: {
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: { fontSize: 15, fontWeight: '600' },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerContainer: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
    gap: 16,
  },
  pickerTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  iconScroll: { gap: 12, paddingVertical: 4 },
  iconOption: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorCircle: { width: 32, height: 32, borderRadius: 16 },
  timePickerContainer: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    width: '100%',
    gap: 16,
  },
  timePicker: { gap: 14 },
  timeDisplay: { fontSize: 36, fontWeight: '700', textAlign: 'center' },
  timeButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  timeButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  timeButtonText: { fontSize: 14, fontWeight: '600' },
  clearTimeButton: {
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 6,
  },
  clearTimeButtonText: { fontSize: 14, fontWeight: '600' },
});