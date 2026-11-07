import React, { useState, useCallback } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { Alert } from '../../services/appAlert';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Button, TactilePressable } from '../../components';
import { settingsRepository } from '../../database/repositories/settingsRepository';
import { habitRepository } from '../../database/repositories/habitRepository';
import { useAppTheme } from '../../theme/ThemeContext';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { loginWithGoogle, getCalmlyAuth } from '../../services/calmlyAuth';
import { onAuthStateChanged, type User } from 'firebase/auth';

type NavigationProp = NativeStackScreenProps<RootStackParamList, 'Onboarding'>['navigation'];

const GOALS = [
  { id: 'reduce_stress', label: 'Calm in hard moments', note: 'Breathing and grounding' },
  { id: 'better_sleep', label: 'A little more sleep', note: 'Wind-down and body scans' },
  { id: 'build_habits', label: 'A steadier habit', note: 'Short daily practice' },
  { id: 'self_awareness', label: 'Know myself better', note: 'Reflection and patterns' },
  { id: 'gratitude', label: 'Notice the good', note: 'Small daily gratitude' },
  { id: 'emotional_regulation', label: 'A softer inner voice', note: 'Self-compassion' },
];

const TIME_OPTIONS: { id: string; label: string; description: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { id: 'morning', label: 'Morning presence', description: 'Begin the day centered', icon: 'sunny-outline' },
  { id: 'afternoon', label: 'Afternoon pause', description: 'A midday reset', icon: 'partly-sunny-outline' },
  { id: 'evening', label: 'Evening unwind', description: 'Wind down with reflection', icon: 'moon-outline' },
];

const STARTER_HABITS = [
  { id: 'water', name: 'Hydrate with intention', icon: 'water-outline', frequency: 'daily', goal: 8, reminder: '09:00' },
  { id: 'breathing', name: 'Two mindful minutes', icon: 'leaf-outline', frequency: 'daily', goal: 1, reminder: '08:30' },
  { id: 'walk', name: 'Gentle walk outdoors', icon: 'walk-outline', frequency: 'daily', goal: 1, reminder: '12:00' },
  { id: 'gratitude', name: 'Note three good things', icon: 'heart-outline', frequency: 'daily', goal: 1, reminder: '20:00' },
  { id: 'stretch', name: 'Mindful body stretch', icon: 'body-outline', frequency: 'daily', goal: 1, reminder: '07:00' },
  { id: 'journal', name: 'Evening reflection', icon: 'book-outline', frequency: 'daily', goal: 1, reminder: '21:00' },
];

const STEPS = [
  { title: 'Welcome to Calmly', hint: 'A private place for a quieter mind.' },
  { title: 'What do you need most?', hint: 'This only shapes what you see first.' },
  { title: 'When do you check in?', hint: 'Gentle reminders, at your rhythm.' },
  { title: 'Start with tiny habits', hint: 'Pick one to three. Small is enough.' },
  { title: 'What should we call you?', hint: 'Only used for your greeting.' },
  { title: 'Yours alone', hint: 'Your words stay on this device.' },
];

export function OnboardingScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useAppTheme();
  const [step, setStep] = useState(0);
  const [goals, setGoals] = useState<string[]>([]);
  const [timeOfDay, setTimeOfDay] = useState<string>('');
  const [selectedHabits, setSelectedHabits] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  React.useEffect(() => {
    const auth = getCalmlyAuth();
    if (!auth) return;
    return onAuthStateChanged(auth, (u) => {
      setCurrentUser(u);
      if (u?.displayName && !name) {
        const firstName = u.displayName.split(' ')[0] || u.displayName;
        setName(firstName);
      }
    });
  }, [name]);

  const handleGoogleSignIn = async () => {
    setIsLoggingIn(true);
    try {
      const u = await loginWithGoogle();
      setCurrentUser(u);
      if (u?.displayName && !name) {
        const firstName = u.displayName.split(' ')[0] || u.displayName;
        setName(firstName);
      }
      Alert.alert(
        'Google connected',
        `Welcome, ${u.displayName || u.email}. You can now keep encrypted backups in your own Drive.`
      );
    } catch (error: any) {
      Alert.alert('Sign-in note', error?.message || 'Google sign-in was not completed.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const completeOnboarding = async (skip = false) => {
    try {
      await settingsRepository.updateSettings({
        onboardingComplete: true,
        userName: skip ? '' : name ?? '',
      });

      if (!skip) {
        const starterHabits = STARTER_HABITS.filter((h) => selectedHabits.includes(h.id));
        for (const habit of starterHabits) {
          await habitRepository.create({
            name: habit.name,
            icon: habit.icon,
            color: colors.primary.default,
            frequency: habit.frequency as any,
            goal: habit.goal,
            reminderTime: habit.reminder,
          });
        }
      }
      (navigation as any)?.replace?.('App');
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      Alert.alert('Not saved', 'Your setup could not be saved. Please try again.');
    }
  };

  const handleNext = useCallback(async () => {
    if (step === 1 && goals.length === 0) {
      Alert.alert('Choose one focus', 'Pick the intention that fits today. You can change it later.');
      return;
    }
    if (step === 2 && !timeOfDay) {
      Alert.alert('Choose a time', 'Pick the moment you would like a quiet reminder.');
      return;
    }
    if (step === 3 && selectedHabits.length === 0) {
      Alert.alert('Pick one habit', 'One small habit is enough to begin.');
      return;
    }
    if (step === 5) {
      await completeOnboarding();
      return;
    }
    setStep(step + 1);
  }, [step, goals, timeOfDay, selectedHabits, name, colors.primary.default]);

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const toggleGoal = (goalId: string) => {
    setGoals((prev) => (prev.includes(goalId) ? prev.filter((g) => g !== goalId) : [...prev, goalId]));
  };

  const toggleHabit = (habitId: string) => {
    setSelectedHabits((prev) =>
      prev.includes(habitId) ? prev.filter((h) => h !== habitId) : [...prev, habitId]
    );
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View style={{ gap: 16 }}>
            <AppText variant="h2">{STEPS[0].title}</AppText>
            <AppText variant="bodyLarge" tone="secondary" style={{ maxWidth: 300 }}>
              A private, offline place for presence, balance and a little more room to breathe.
            </AppText>

            <View
              style={{
                borderRadius: 20,
                backgroundColor: colors.surface.default,
                padding: 18,
                gap: 12,
                marginTop: 4,
              }}
            >
              {currentUser ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Ionicons name="checkmark-circle" size={22} color={colors.primary.default} />
                  <View style={{ flex: 1 }}>
                    <AppText variant="title">Google connected</AppText>
                    <AppText variant="caption" tone="tertiary" numberOfLines={1}>
                      {currentUser.email}
                    </AppText>
                  </View>
                </View>
              ) : (
                <>
                  <View>
                    <AppText variant="title">Keep a backup, optionally</AppText>
                    <AppText variant="caption" tone="tertiary" style={{ marginTop: 3, lineHeight: 18 }}>
                      Sign in to store encrypted backups in your own Google Drive. You can skip this.
                    </AppText>
                  </View>
                  <Button
                    title={isLoggingIn ? 'Connecting…' : 'Continue with Google'}
                    variant="secondary"
                    onPress={handleGoogleSignIn}
                    loading={isLoggingIn}
                    fullWidth
                    leftIcon={(color, size) => <Ionicons name="logo-google" size={size} color={color} />}
                  />
                </>
              )}
            </View>

            <View style={{ gap: 14, marginTop: 8 }}>
              {[
                { icon: 'shield-checkmark-outline', text: 'Offline by default. No trackers, no ads.' },
                { icon: 'book-outline', text: 'Prompts for reflection, not performance.' },
                { icon: 'leaf-outline', text: 'Breathing, grounding and sound, at your pace.' },
              ].map((feat) => (
                <View key={feat.text} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                  <Ionicons
                    name={feat.icon as any}
                    size={19}
                    color={colors.primary.default}
                    style={{ marginTop: 1 }}
                  />
                  <AppText variant="bodySmall" tone="secondary" style={{ flex: 1 }}>
                    {feat.text}
                  </AppText>
                </View>
              ))}
            </View>
          </View>
        );
      case 1:
        return (
          <View style={{ gap: 16 }}>
            <View>
              <AppText variant="h2">{STEPS[1].title}</AppText>
              <AppText variant="bodySmall" tone="secondary" style={{ marginTop: 6 }}>
                {STEPS[1].hint}
              </AppText>
            </View>
            <View style={{ gap: 9 }}>
              {GOALS.map((goal) => {
                const selected = goals.includes(goal.id);
                return (
                  <TactilePressable
                    key={goal.id}
                    onPress={() => toggleGoal(goal.id)}
                    scaleDownTo={0.99}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 14,
                      paddingVertical: 15,
                      paddingHorizontal: 16,
                      borderRadius: 16,
                      backgroundColor: selected ? colors.surface.selected : colors.surface.default,
                      borderWidth: 1,
                      borderColor: selected ? colors.primary.subtleBorder : 'transparent',
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <AppText variant="title" tone={selected ? 'link' : 'primary'}>
                        {goal.label}
                      </AppText>
                      <AppText variant="caption" tone="tertiary" style={{ marginTop: 2 }}>
                        {goal.note}
                      </AppText>
                    </View>
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        backgroundColor: colors.surface.default,
                        borderWidth: selected ? 6 : 1.5,
                        borderColor: selected ? colors.primary.default : colors.border.strong,
                      }}
                    />
                  </TactilePressable>
                );
              })}
            </View>
          </View>
        );
      case 2:
        return (
          <View style={{ gap: 16 }}>
            <View>
              <AppText variant="h2">{STEPS[2].title}</AppText>
              <AppText variant="bodySmall" tone="secondary" style={{ marginTop: 6 }}>
                {STEPS[2].hint}
              </AppText>
            </View>
            <View style={{ gap: 9 }}>
              {TIME_OPTIONS.map((option) => {
                const selected = timeOfDay === option.id;
                return (
                  <TactilePressable
                    key={option.id}
                    onPress={() => setTimeOfDay(option.id)}
                    scaleDownTo={0.99}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 14,
                      paddingVertical: 15,
                      paddingHorizontal: 16,
                      borderRadius: 16,
                      backgroundColor: selected ? colors.surface.selected : colors.surface.default,
                      borderWidth: 1,
                      borderColor: selected ? colors.primary.subtleBorder : 'transparent',
                    }}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: selected ? colors.surface.default : colors.surface.muted,
                      }}
                    >
                      <Ionicons name={option.icon} size={18} color={colors.primary.default} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppText variant="title" tone={selected ? 'link' : 'primary'}>
                        {option.label}
                      </AppText>
                      <AppText variant="caption" tone="tertiary" style={{ marginTop: 2 }}>
                        {option.description}
                      </AppText>
                    </View>
                    <Ionicons
                      name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                      size={21}
                      color={selected ? colors.primary.default : colors.border.strong}
                    />
                  </TactilePressable>
                );
              })}
            </View>
          </View>
        );
      case 3:
        return (
          <View style={{ gap: 16 }}>
            <View>
              <AppText variant="h2">{STEPS[3].title}</AppText>
              <AppText variant="bodySmall" tone="secondary" style={{ marginTop: 6 }}>
                {STEPS[3].hint}
              </AppText>
            </View>
            <View style={{ gap: 9 }}>
              {STARTER_HABITS.map((habit) => {
                const selected = selectedHabits.includes(habit.id);
                return (
                  <TactilePressable
                    key={habit.id}
                    onPress={() => toggleHabit(habit.id)}
                    scaleDownTo={0.99}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      paddingVertical: 14,
                      paddingHorizontal: 15,
                      borderRadius: 16,
                      backgroundColor: selected ? colors.surface.selected : colors.surface.default,
                      borderWidth: 1,
                      borderColor: selected ? colors.primary.subtleBorder : 'transparent',
                    }}
                  >
                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: selected ? colors.surface.default : colors.surface.muted,
                      }}
                    >
                      <Ionicons name={habit.icon as any} size={18} color={colors.primary.default} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppText variant="title" tone={selected ? 'link' : 'primary'}>
                        {habit.name}
                      </AppText>
                      <AppText variant="caption" tone="tertiary" style={{ marginTop: 2 }}>
                        {habit.reminder}
                      </AppText>
                    </View>
                    <Ionicons
                      name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                      size={21}
                      color={selected ? colors.primary.default : colors.border.strong}
                    />
                  </TactilePressable>
                );
              })}
            </View>
          </View>
        );
      case 4:
        return (
          <View style={{ gap: 16 }}>
            <View>
              <AppText variant="h2">{STEPS[4].title}</AppText>
              <AppText variant="bodySmall" tone="secondary" style={{ marginTop: 6 }}>
                {STEPS[4].hint}
              </AppText>
            </View>
            <TextInput
              style={{
                fontSize: 32,
                lineHeight: 40,
                letterSpacing: -0.6,
                color: colors.text.primary,
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: colors.primary.default,
                marginTop: 16,
              }}
              placeholder="Your name"
              value={name}
              onChangeText={setName}
              placeholderTextColor={colors.text.tertiary}
              autoCapitalize="words"
              autoFocus
              maxLength={30}
              accessibilityLabel="Your name"
            />
          </View>
        );
      case 5:
        return (
          <View style={{ gap: 16 }}>
            <View>
              <AppText variant="h2">{STEPS[5].title}</AppText>
              <AppText variant="bodySmall" tone="secondary" style={{ marginTop: 6 }}>
                {STEPS[5].hint}
              </AppText>
            </View>
            <View style={{ gap: 14, marginTop: 4 }}>
              {[
                'Your journals and mood records live only on this device.',
                'App lock with a passcode or biometrics, if you want it.',
                'Export everything as a portable file at any time.',
                'No third-party analytics, tracking or advertising.',
              ].map((point) => (
                <View key={point} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={19}
                    color={colors.primary.default}
                    style={{ marginTop: 1 }}
                  />
                  <AppText variant="bodySmall" tone="secondary" style={{ flex: 1, lineHeight: 21 }}>
                    {point}
                  </AppText>
                </View>
              ))}
            </View>

            {currentUser ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  padding: 15,
                  borderRadius: 16,
                  backgroundColor: colors.surface.selected,
                  marginTop: 4,
                }}
              >
                <Ionicons name="cloud-done-outline" size={21} color={colors.primary.default} />
                <View style={{ flex: 1 }}>
                  <AppText variant="title">Google connected</AppText>
                  <AppText variant="caption" tone="secondary" numberOfLines={2}>
                    Encrypted backups go to your own Drive ({currentUser.email}).
                  </AppText>
                </View>
              </View>
            ) : (
              <Button
                title={isLoggingIn ? 'Connecting…' : 'Connect Google (optional)'}
                variant="outline"
                onPress={handleGoogleSignIn}
                loading={isLoggingIn}
                fullWidth
                leftIcon={(color, size) => <Ionicons name="logo-google" size={size} color={color} />}
              />
            )}
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <ScreenContainer scroll={false} backgroundColor={colors.background.default}>
      <View style={{ flex: 1 }}>
        {/* Progress */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 24,
            paddingTop: 12,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {step > 0 ? (
              <TactilePressable
                onPress={handleBack}
                scaleDownTo={0.9}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Go back"
                style={{ padding: 2 }}
              >
                <Ionicons name="chevron-back" size={19} color={colors.text.tertiary} />
              </TactilePressable>
            ) : null}
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {STEPS.map((_, index) => (
                <View
                  key={index}
                  style={{
                    width: 22,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: index <= step ? colors.primary.default : colors.border.default,
                  }}
                />
              ))}
            </View>
          </View>
          <TactilePressable
            onPress={() => completeOnboarding(true)}
            scaleDownTo={0.95}
            accessibilityRole="button"
            accessibilityLabel="Skip onboarding"
          >
            <AppText variant="caption" tone="tertiary">
              Skip
            </AppText>
          </TactilePressable>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <OnboardingScene />
          <View style={{ marginTop: 26 }}>{renderStep()}</View>
        </ScrollView>

        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            paddingHorizontal: 24,
            paddingBottom: 26,
            paddingTop: 12,
            backgroundColor: colors.background.default,
          }}
        >
          <Button
            title={step === STEPS.length - 1 ? 'Begin' : 'Continue'}
            onPress={handleNext}
            fullWidth
          />
        </View>
      </View>
    </ScreenContainer>
  );
}

/**
 * Flat onboarding scene: a foggy lake, two hills, one pine and a seated
 * figure. Two fills and one tint, no outlines or gradients.
 */
function OnboardingScene() {
  const { colors } = useAppTheme();
  return (
    <View
      style={{
        height: 200,
        borderRadius: 24,
        backgroundColor: colors.primary.subtle,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          position: 'absolute',
          top: 26,
          right: 34,
          width: 54,
          height: 54,
          borderRadius: 27,
          backgroundColor: colors.status.warning.default,
          opacity: 0.18,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: 44,
          right: 52,
          width: 18,
          height: 18,
          borderRadius: 9,
          backgroundColor: colors.status.warning.default,
          opacity: 0.55,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: -40,
          bottom: 44,
          width: 260,
          height: 130,
          borderRadius: 130,
          backgroundColor: colors.primary.subtleBorder,
          opacity: 0.7,
        }}
      />
      <View
        style={{
          position: 'absolute',
          right: -50,
          bottom: 44,
          width: 230,
          height: 110,
          borderRadius: 110,
          backgroundColor: colors.primary.subtleBorder,
          opacity: 0.45,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 62,
          backgroundColor: colors.primary.subtleBorder,
          opacity: 0.85,
        }}
      />
      {/* Pine */}
      <View style={{ position: 'absolute', right: 52, bottom: 54, alignItems: 'center' }}>
        <View
          style={{
            width: 0,
            height: 0,
            borderLeftWidth: 15,
            borderRightWidth: 15,
            borderBottomWidth: 44,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: colors.primary.default,
          }}
        />
        <View style={{ width: 4, height: 14, backgroundColor: colors.primary.default }} />
      </View>
      {/* Seated figure */}
      <View style={{ position: 'absolute', left: 132, bottom: 58, alignItems: 'center' }}>
        <View
          style={{
            width: 16,
            height: 16,
            borderRadius: 8,
            backgroundColor: colors.primary.default,
          }}
        />
        <View
          style={{
            width: 38,
            height: 28,
            borderTopLeftRadius: 19,
            borderTopRightRadius: 19,
            backgroundColor: colors.primary.default,
            marginTop: 2,
          }}
        />
      </View>
    </View>
  );
}
