import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Keyboard } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { habitRepository } from '../../database/repositories/habitRepository';
import Habit from '../../database/models/Habit';
import { getIconName } from '../../utils/iconMap';
import { Card } from '../../components/Card';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Ionicons } from '@expo/vector-icons';

type NavigationProp = NativeStackScreenProps<RootStackParamList, 'HabitForm'>['navigation'];
type RouteProp = NativeStackScreenProps<RootStackParamList, 'HabitForm'>['route'];

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily', description: 'Every day' },
  { value: 'weekdays', label: 'Weekdays', description: 'Mon–Fri only' },
  { value: 'custom', label: 'Custom days', description: 'Choose specific days' },
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
  '#8FBC8F', '#B19CD9', '#A8D0E6', '#F5C6A5', '#F5A9A9', '#9FD8A8',
  '#D8A8E8', '#A8D8E8', '#F5D8A8', '#E8A8D8', '#A8E8D8', '#E8D8A8',
];

export function HabitFormScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp>();
  // Create-flow navigates with no params at all — `route.params` is undefined
  // then, and destructuring it threw (release grey screen). Default to {}.
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
        setName(habit.name);
        setIcon(habit.icon);
        setColor(habit.color);
        setFrequency(habit.frequency as 'daily' | 'weekdays' | 'custom');
        setCustomDays(JSON.parse(habit.customDays || '[]'));
        setReminderTime(habit.reminderTime || '');
        setGoal(habit.goal);
        setNotes(habit.notes || '');
      }
    } catch (error) {
      console.error('Failed to load habit:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadHabit();
  }, [loadHabit]);

  const validate = (): boolean => {
    if (!name.trim()) {
      Alert.alert('Missing name', 'Please enter a habit name');
      return false;
    }
    if (frequency === 'custom' && customDays.length === 0) {
      Alert.alert('Select days', 'Please choose at least one day for custom frequency');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const data = {
        name: name.trim(),
        icon,
        color,
        frequency,
        customDays: frequency === 'custom' ? customDays : [],
        reminderTime,
        goal,
        notes: notes.trim(),
      };

      if (isEditing) {
        await habitRepository.update(id, data);
      } else {
        await habitRepository.create(data);
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
    setCustomDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const renderIconPicker = () => (
    <View style={styles.pickerContainer}>
      <Text style={styles.pickerTitle}>Choose Icon</Text>
      <ScrollView horizontal style={styles.iconScroll} showsHorizontalScrollIndicator={false}>
        {ICONS.map((i) => (
          <TouchableOpacity
            key={i}
            onPress={() => {
              setIcon(i);
              setShowIconPicker(false);
            }}
            style={[
              styles.iconOption,
              icon === i && styles.iconOptionSelected,
            ]}
          >
            <Ionicons name={getIconName(i)} size={28} color={icon === i ? 'white' : '#1E232E'} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderColorPicker = () => (
    <View style={styles.pickerContainer}>
      <Text style={styles.pickerTitle}>Choose Color</Text>
      <View style={styles.colorGrid}>
        {COLORS.map((c) => (
          <TouchableOpacity
            key={c}
            onPress={() => {
              setColor(c);
              setShowColorPicker(false);
            }}
            style={[
              styles.colorOption,
              color === c && styles.colorOptionSelected,
            ]}
          >
            <View style={[styles.colorCircle, { backgroundColor: c }]} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        onTouchStart={() => Keyboard.dismiss()}
      >
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Info</Text>
          <TextInput
            style={styles.input}
            placeholder="Habit name (e.g., Morning walk)"
            value={name}
            onChangeText={setName}
            placeholderTextColor="#425474"
            autoCapitalize="words"
            maxLength={50}
          />
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Icon & Color</Text>
          <View style={styles.iconColorRow}>
            <TouchableOpacity onPress={() => setShowIconPicker(true)} style={styles.iconPreview}>
              <View style={[styles.iconPreviewCircle, { backgroundColor: color }]}>
                <Ionicons name={getIconName(icon)} size={28} color="white" />
              </View>
              <Text style={styles.iconPreviewLabel}>Icon</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowColorPicker(true)} style={styles.colorPreview}>
              <View style={[styles.colorPreviewCircle, { backgroundColor: color }]} />
              <Text style={styles.iconPreviewLabel}>Color</Text>
            </TouchableOpacity>
          </View>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Frequency</Text>
          {FREQUENCY_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => setFrequency(opt.value)}
              style={[
                styles.frequencyOption,
                frequency === opt.value && styles.frequencyOptionSelected,
              ]}
            >
              <View style={styles.frequencyOptionContent}>
                <Text style={[
                  styles.frequencyLabel,
                  frequency === opt.value && styles.frequencyLabelSelected,
                ]}>
                  {opt.label}
                </Text>
                <Text style={[
                  styles.frequencyDesc,
                  frequency === opt.value && styles.frequencyDescSelected,
                ]}>
                  {opt.description}
                </Text>
              </View>
              <Ionicons
                name={frequency === opt.value ? 'checkmark-circle' : 'circle-outline'}
                size={24}
                color={frequency === opt.value ? '#5A955A' : '#425474'}
              />
            </TouchableOpacity>
          ))}

          {frequency === 'custom' && (
            <View style={styles.dayPicker}>
              <Text style={styles.dayPickerLabel}>Select days</Text>
              <View style={styles.dayButtons}>
                {DAYS.map((day) => (
                  <TouchableOpacity
                    key={day.value}
                    onPress={() => toggleDay(day.value)}
                    style={[
                      styles.dayButton,
                      customDays.includes(day.value) && styles.dayButtonSelected,
                    ]}
                  >
                    <Text style={[
                      styles.dayButtonText,
                      customDays.includes(day.value) && styles.dayButtonTextSelected,
                    ]}>
                      {day.short}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Reminder</Text>
          <TouchableOpacity onPress={() => setShowTimePicker(true)} style={styles.reminderButton}>
            <Ionicons name="alarm-outline" size={22} color="#5A955A" />
            <View style={styles.reminderButtonContent}>
              <Text style={styles.reminderButtonLabel}>Reminder time</Text>
              <Text style={styles.reminderButtonValue}>
                {reminderTime || 'Not set'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#425474" />
          </TouchableOpacity>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Goal</Text>
          <View style={styles.goalRow}>
            <TouchableOpacity onPress={() => setGoal(Math.max(1, goal - 1))} style={styles.goalButton}>
              <Ionicons name="remove" size={24} color="#1E232E" />
            </TouchableOpacity>
            <Text style={styles.goalValue}>{goal}</Text>
            <TouchableOpacity onPress={() => setGoal(goal + 1)} style={styles.goalButton}>
              <Ionicons name="add" size={24} color="#1E232E" />
            </TouchableOpacity>
            <Text style={styles.goalLabel}>time{goal !== 1 ? 's' : ''} per day</Text>
          </View>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Notes (optional)</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Any notes, motivation, or context..."
            value={notes}
            onChangeText={setNotes}
            placeholderTextColor="#425474"
            multiline
            numberOfLines={4}
            maxLength={500}
          />
        </Card>

        <View style={styles.buttonRow}>
          <PrimaryButton
              onPress={handleSave}
              loading={loading}
              title={isEditing ? 'Save Changes' : 'Create Habit'}
              style={styles.saveButton}
            />
          {isEditing && (
            <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
              <Text style={styles.deleteButtonText}>Delete Habit</Text>
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
          <View style={styles.timePickerContainer}>
            <Text style={styles.pickerTitle}>Set Reminder Time</Text>
            <View style={styles.timePicker}>
              <Text style={styles.timeDisplay}>{reminderTime || '--:--'}</Text>
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
                      reminderTime === t && styles.timeButtonSelected,
                    ]}
                  >
                    <Text style={[
                      styles.timeButtonText,
                      reminderTime === t && styles.timeButtonTextSelected,
                    ]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity onPress={() => { setReminderTime(''); setShowTimePicker(false); }} style={styles.clearTimeButton}>
                <Text style={styles.clearTimeButtonText}>Clear</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFBF7',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
    gap: 16,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34415A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    fontSize: 17,
    color: '#1E232E',
    minHeight: 44,
  },
  iconColorRow: {
    flexDirection: 'row',
    gap: 12,
  },
  iconPreview: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E4DEBC',
  },
  iconPreviewCircle: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorPreview: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E4DEBC',
  },
  colorPreviewCircle: {
    width: 56,
    height: 56,
    borderRadius: 18,
  },
  iconPreviewLabel: {
    fontSize: 13,
    color: '#425474',
  },
  frequencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4DEBC',
    backgroundColor: '#FFFFFF',
  },
  frequencyOptionSelected: {
    borderColor: '#5A955A',
    backgroundColor: 'rgba(143, 188, 143, 0.1)',
  },
  frequencyOptionContent: {
    flex: 1,
    gap: 2,
  },
  frequencyLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E232E',
  },
  frequencyLabelSelected: {
    color: '#5A955A',
  },
  frequencyDesc: {
    fontSize: 13,
    color: '#425474',
  },
  frequencyDescSelected: {
    color: '#5A955A',
  },
  dayPicker: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E4DEBC',
    gap: 10,
  },
  dayPickerLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#34415A',
  },
  dayButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4DEBC',
  },
  dayButtonSelected: {
    backgroundColor: '#5A955A',
    borderColor: '#5A955A',
  },
  dayButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#34415A',
  },
  dayButtonTextSelected: {
    color: 'white',
  },
  reminderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  reminderButtonContent: {
    flex: 1,
    gap: 2,
  },
  reminderButtonLabel: {
    fontSize: 16,
    color: '#1E232E',
  },
  reminderButtonValue: {
    fontSize: 14,
    color: '#425474',
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  goalButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4DEBC',
  },
  goalValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1E232E',
    minWidth: 60,
    textAlign: 'center',
  },
  goalLabel: {
    fontSize: 15,
    color: '#425474',
  },
  textArea: {
    fontSize: 16,
    color: '#1E232E',
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  saveButton: {
    flex: 1,
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#F5A9A9',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F5A9A9',
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    margin: 20,
    maxHeight: '80%',
    gap: 16,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E232E',
    textAlign: 'center',
  },
  iconScroll: {
    gap: 10,
    paddingVertical: 4,
  },
  iconOption: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FDFBF7',
    borderWidth: 1,
    borderColor: '#E4DEBC',
  },
  iconOptionSelected: {
    backgroundColor: '#5A955A',
    borderColor: '#5A955A',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#5A955A',
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timePickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
    gap: 16,
  },
  timePicker: {
    gap: 12,
  },
  timeDisplay: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1E232E',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  timeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  timeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#FDFBF7',
    borderWidth: 1,
    borderColor: '#E4DEBC',
  },
  timeButtonSelected: {
    backgroundColor: '#5A955A',
    borderColor: '#5A955A',
  },
  timeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E232E',
    fontFamily: 'monospace',
  },
  timeButtonTextSelected: {
    color: 'white',
  },
  clearTimeButton: {
    alignSelf: 'center',
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E4DEBC',
  },
  clearTimeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34415A',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 100,
    color: '#425474',
  },
});