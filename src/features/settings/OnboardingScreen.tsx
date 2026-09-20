import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, TextInput, Keyboard } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/Card';
import { PrimaryButton } from '../../components/PrimaryButton';
import { settingsRepository } from '../../database/repositories/settingsRepository';
import { habitRepository } from '../../database/repositories/habitRepository';
import { getIconName } from '../../utils/iconMap';

type NavigationProp = NativeStackScreenProps<RootStackParamList, 'Onboarding'>['navigation'];

const GOALS = [
  { id: 'reduce_stress', label: 'Reduce stress & anxiety', icon: 'leaf', color: '#5A955A' },
  { id: 'better_sleep', label: 'Improve sleep', icon: 'moon', color: '#6B9BCD' },
  { id: 'build_habits', label: 'Build healthy habits', icon: 'checkbox', color: '#877FC5' },
  { id: 'self_awareness', label: 'Increase self-awareness', icon: 'person', color: '#EB876D' },
  { id: 'gratitude', label: 'Practice gratitude', icon: 'heart', color: '#EB697F' },
  { id: 'emotional_regulation', label: 'Emotional regulation', icon: 'meditation', color: '#74AC74' },
];

const TIME_OPTIONS = [
  { id: 'morning', label: 'Morning person', emoji: '🌅', description: 'Most energetic in the AM' },
  { id: 'afternoon', label: 'Afternoon peak', emoji: '☀️', description: 'Best energy mid-day' },
  { id: 'evening', label: 'Night owl', emoji: '🌙', description: 'Most creative at night' },
];

const STARTER_HABITS = [
  { id: 'water', name: 'Drink water', icon: 'water', color: '#6B9BCD', frequency: 'daily', goal: 8, reminder: '09:00' },
  { id: 'breathing', name: '2-min breathing', icon: 'meditation', color: '#877FC5', frequency: 'daily', goal: 1, reminder: '08:30' },
  { id: 'walk', name: 'Short walk', icon: 'walk', color: '#5A955A', frequency: 'daily', goal: 1, reminder: '12:00' },
  { id: 'gratitude', name: 'Write 3 gratitudes', icon: 'heart', color: '#EB697F', frequency: 'daily', goal: 1, reminder: '20:00' },
  { id: 'stretch', name: 'Stretch', icon: 'body', color: '#EB876D', frequency: 'daily', goal: 1, reminder: '07:00' },
  { id: 'journal', name: 'Journal 5 min', icon: 'book', color: '#74AC74', frequency: 'daily', goal: 1, reminder: '21:00' },
];

export function OnboardingScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [step, setStep] = useState(0);
  const [goals, setGoals] = useState<string[]>([]);
  const [timeOfDay, setTimeOfDay] = useState<string>('');
  const [selectedHabits, setSelectedHabits] = useState<string[]>([]);
  const [name, setName] = useState('');

  const STEPS = [
    { title: 'Welcome to Calmly', subtitle: 'Your private space for reflection, calm, and growth' },
    { title: 'What brings you here?', subtitle: 'Select all that apply' },
    { title: 'When are you at your best?', subtitle: 'This helps us time your reminders' },
    { title: 'Start with tiny habits', subtitle: 'Pick 2-3 to begin. You can always add more later' },
    { title: 'What should we call you?', subtitle: 'Used for personalized greetings (optional)' },
    { title: 'Privacy First', subtitle: 'Your data never leaves your device' },
  ];

  const handleNext = useCallback(async () => {
    if (step === 1 && goals.length === 0) {
      Alert.alert('Select at least one goal', 'Choose what matters most to you');
      return;
    }
    if (step === 2 && !timeOfDay) {
      Alert.alert('Select your peak time', 'This helps us schedule reminders');
      return;
    }
    if (step === 3 && selectedHabits.length === 0) {
      Alert.alert('Pick at least one habit', 'Start small — even one habit makes a difference');
      return;
    }
    if (step === 5) {
      await completeOnboarding();
      return;
    }
    setStep(step + 1);
  }, [step, goals, timeOfDay, selectedHabits]);

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const toggleGoal = (goalId: string) => {
    setGoals(prev => prev.includes(goalId) ? prev.filter(g => g !== goalId) : [...prev, goalId]);
  };

  const toggleHabit = (habitId: string) => {
    setSelectedHabits(prev => prev.includes(habitId) ? prev.filter(h => h !== habitId) : [...prev, habitId]);
  };

  const completeOnboarding = async () => {
    try {
      await settingsRepository.updateSettings({ onboardingComplete: true, userName: name });
      
      const starterHabits = STARTER_HABITS.filter(h => selectedHabits.includes(h.id));
      for (const habit of starterHabits) {
        await habitRepository.create({
          name: habit.name,
          icon: habit.icon,
          color: habit.color,
          frequency: habit.frequency as any,
          customDays: [],
          reminderTime: habit.reminder,
          goal: habit.goal,
          notes: '',
        });
      }

      // navigate (not replace): replace only acts on the current navigator and
      // throws when Onboarding is hosted by SettingsStack, while navigate
      // bubbles up to the root stack where 'App' always exists.
      (navigation as any).navigate('App');
    } catch (error) {
      console.error('Onboarding failed:', error);
      Alert.alert('Error', 'Failed to complete setup. Please try again.');
    }
  };

  const progress = (step + 1) / STEPS.length;

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View style={styles.welcomeStep}>
            <Ionicons name="leaf" size={80} color="#5A955A" />
            <Text style={styles.welcomeTitle}>Welcome to Calmly</Text>
            <Text style={styles.welcomeText}>
              A private, offline-first space for mood tracking, journaling, 
              breathing exercises, and habit building. No accounts, no cloud, 
              just you and your thoughts.
            </Text>
            <View style={styles.features}>
              {[
                { icon: 'happy', text: 'Mood check-ins with depth' },
                { icon: 'book', text: 'Guided & free journaling' },
                { icon: 'meditation', text: 'Breathing & grounding exercises' },
                { icon: 'checkbox', text: 'Habits & routines' },
                { icon: 'sparkles', text: 'Gratitude & affirmations' },
                { icon: 'lock-closed', text: '100% private & offline' },
              ].map((f, i) => (
                <View key={i} style={styles.featureItem}>
                  <Ionicons name={getIconName(f.icon)} size={20} color="#5A955A" />
                  <Text style={styles.featureText}>{f.text}</Text>
                </View>
              ))}
            </View>
          </View>
        );
      case 1:
        return (
          <View style={styles.selectionStep}>
            <Text style={styles.stepQuestion}>What brings you here?</Text>
            <Text style={styles.stepHint}>Select all that apply</Text>
            <View style={styles.goalGrid}>
              {GOALS.map((goal) => (
                <TouchableOpacity
                  key={goal.id}
                  onPress={() => toggleGoal(goal.id)}
                  style={[
                    styles.goalCard,
                    goals.includes(goal.id) && styles.goalCardSelected,
                  ]}
                  activeOpacity={0.8}
                >
                  <View style={[styles.goalIcon, { backgroundColor: goal.color + '20' }]}>
                    <Ionicons name={getIconName(goal.icon)} size={24} color={goal.color} />
                  </View>
                  <Text style={[
                    styles.goalLabel,
                    goals.includes(goal.id) && styles.goalLabelSelected,
                  ]}>
                    {goal.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      case 2:
        return (
          <View style={styles.selectionStep}>
            <Text style={styles.stepQuestion}>When are you at your best?</Text>
            <Text style={styles.stepHint}>This helps us time your reminders</Text>
            <View style={styles.timeOptions}>
              {TIME_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  onPress={() => setTimeOfDay(option.id)}
                  style={[
                    styles.timeOption,
                    timeOfDay === option.id && styles.timeOptionSelected,
                  ]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.timeEmoji}>{option.emoji}</Text>
                  <View style={styles.timeInfo}>
                    <Text style={[
                      styles.timeLabel,
                      timeOfDay === option.id && styles.timeLabelSelected,
                    ]}>
                      {option.label}
                    </Text>
                    <Text style={[
                      styles.timeDesc,
                      timeOfDay === option.id && styles.timeDescSelected,
                    ]}>
                      {option.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      case 3:
        return (
          <View style={styles.selectionStep}>
            <Text style={styles.stepQuestion}>Start with tiny habits</Text>
            <Text style={styles.stepHint}>Pick 2-3 to begin. You can always add more later</Text>
            <View style={styles.habitGrid}>
              {STARTER_HABITS.map((habit) => (
                <TouchableOpacity
                  key={habit.id}
                  onPress={() => toggleHabit(habit.id)}
                  style={[
                    styles.habitCard,
                    selectedHabits.includes(habit.id) && styles.habitCardSelected,
                  ]}
                  activeOpacity={0.8}
                >
                  <View style={[styles.habitIcon, { backgroundColor: habit.color + '20' }]}>
                    <Ionicons name={getIconName(habit.icon)} size={22} color={habit.color} />
                  </View>
                  <View style={styles.habitInfo}>
                    <Text style={[
                      styles.habitName,
                      selectedHabits.includes(habit.id) && styles.habitNameSelected,
                    ]}>
                      {habit.name}
                    </Text>
                    <Text style={styles.habitReminder}>
                      Reminder: {habit.reminder}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      case 4:
        return (
          <View style={styles.inputStep}>
            <Text style={styles.stepQuestion}>What should we call you?</Text>
            <Text style={styles.stepHint}>Used for personalized greetings (optional)</Text>
            <TextInput
              style={styles.nameInput}
              placeholder="Your name"
              value={name}
              onChangeText={setName}
              placeholderTextColor="#425474"
              autoCapitalize="words"
              autoFocus
              maxLength={30}
            />
          </View>
        );
      case 5:
        return (
          <View style={styles.privacyStep}>
            <Ionicons name="lock-closed" size={80} color="#5A955A" />
            <Text style={styles.welcomeTitle}>Your Privacy Matters</Text>
            <View style={styles.privacyPoints}>
              {[
                'All data stays on your device — no cloud, no accounts',
                'Biometric/PIN lock available for extra privacy',
                'Hide content in app switcher previews',
                'Export or delete all data anytime',
                'No analytics, no tracking, no ads',
              ].map((point, i) => (
                <View key={i} style={styles.privacyItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#5A955A" />
                  <Text style={styles.privacyText}>{point}</Text>
                </View>
              ))}
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>
      <Text style={styles.progressText}>Step {step + 1} of {STEPS.length}</Text>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {renderStep()}
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity onPress={handleBack} disabled={step === 0} style={styles.backButton}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <PrimaryButton
          onPress={handleNext}
          title={step === STEPS.length - 1 ? 'Begin Journey' : 'Continue'}
          style={styles.nextButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFBF7' },
  progressBar: { height: 4, backgroundColor: '#E4DEBC', marginHorizontal: 20, marginTop: 10, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#5A955A', borderRadius: 2 },
  progressText: { textAlign: 'center', fontSize: 13, color: '#425474', marginTop: 8 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100, flexGrow: 1 },
  welcomeStep: { alignItems: 'center', gap: 20, paddingVertical: 20 },
  welcomeTitle: { fontSize: 28, fontWeight: '700', color: '#1E232E', textAlign: 'center' },
  welcomeText: { fontSize: 16, color: '#34415A', textAlign: 'center', lineHeight: 24, paddingHorizontal: 20 },
  features: { width: '100%', gap: 10, marginTop: 10 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  featureText: { fontSize: 15, color: '#1E232E' },
  selectionStep: { gap: 16 },
  inputStep: { gap: 16, paddingTop: 20 },
  privacyStep: { alignItems: 'center', gap: 20, paddingVertical: 20 },
  stepQuestion: { fontSize: 22, fontWeight: '700', color: '#1E232E', textAlign: 'center' },
  stepHint: { fontSize: 15, color: '#425474', textAlign: 'center' },
  goalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  goalCard: { width: '45%', aspectRatio: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E4DEBC' },
  goalCardSelected: { borderColor: '#5A955A', backgroundColor: 'rgba(143, 188, 143, 0.1)' },
  goalIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  goalLabel: { fontSize: 14, fontWeight: '500', color: '#1E232E', textAlign: 'center' },
  goalLabelSelected: { color: '#5A955A' },
  timeOptions: { gap: 10 },
  timeOption: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E4DEBC' },
  timeOptionSelected: { borderColor: '#5A955A', backgroundColor: 'rgba(143, 188, 143, 0.1)' },
  timeEmoji: { fontSize: 32 },
  timeInfo: { flex: 1, gap: 2 },
  timeLabel: { fontSize: 16, fontWeight: '600', color: '#1E232E' },
  timeLabelSelected: { color: '#5A955A' },
  timeDesc: { fontSize: 13, color: '#425474' },
  timeDescSelected: { color: '#5A955A' },
  habitGrid: { gap: 10 },
  habitCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E4DEBC' },
  habitCardSelected: { borderColor: '#5A955A', backgroundColor: 'rgba(143, 188, 143, 0.1)' },
  habitIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  habitInfo: { flex: 1, gap: 2 },
  habitName: { fontSize: 16, fontWeight: '500', color: '#1E232E' },
  habitNameSelected: { color: '#5A955A' },
  habitReminder: { fontSize: 12, color: '#425474' },
  inputStep: { gap: 16 },
  nameInput: { fontSize: 24, fontWeight: '500', color: '#1E232E', textAlign: 'center', paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: '#5A955A', marginHorizontal: 20 },
  privacyPoints: { width: '100%', gap: 12, marginTop: 16 },
  privacyItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  privacyText: { fontSize: 15, color: '#1E232E', lineHeight: 22, flex: 1 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingBottom: 20, paddingTop: 12, backgroundColor: '#FDFBF7', borderTopWidth: 1, borderTopColor: '#E4DEBC', flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  backButton: { flex: 1, paddingVertical: 14, borderRadius: 16, alignItems: 'center', backgroundColor: 'transparent', borderWidth: 1, borderColor: '#E4DEBC' },
  backButtonText: { fontSize: 16, fontWeight: '600', color: '#34415A' },
  nextButton: { flex: 2, minHeight: 56 },
});