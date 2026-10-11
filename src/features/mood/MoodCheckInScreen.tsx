import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet } from 'react-native';
import { useNavigation, useRoute, NavigationProp, RouteProp } from '@react-navigation/native';
import { Card, CardContent } from '../../components/Card';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ProgressRing } from '../../components/ProgressRing';
import { AppIcon, moodIcon, MoodAuraIllustration } from '../../components';
import type { AppIconName } from '../../components';
import { RootStackParamList, MoodType } from '../../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../theme/ThemeContext';

const moods: { id: MoodType; label: string; icon: AppIconName; color: string }[] = [
  { id: 'happy', label: 'Happy', icon: 'm-happy', color: '#5A955A' },
  { id: 'peaceful', label: 'Peaceful', icon: 'm-peaceful', color: '#6B9BCD' },
  { id: 'grateful', label: 'Grateful', icon: 'm-grateful', color: '#EB876D' },
  { id: 'content', label: 'Content', icon: 'm-content', color: '#74AC74' },
  { id: 'hopeful', label: 'Hopeful', icon: 'm-hopeful', color: '#877FC5' },
  { id: 'excited', label: 'Excited', icon: 'm-excited', color: '#EF9F8A' },
  { id: 'stressed', label: 'Stressed', icon: 'm-stressed', color: '#EB697F' },
  { id: 'anxious', label: 'Anxious', icon: 'm-anxious', color: '#EF8799' },
  { id: 'overwhelmed', label: 'Overwhelmed', icon: 'm-overwhelmed', color: '#5F9BB4' },
  { id: 'sad', label: 'Sad', icon: 'm-sad', color: '#877FC5' },
  { id: 'angry', label: 'Angry', icon: 'm-angry', color: '#EB876D' },
  { id: 'exhausted', label: 'Exhausted', icon: 'm-exhausted', color: '#74AC74' },
];

type Step = 'mood' | 'intensity' | 'stress' | 'energy' | 'context' | 'complete';

export function MoodCheckInScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'MoodCheckIn'>>();
  const colors = useThemeColors();

  const [step, setStep] = useState<Step>('mood');
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [intensity, setIntensity] = useState(5);
  const [stress, setStress] = useState(5);
  const [energy, setEnergy] = useState<'low' | 'medium' | 'high'>('medium');
  const [context, setContext] = useState('');
  const [needs, setNeeds] = useState('');

  const progress =
    (({
      mood: 0.17,
      intensity: 0.33,
      stress: 0.5,
      energy: 0.67,
      context: 0.83,
      complete: 1,
    } as Record<string, number>)[step] ?? 0);

  const goBack = () => {
    if (step === 'mood') {
      navigation?.goBack?.();
    } else if (step === 'intensity') {
      setStep('mood');
    } else if (step === 'stress') {
      setStep('intensity');
    } else if (step === 'energy') {
      setStep('stress');
    } else if (step === 'context') {
      setStep('energy');
    }
  };

  const goNext = () => {
    if (step === 'mood' && selectedMood) {
      setStep('intensity');
    } else if (step === 'intensity') {
      setStep('stress');
    } else if (step === 'stress') {
      setStep('energy');
    } else if (step === 'energy') {
      setStep('context');
    } else if (step === 'context') {
      setStep('complete');
      setTimeout(() => {
        navigation?.goBack?.();
      }, 1200);
    }
  };

  const renderMoodSelector = () => (
    <View style={styles.stepContainer}>
      <MoodAuraIllustration width={120} height={95} style={{ alignSelf: 'center', marginBottom: 2 }} />
      <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>How are you feeling right now?</Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>Select the emotion closest to your inner state</Text>
      <View style={styles.moodGrid}>
        {(moods ?? []).map((mood) => {
          const isSelected = selectedMood === mood?.id;
          return (
            <Pressable
              key={mood?.id ?? Math.random().toString()}
              onPress={() => {
                if (!mood?.id) return;
                setSelectedMood(mood.id);
                setTimeout(() => goNext(), 180);
              }}
              style={[
                styles.moodCard,
                { backgroundColor: colors.bgCard, borderColor: colors.borderLight },
                isSelected && { borderColor: mood.color, backgroundColor: mood.color + '18', borderWidth: 2 },
              ]}
            >
              <AppIcon name={mood?.icon ?? 'm-happy'} size={32} color={mood?.color ?? colors.accentPrimary} />
              <Text
                style={[
                  styles.moodLabel,
                  { color: isSelected ? mood.color : colors.textPrimary },
                  isSelected && { fontWeight: '700' },
                ]}
              >
                {mood?.label ?? 'Mood'}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  const renderSliderStep = (
    label: string,
    value: number,
    onChange: (v: number) => void,
    min: number,
    max: number,
    icon: AppIconName,
    accentColor: string
  ) => {
    const safeValue = value ?? 5;
    const safeMin = min ?? 1;
    const safeMax = max ?? 10;
    const range = safeMax - safeMin || 1;
    const fillPct = Math.min(100, Math.max(0, ((safeValue - safeMin) / range) * 100));

    return (
      <View style={styles.stepContainer}>
        <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>{label}</Text>
        <Text style={[styles.valueHighlight, { color: accentColor }]}>
          {safeValue} <Text style={{ fontSize: 18, color: colors.textTertiary }}>/ {safeMax}</Text>
        </Text>

        <View style={styles.sliderIconWrapper}>
          <AppIcon name={icon ?? 'm-happy'} size={68} />
        </View>

        <View style={styles.trackWrapper}>
          <View style={styles.trackRangeLabels}>
            <Text style={[styles.trackLabelText, { color: colors.textTertiary }]}>{safeMin} (Gentle)</Text>
            <Text style={[styles.trackLabelText, { color: colors.textTertiary }]}>{safeMax} (Peak)</Text>
          </View>
          <View style={[styles.trackBase, { backgroundColor: colors.borderLight }]}>
            <View style={[styles.trackFill, { width: `${fillPct}%`, backgroundColor: accentColor }]} />
          </View>

          <View style={styles.pillGrid}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => {
              const isSelected = safeValue === v;
              return (
                <Pressable
                  key={v}
                  onPress={() => onChange?.(v)}
                  style={[
                    styles.levelPill,
                    { backgroundColor: colors.bgCard, borderColor: colors.borderLight },
                    isSelected && { backgroundColor: accentColor, borderColor: accentColor },
                  ]}
                >
                  <Text
                    style={[
                      styles.levelPillText,
                      { color: isSelected ? '#FFFFFF' : colors.textPrimary },
                      isSelected && { fontWeight: '700' },
                    ]}
                  >
                    {v}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    );
  };

  const renderEnergyStep = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>What's your energy level?</Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>Notice how awake and ready your body feels</Text>
      <View style={styles.energyGrid}>
        {[
          { value: 'low' as const, label: 'Low', icon: 'i-battery' as AppIconName, desc: 'Quiet, slow, or resting' },
          { value: 'medium' as const, label: 'Medium', icon: 'i-flash' as AppIconName, desc: 'Balanced, steady' },
          { value: 'high' as const, label: 'High', icon: 'i-rocket' as AppIconName, desc: 'Active, vibrant, energized' },
        ].map((e) => {
          const isSelected = energy === e?.value;
          return (
            <Pressable
              key={e?.value}
              onPress={() => e?.value && setEnergy(e.value)}
              style={[
                styles.energyCard,
                { backgroundColor: colors.bgCard, borderColor: isSelected ? colors.accentPrimary : colors.borderLight },
                isSelected && { backgroundColor: colors.accentPrimary + '14', borderWidth: 2 },
              ]}
            >
              <AppIcon name={e?.icon} size={36} color={isSelected ? colors.accentPrimary : undefined} />
              <Text
                style={[
                  styles.energyTitle,
                  { color: isSelected ? colors.accentPrimary : colors.textPrimary },
                  isSelected && { fontWeight: '700' },
                ]}
              >
                {e.label}
              </Text>
              <Text style={[styles.energyDesc, { color: colors.textTertiary }]}>{e.desc}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  const renderContextStep = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>What's on your mind?</Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>Optional context to anchor this moment in your journal</Text>
      <View style={styles.inputsStack}>
        <View>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>What's happening right now?</Text>
          <TextInput
            placeholder="A few words about what prompted this feeling..."
            value={context}
            onChangeText={setContext}
            multiline
            numberOfLines={3}
            style={[styles.contextInput, { backgroundColor: colors.bgCard, borderColor: colors.borderLight, color: colors.textPrimary }]}
            placeholderTextColor={colors.textTertiary}
          />
        </View>

        <View>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>What does your mind/body need?</Text>
          <TextInput
            placeholder="A breath, quiet time, water, connection..."
            value={needs}
            onChangeText={setNeeds}
            multiline
            numberOfLines={3}
            style={[styles.contextInput, { backgroundColor: colors.bgCard, borderColor: colors.borderLight, color: colors.textPrimary }]}
            placeholderTextColor={colors.textTertiary}
          />
        </View>
      </View>
    </View>
  );

  const renderCompleteStep = () => (
    <View style={[styles.stepContainer, { alignItems: 'center', paddingTop: 30 }]}>
      <MoodAuraIllustration width={150} height={125} style={{ marginBottom: 12 }} />
      <View style={[styles.completeIconCircle, { backgroundColor: colors.accentPrimary + '20', width: 64, height: 64, borderRadius: 32 }]}>
        <Ionicons name="checkmark-circle" size={42} color={colors.accentPrimary} />
      </View>
      <Text style={[styles.stepTitle, { color: colors.textPrimary, marginTop: 14 }]}>Check-in Complete!</Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary, textAlign: 'center', marginTop: 8 }]}>
        Thank you for honoring how you feel right now.
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <View style={styles.header}>
        <Pressable
          onPress={goBack}
          style={[styles.navButton, { backgroundColor: colors.bgCard, borderColor: colors.borderLight }]}
          disabled={step === 'complete'}
          hitSlop={10}
        >
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </Pressable>
        <ProgressRing progress={progress ?? 0} size={36} strokeWidth={3} showPercentage={false} />
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {step === 'mood' && renderMoodSelector()}
        {step === 'intensity' &&
          renderSliderStep(
            'How intense is this emotion?',
            intensity ?? 5,
            setIntensity,
            1,
            10,
            moodIcon(selectedMood),
            colors.accentPrimary
          )}
        {step === 'stress' &&
          renderSliderStep(
            'What is your stress level?',
            stress ?? 5,
            setStress,
            1,
            10,
            'm-stressed',
            colors.accentRose || '#EB697F'
          )}
        {step === 'energy' && renderEnergyStep()}
        {step === 'context' && renderContextStep()}
        {step === 'complete' && renderCompleteStep()}
      </ScrollView>

      {step !== 'complete' && step !== 'mood' && (
        <View style={[styles.bottomBar, { borderTopColor: colors.borderLight }]}>
          <View style={{ flex: 1 }}>
            <PrimaryButton title="Back" variant="outline" size="md" onPress={goBack} fullWidth />
          </View>
          <View style={{ flex: 1 }}>
            <PrimaryButton title="Next" variant="primary" size="md" onPress={goNext} fullWidth />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 110 },
  stepContainer: { gap: 12 },
  stepTitle: { fontSize: 24, fontWeight: '700', textAlign: 'center', letterSpacing: -0.3 },
  stepSubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
    marginTop: 8,
  },
  moodCard: {
    width: '31%',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
  },
  moodLabel: { fontSize: 13, fontWeight: '600' },
  valueHighlight: { fontSize: 36, fontWeight: '700', textAlign: 'center', marginTop: 4 },
  sliderIconWrapper: { alignItems: 'center', marginVertical: 12 },
  trackWrapper: { gap: 14, marginTop: 8 },
  trackRangeLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  trackLabelText: { fontSize: 13, fontWeight: '500' },
  trackBase: { height: 8, borderRadius: 4, overflow: 'hidden' },
  trackFill: { height: '100%', borderRadius: 4 },
  pillGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 10 },
  levelPill: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelPillText: { fontSize: 13, fontWeight: '600' },
  energyGrid: { gap: 12, marginTop: 8 },
  energyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    gap: 14,
  },
  energyTitle: { fontSize: 16, fontWeight: '600' },
  energyDesc: { fontSize: 13, flex: 1 },
  inputsStack: { gap: 16, marginTop: 8 },
  inputLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  contextInput: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  completeIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
});