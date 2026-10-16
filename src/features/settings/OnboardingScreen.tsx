import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton } from '../../components/PrimaryButton';
import { AppIcon } from '../../components/AppIcon';
import type { AppIconName } from '../../components/AppIcon';
import { settingsRepository } from '../../database/repositories/settingsRepository';
import { habitRepository } from '../../database/repositories/habitRepository';
import { useThemeColors } from '../../theme/ThemeContext';
import { ScreenContainer } from '../../components/layout/ScreenContainer';

type NavigationProp = NativeStackScreenProps<RootStackParamList, 'Onboarding'>['navigation'];

const GOALS = [
  { id: 'reduce_stress', label: 'Reduce stress & anxiety', icon: 'leaf-outline', color: '#5A955A' },
  { id: 'better_sleep', label: 'Improve restful sleep', icon: 'moon-outline', color: '#6B9BCD' },
  { id: 'build_habits', label: 'Build positive daily habits', icon: 'checkbox-outline', color: '#877FC5' },
  { id: 'self_awareness', label: 'Increase self-awareness', icon: 'sparkles-outline', color: '#EB876D' },
  { id: 'gratitude', label: 'Practice everyday gratitude', icon: 'heart-outline', color: '#EB697F' },
  { id: 'emotional_regulation', label: 'Calm & emotional balance', icon: 'flower-outline', color: '#4EA5A5' },
];

const TIME_OPTIONS: { id: string; label: string; icon: AppIconName; description: string }[] = [
  { id: 'morning', label: 'Morning presence', icon: 'i-sun', description: 'Begin the day centered' },
  { id: 'afternoon', label: 'Afternoon pause', icon: 'i-flash', description: 'Midday grounding reset' },
  { id: 'evening', label: 'Evening unwind', icon: 'i-moon', description: 'Wind down with reflection' },
];

const STARTER_HABITS = [
  { id: 'water', name: 'Hydrate with intention', icon: 'water-outline', color: '#6B9BCD', frequency: 'daily', goal: 8, reminder: '09:00' },
  { id: 'breathing', name: '2-min mindful breath', icon: 'flower-outline', color: '#877FC5', frequency: 'daily', goal: 1, reminder: '08:30' },
  { id: 'walk', name: 'Gentle walk outdoors', icon: 'walk-outline', color: '#5A955A', frequency: 'daily', goal: 1, reminder: '12:00' },
  { id: 'gratitude', name: 'Note 3 gratitudes', icon: 'heart-outline', color: '#EB697F', frequency: 'daily', goal: 1, reminder: '20:00' },
  { id: 'stretch', name: 'Mindful body stretch', icon: 'body-outline', color: '#EB876D', frequency: 'daily', goal: 1, reminder: '07:00' },
  { id: 'journal', name: 'Evening reflection', icon: 'book-outline', color: '#4EA5A5', frequency: 'daily', goal: 1, reminder: '21:00' },
];

export function OnboardingScreen() {
  const navigation = useNavigation<NavigationProp>();
  const colors = useThemeColors();
  const [step, setStep] = useState(0);
  const [goals, setGoals] = useState<string[]>([]);
  const [timeOfDay, setTimeOfDay] = useState<string>('');
  const [selectedHabits, setSelectedHabits] = useState<string[]>([]);
  const [name, setName] = useState('');

  const STEPS = [
    { title: 'Welcome to Calmly', subtitle: 'A private offline sanctuary for mental peace and mindfulness' },
    { title: 'What brings you here?', subtitle: 'Select what matters most to you right now' },
    { title: 'When do you prefer to check in?', subtitle: 'Helps tailor gentle, non-intrusive reminders' },
    { title: 'Start with tiny habits', subtitle: 'Choose 1-3 to begin nurturing your rhythm' },
    { title: 'What shall we call you?', subtitle: 'Used for gentle greeting on your home screen' },
    { title: '100% Privacy by Design', subtitle: 'Your thoughts never leave this device' },
  ];

  const completeOnboarding = async () => {
    try {
      await settingsRepository.updateSettings({ onboardingComplete: true, userName: name ?? '' });

      const starterHabits = (STARTER_HABITS ?? []).filter((h) => (selectedHabits ?? []).includes(h?.id));
      for (const habit of starterHabits ?? []) {
        await habitRepository.create({
          name: habit?.name ?? '',
          icon: habit?.icon ?? 'checkbox',
          color: habit?.color ?? '#5A955A',
          frequency: (habit?.frequency ?? 'daily') as any,
          goal: habit?.goal ?? 1,
          reminderTime: habit?.reminder,
        });
      }
      (navigation as any)?.replace?.('Main');
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      Alert.alert('Error', 'Failed to save onboarding setup.');
    }
  };

  const handleNext = useCallback(async () => {
    if (step === 1 && (goals ?? []).length === 0) {
      Alert.alert('Select at least one focus', 'Choose an intention to personalize your journey');
      return;
    }
    if (step === 2 && !timeOfDay) {
      Alert.alert('Select your check-in time', 'Choose your preferred rhythm');
      return;
    }
    if (step === 3 && (selectedHabits ?? []).length === 0) {
      Alert.alert('Pick at least one habit', 'Start small — consistency builds peace');
      return;
    }
    if (step === 5) {
      await completeOnboarding();
      return;
    }
    setStep(step + 1);
  }, [step, goals, timeOfDay, selectedHabits, name]);

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const toggleGoal = (goalId: string) => {
    setGoals((prev) =>
      (prev ?? []).includes(goalId) ? (prev ?? []).filter((g) => g !== goalId) : [...(prev ?? []), goalId]
    );
  };

  const toggleHabit = (habitId: string) => {
    setSelectedHabits((prev) =>
      (prev ?? []).includes(habitId) ? (prev ?? []).filter((h) => h !== habitId) : [...(prev ?? []), habitId]
    );
  };

  const progress = (step + 1) / STEPS.length;

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View style={styles.welcomeStep}>
            <View style={[styles.welcomeIconWrap, { backgroundColor: colors.accentPrimary + '18' }]}>
              <AppIcon name="i-leaf" size={48} color={colors.accentPrimary} />
            </View>
            <Text style={[styles.welcomeTitle, { color: colors.textPrimary }]}>Welcome to Calmly</Text>
            <Text style={[styles.welcomeText, { color: colors.textSecondary }]}>
              An offline-first, private sanctuary crafted for genuine presence, emotional balance, and mindful living.
            </Text>
            <View style={styles.features}>
              {[
                { icon: 'shield-checkmark-outline', text: '100% Offline & Private — zero trackers, zero cloud accounts' },
                { icon: 'journal-outline', text: 'Thoughtful Prompts & CBT cognitive reframing' },
                { icon: 'flower-outline', text: 'Guided somatic breathing & sensory grounding' },
              ].map((feat, i) => (
                <View key={i} style={styles.featureItem}>
                  <Ionicons name={feat.icon as any} size={22} color={colors.accentPrimary} style={{ marginTop: 2 }} />
                  <Text style={[styles.featureText, { color: colors.textPrimary }]}>{feat.text}</Text>
                </View>
              ))}
            </View>
          </View>
        );
      case 1:
        return (
          <View style={styles.selectionStep}>
            <Text style={[styles.stepQuestion, { color: colors.textPrimary }]}>What brings you here?</Text>
            <Text style={[styles.stepHint, { color: colors.textSecondary }]}>Select all that resonate with you</Text>
            <View style={styles.goalGrid}>
              {GOALS.map((g) => {
                const isSelected = (goals ?? []).includes(g.id);
                return (
                  <TouchableOpacity
                    key={g.id}
                    onPress={() => toggleGoal(g.id)}
                    style={[
                      styles.goalCard,
                      { backgroundColor: colors.bgCard, borderColor: colors.borderLight },
                      isSelected && { borderColor: g.color, backgroundColor: g.color + '14', borderWidth: 2 },
                    ]}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.goalIcon, { backgroundColor: g.color + '20' }]}>
                      <Ionicons name={g.icon as any} size={24} color={g.color} />
                    </View>
                    <Text
                      style={[
                        styles.goalLabel,
                        { color: colors.textPrimary },
                        isSelected && { color: g.color, fontWeight: '700' },
                      ]}
                    >
                      {g.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );
      case 2:
        return (
          <View style={styles.selectionStep}>
            <Text style={[styles.stepQuestion, { color: colors.textPrimary }]}>When do you prefer to check in?</Text>
            <Text style={[styles.stepHint, { color: colors.textSecondary }]}>We tailor mindful invitations to your preferred rhythm</Text>
            <View style={styles.timeOptions}>
              {TIME_OPTIONS.map((t) => {
                const isSelected = timeOfDay === t.id;
                return (
                  <TouchableOpacity
                    key={t.id}
                    onPress={() => setTimeOfDay(t.id)}
                    style={[
                      styles.timeOption,
                      { backgroundColor: colors.bgCard, borderColor: colors.borderLight },
                      isSelected && { borderColor: colors.accentPrimary, backgroundColor: colors.accentPrimary + '14', borderWidth: 2 },
                    ]}
                    activeOpacity={0.75}
                  >
                    <AppIcon name={t.icon} size={32} color={isSelected ? colors.accentPrimary : undefined} />
                    <View style={styles.timeInfo}>
                      <Text
                        style={[
                          styles.timeLabel,
                          { color: colors.textPrimary },
                          isSelected && { color: colors.accentPrimary, fontWeight: '700' },
                        ]}
                      >
                        {t.label}
                      </Text>
                      <Text style={[styles.timeDesc, { color: colors.textTertiary }]}>{t.description}</Text>
                    </View>
                    <Ionicons
                      name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                      size={22}
                      color={isSelected ? colors.accentPrimary : colors.textTertiary}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );
      case 3:
        return (
          <View style={styles.selectionStep}>
            <Text style={[styles.stepQuestion, { color: colors.textPrimary }]}>Start with tiny habits</Text>
            <Text style={[styles.stepHint, { color: colors.textSecondary }]}>Pick 1-3 tiny rituals to start gentle momentum</Text>
            <View style={styles.habitGrid}>
              {STARTER_HABITS.map((h) => {
                const isSelected = (selectedHabits ?? []).includes(h.id);
                return (
                  <TouchableOpacity
                    key={h.id}
                    onPress={() => toggleHabit(h.id)}
                    style={[
                      styles.habitCard,
                      { backgroundColor: colors.bgCard, borderColor: colors.borderLight },
                      isSelected && { borderColor: h.color, backgroundColor: h.color + '14', borderWidth: 2 },
                    ]}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.habitIcon, { backgroundColor: h.color + '20' }]}>
                      <Ionicons name={h.icon as any} size={22} color={h.color} />
                    </View>
                    <View style={styles.habitInfo}>
                      <Text
                        style={[
                          styles.habitName,
                          { color: colors.textPrimary },
                          isSelected && { color: h.color, fontWeight: '700' },
                        ]}
                      >
                        {h.name}
                      </Text>
                      <Text style={[styles.habitReminder, { color: colors.textTertiary }]}>{h.reminder}</Text>
                    </View>
                    <Ionicons
                      name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                      size={22}
                      color={isSelected ? h.color : colors.textTertiary}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );
      case 4:
        return (
          <View style={styles.inputStep}>
            <Text style={[styles.stepQuestion, { color: colors.textPrimary }]}>What should we call you?</Text>
            <Text style={[styles.stepHint, { color: colors.textSecondary }]}>Used for a warm, personalized greeting</Text>
            <TextInput
              style={[
                styles.nameInput,
                { color: colors.textPrimary, borderBottomColor: colors.accentPrimary },
              ]}
              placeholder="Your name"
              value={name}
              onChangeText={setName}
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="words"
              autoFocus
              maxLength={30}
            />
          </View>
        );
      case 5:
        return (
          <View style={styles.privacyStep}>
            <View style={[styles.welcomeIconWrap, { backgroundColor: colors.accentPrimary + '18' }]}>
              <Ionicons name="shield-checkmark" size={48} color={colors.accentPrimary} />
            </View>
            <Text style={[styles.welcomeTitle, { color: colors.textPrimary }]}>Privacy First & Always</Text>
            <View style={styles.privacyPoints}>
              {[
                'Zero cloud servers: All journals and mood records live exclusively on your device',
                'Passcode & Biometric App Lock protection available',
                'Optional background blur in multi-tasking app switcher',
                'One-tap complete portable JSON data backup & export',
                'No third-party analytics, tracking pixels, or ads',
              ].map((point, i) => (
                <View key={i} style={styles.privacyItem}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.accentPrimary} />
                  <Text style={[styles.privacyText, { color: colors.textPrimary }]}>{point}</Text>
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
    <ScreenContainer scroll={false} backgroundColor={colors.bgPrimary} style={styles.container}>
      <View style={[styles.progressBar, { backgroundColor: colors.borderLight }]}>
        <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: colors.accentPrimary }]} />
      </View>
      <Text style={[styles.progressText, { color: colors.textTertiary }]}>
        Step {step + 1} of {STEPS.length}
      </Text>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {renderStep()}
      </ScrollView>

      <View style={[styles.bottomBar, { borderTopColor: colors.borderLight, backgroundColor: colors.bgPrimary }]}>
        <TouchableOpacity
          onPress={handleBack}
          disabled={step === 0}
          style={[
            styles.backButton,
            { borderColor: colors.borderLight, backgroundColor: colors.bgCard },
            step === 0 && { opacity: 0.3 },
          ]}
        >
          <Text style={[styles.backButtonText, { color: colors.textPrimary }]}>Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 2 }}>
          <PrimaryButton
            onPress={handleNext}
            title={step === STEPS.length - 1 ? 'Begin Journey' : 'Continue'}
            fullWidth
          />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  progressBar: { height: 6, marginHorizontal: 20, marginTop: 16, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: { textAlign: 'center', fontSize: 13, fontWeight: '500', marginTop: 8 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 110, flexGrow: 1 },
  welcomeStep: { alignItems: 'center', gap: 16, paddingVertical: 16 },
  welcomeIconWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  welcomeTitle: { fontSize: 28, fontWeight: '700', textAlign: 'center', letterSpacing: -0.4 },
  welcomeText: { fontSize: 15, textAlign: 'center', lineHeight: 22, paddingHorizontal: 16 },
  features: { width: '100%', gap: 14, marginTop: 14 },
  featureItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, paddingVertical: 4 },
  featureText: { fontSize: 14, flex: 1, lineHeight: 21 },
  selectionStep: { gap: 14 },
  inputStep: { gap: 16, paddingTop: 20 },
  privacyStep: { alignItems: 'center', gap: 16, paddingVertical: 16 },
  stepQuestion: { fontSize: 22, fontWeight: '700', textAlign: 'center', letterSpacing: -0.3 },
  stepHint: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  goalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between', marginTop: 4 },
  goalCard: {
    width: '48%',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 16,
    borderWidth: 1,
    minHeight: 120,
  },
  goalIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  goalLabel: { fontSize: 13, fontWeight: '600', textAlign: 'center', lineHeight: 18 },
  timeOptions: { gap: 12, marginTop: 6 },
  timeOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  timeInfo: { flex: 1, gap: 2 },
  timeLabel: { fontSize: 16, fontWeight: '600' },
  timeDesc: { fontSize: 13, lineHeight: 18 },
  habitGrid: { gap: 10, marginTop: 6 },
  habitCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  habitIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  habitInfo: { flex: 1, gap: 2 },
  habitName: { fontSize: 15, fontWeight: '600', lineHeight: 20 },
  habitReminder: { fontSize: 12 },
  nameInput: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    marginHorizontal: 20,
    marginTop: 20,
  },
  privacyPoints: { width: '100%', gap: 14, marginTop: 12 },
  privacyItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  privacyText: { fontSize: 14, lineHeight: 21, flex: 1 },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  backButtonText: { fontSize: 15, fontWeight: '600' },
});