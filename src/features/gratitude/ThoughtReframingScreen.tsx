import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Card } from '../../components/Card';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../theme/ThemeContext';

const STEPS = [
  {
    id: 1,
    title: 'The Situation',
    prompt: 'What event or interaction triggered this mental distress? Describe it factually.',
    placeholder: 'What happened...',
  },
  {
    id: 2,
    title: 'Automatic Negative Thought',
    prompt: 'What instinctive self-critical or catastrophic story popped into your mind?',
    placeholder: 'The voice inside said...',
  },
  {
    id: 3,
    title: 'Emotional Intensity',
    prompt: 'What was your primary feeling, and how intense did it feel? (e.g., Anxious 80%, Hurt 70%)',
    placeholder: 'I felt... (e.g. anxious 80%)',
  },
  {
    id: 4,
    title: 'Objective Evidence For',
    prompt: 'What indisputable facts support this thought? Strip away emotional interpretations.',
    placeholder: 'Factual evidence supporting it...',
  },
  {
    id: 5,
    title: 'Evidence Against',
    prompt: 'What facts contradict this thought? Overlooked strengths, alternative explanations?',
    placeholder: 'Evidence that challenges or contradicts this thought...',
  },
  {
    id: 6,
    title: 'Balanced Perspective',
    prompt: 'Looking fairly at both sides, what is a grounded, compassionate conclusion?',
    placeholder: 'A more balanced truth is...',
  },
  {
    id: 7,
    title: 'Re-rate Emotion',
    prompt: 'Holding this balanced truth in mind, how intense is the distress now? (e.g., Anxious 35%)',
    placeholder: 'Now I feel... (e.g. anxious 30%)',
  },
];

export function ThoughtReframingScreen() {
  const navigation = useNavigation();
  const colors = useThemeColors();
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<string[]>(['', '', '', '', '', '', '']);
  const [completed, setCompleted] = useState(false);

  const handleNext = () => {
    if (currentStep < (STEPS ?? []).length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setCompleted(true);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setResponses(['', '', '', '', '', '', '']);
    setCompleted(false);
  };

  const handleUpdateResponse = (text: string) => {
    const safeResponses = [...(responses ?? ['', '', '', '', '', '', ''])];
    if (currentStep < 0 || currentStep >= (STEPS ?? []).length) return;
    safeResponses[currentStep] = text ?? '';
    setResponses(safeResponses);
  };

  const step = (STEPS ?? [])[currentStep] ?? STEPS[0];
  const progress = (STEPS ?? []).length > 0 ? (currentStep + 1) / (STEPS ?? []).length : 0;

  if (completed) {
    const beforeText = (responses ?? [])[2] ?? '';
    const afterText = (responses ?? [])[6] ?? '';
    let beforeMatch: RegExpMatchArray | null = null;
    let afterMatch: RegExpMatchArray | null = null;
    try {
      beforeMatch = (beforeText ?? '').match(/(\d+)%/);
    } catch {
      beforeMatch = null;
    }
    try {
      afterMatch = (afterText ?? '').match(/(\d+)%/);
    } catch {
      afterMatch = null;
    }
    const parsedBefore = beforeMatch ? parseInt(beforeMatch[1] ?? '0', 10) : 0;
    const parsedAfter = afterMatch ? parseInt(afterMatch[1] ?? '0', 10) : 0;
    const before = Number.isNaN(parsedBefore) ? 75 : Math.min(100, Math.max(0, parsedBefore));
    const after = Number.isNaN(parsedAfter) ? 35 : Math.min(100, Math.max(0, parsedAfter));
    const reduction = Math.max(0, before - after);

    return (
      <ScrollView
        style={[styles.container, { backgroundColor: colors.bgPrimary }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.completeCard}>
          <View style={[styles.completeIconWrap, { backgroundColor: colors.accentPrimary + '18' }]}>
            <Ionicons name="sparkles" size={48} color={colors.accentPrimary} />
          </View>
          <Text style={[styles.completeTitle, { color: colors.textPrimary }]}>Perspective Shifted</Text>
          <Text style={[styles.completeText, { color: colors.textSecondary }]}>
            You stepped back from distortion and re-anchored your mind in balanced wisdom.
          </Text>

          <View style={[styles.changeIndicator, { backgroundColor: colors.bgPrimary, borderColor: colors.borderLight }]}>
            <Text style={[styles.changeLabel, { color: colors.textSecondary }]}>Emotional Charge Shift</Text>
            <View style={styles.changeBars}>
              <View style={styles.changeBarWrapper}>
                <Text style={[styles.changeBarLabel, { color: colors.textTertiary }]}>Initial Intensity</Text>
                <View style={[styles.changeBarTrack, { backgroundColor: colors.borderLight }]}>
                  <View style={[styles.changeBarFill, { width: `${before}%`, backgroundColor: colors.accentRose || '#EB697F' }]} />
                </View>
                <Text style={[styles.changeBarValue, { color: colors.accentRose || '#EB697F' }]}>{before}%</Text>
              </View>
              <View style={styles.changeBarWrapper}>
                <Text style={[styles.changeBarLabel, { color: colors.textTertiary }]}>Reframed Level</Text>
                <View style={[styles.changeBarTrack, { backgroundColor: colors.borderLight }]}>
                  <View style={[styles.changeBarFillAfter, { width: `${after}%`, backgroundColor: colors.accentPrimary }]} />
                </View>
                <Text style={[styles.changeBarValue, { color: colors.accentPrimary }]}>{after}%</Text>
              </View>
            </View>
            {reduction > 0 && (
              <Text style={[styles.reductionText, { color: colors.accentPrimary }]}>
                Distress reduced by {reduction}%
              </Text>
            )}
          </View>

          <PrimaryButton onPress={handleRestart} title="Reframe Another Thought" style={styles.restartButton} variant="outline" />
        </Card>
      </ScrollView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.backButton, { backgroundColor: colors.bgCard, borderColor: colors.borderLight }]}
            hitSlop={10}
          >
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Cognitive Reframing</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={[styles.progressBar, { backgroundColor: colors.borderLight }]}>
          <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: colors.accentPrimary }]} />
        </View>
        <Text style={[styles.stepCounter, { color: colors.textTertiary }]}>
          Step {currentStep + 1} of {(STEPS ?? []).length}
        </Text>

        <Card style={styles.stepCard}>
          <Text style={[styles.stepTitle, { color: colors.accentPrimary }]}>{step?.title ?? ''}</Text>
          <Text style={[styles.stepPrompt, { color: colors.textPrimary }]}>{step?.prompt ?? ''}</Text>
          <TextInput
            style={[
              styles.textArea,
              {
                color: colors.textPrimary,
                backgroundColor: colors.bgPrimary,
                borderColor: colors.borderLight,
              },
            ]}
            placeholder={step?.placeholder ?? ''}
            value={(responses ?? [])[currentStep] ?? ''}
            onChangeText={handleUpdateResponse}
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={4}
            autoCapitalize="sentences"
          />
        </Card>
      </ScrollView>

      <View style={[styles.bottomBar, { borderTopColor: colors.borderLight, backgroundColor: colors.bgPrimary }]}>
        <View style={styles.buttonRow}>
          {currentStep > 0 && (
            <TouchableOpacity
              onPress={handleBack}
              style={[styles.bottomBackButton, { borderColor: colors.borderLight, backgroundColor: colors.bgCard }]}
            >
              <Text style={[styles.backButtonText, { color: colors.textPrimary }]}>Back</Text>
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }}>
            <PrimaryButton
              onPress={handleNext}
              title={currentStep === (STEPS ?? []).length - 1 ? 'Complete Reflection' : 'Continue'}
              fullWidth
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 110, gap: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  progressBar: { height: 6, borderRadius: 3, overflow: 'hidden', marginTop: 4 },
  progressFill: { height: '100%', borderRadius: 3 },
  stepCounter: { textAlign: 'center', fontSize: 13, fontWeight: '500' },
  stepCard: { padding: 20, borderRadius: 24, gap: 14 },
  stepTitle: { fontSize: 18, fontWeight: '700' },
  stepPrompt: { fontSize: 15, lineHeight: 22 },
  textArea: {
    fontSize: 15,
    minHeight: 110,
    textAlignVertical: 'top',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    lineHeight: 22,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  buttonRow: { flexDirection: 'row', gap: 12 },
  bottomBackButton: {
    flex: 0.5,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  backButtonText: { fontSize: 15, fontWeight: '600' },
  completeCard: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20, gap: 14, borderRadius: 24 },
  completeIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  completeTitle: { fontSize: 24, fontWeight: '700', textAlign: 'center' },
  completeText: { fontSize: 15, textAlign: 'center', lineHeight: 22, paddingHorizontal: 12 },
  changeIndicator: {
    marginVertical: 14,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    width: '100%',
    gap: 12,
  },
  changeLabel: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' },
  changeBars: { flexDirection: 'row', justifyContent: 'space-around', gap: 16 },
  changeBarWrapper: { alignItems: 'center', gap: 6, flex: 1 },
  changeBarLabel: { fontSize: 12, fontWeight: '500' },
  changeBarTrack: { width: '100%', height: 8, borderRadius: 4, overflow: 'hidden' },
  changeBarFill: { height: '100%', borderRadius: 4 },
  changeBarFillAfter: { height: '100%', borderRadius: 4 },
  changeBarValue: { fontSize: 14, fontWeight: '700' },
  reductionText: { textAlign: 'center', fontSize: 14, fontWeight: '700', marginTop: 4 },
  restartButton: { marginTop: 10, minWidth: 220 },
});