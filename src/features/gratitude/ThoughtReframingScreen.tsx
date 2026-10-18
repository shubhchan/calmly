import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput } from 'react-native';
import { Card } from '../../components/Card';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenHeader, TactilePressable } from '../../components';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme/ThemeContext';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { PopIn } from '../../components/interactive/PopIn';
import { resolveTint } from '../../theme/tints';

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
  const { colors, isDark } = useAppTheme();
  const sageTint = resolveTint(!!isDark, 'sage');
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
      <ScreenContainer contentContainerStyle={styles.content}>
        <PopIn index={0}>
        <Card tone="sage" style={styles.completeCard}>
          <View style={[styles.completeIconWrap, { backgroundColor: sageTint.plate }]}>
            <Ionicons name="sparkles" size={48} color={sageTint.accent} />
          </View>
          <Text style={[styles.completeTitle, { color: sageTint.text }]}>Perspective Shifted</Text>
          <Text style={[styles.completeText, { color: sageTint.text }]}>
            You stepped back from distortion and re-anchored your mind in balanced wisdom.
          </Text>

          <View style={[styles.changeIndicator, { backgroundColor: sageTint.plate, borderColor: sageTint.border }]}>
            <Text style={[styles.changeLabel, { color: sageTint.text }]}>Emotional Charge Shift</Text>
            <View style={styles.changeBars}>
              <View style={styles.changeBarWrapper}>
                <Text style={[styles.changeBarLabel, { color: sageTint.muted }]}>Initial Intensity</Text>
                <View style={[styles.changeBarTrack, { backgroundColor: sageTint.border }]}>
                  <View style={[styles.changeBarFill, { width: `${before}%`, backgroundColor: sageTint.accent }]} />
                </View>
                <Text style={[styles.changeBarValue, { color: sageTint.accent }]}>{before}%</Text>
              </View>
              <View style={styles.changeBarWrapper}>
                <Text style={[styles.changeBarLabel, { color: sageTint.muted }]}>Reframed Level</Text>
                <View style={[styles.changeBarTrack, { backgroundColor: sageTint.border }]}>
                  <View style={[styles.changeBarFillAfter, { width: `${after}%`, backgroundColor: sageTint.accent }]} />
                </View>
                <Text style={[styles.changeBarValue, { color: sageTint.accent }]}>{after}%</Text>
              </View>
            </View>
            {reduction > 0 && (
              <Text style={[styles.reductionText, { color: sageTint.accent }]}>
                Distress reduced by {reduction}%
              </Text>
            )}
          </View>

          <PrimaryButton onPress={handleRestart} title="Reframe Another Thought" style={styles.restartButton} variant="outline" />
        </Card>
        </PopIn>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll={false} backgroundColor={colors.background.default}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title="Cognitive Reframing" />

        <View style={[styles.progressBar, { backgroundColor: colors.border.default }]}>
          <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: colors.primary.default }]} />
        </View>
        <Text style={[styles.stepCounter, { color: colors.text.tertiary }]}>
          Step {currentStep + 1} of {(STEPS ?? []).length}
        </Text>

        <PopIn index={0}>
        <Card style={styles.stepCard}>
          <Text style={[styles.stepTitle, { color: colors.primary.default }]}>{step?.title ?? ''}</Text>
          <Text style={[styles.stepPrompt, { color: colors.text.primary }]}>{step?.prompt ?? ''}</Text>
          <TextInput
            style={[
              styles.textArea,
              {
                color: colors.text.primary,
                backgroundColor: colors.background.default,
                borderColor: colors.border.default,
              },
            ]}
            placeholder={step?.placeholder ?? ''}
            value={(responses ?? [])[currentStep] ?? ''}
            onChangeText={handleUpdateResponse}
            placeholderTextColor={colors.text.tertiary}
            multiline
            numberOfLines={4}
            autoCapitalize="sentences"
          />
        </Card>
        </PopIn>
      </ScrollView>

      <View style={[styles.bottomBar, { borderTopColor: colors.border.default, backgroundColor: colors.background.default }]}>
        <View style={styles.buttonRow}>
          {currentStep > 0 && (
            <TactilePressable
              onPress={handleBack}
              style={[styles.bottomBackButton, { borderColor: colors.border.default, backgroundColor: colors.surface.default }]}
            >
              <Text style={[styles.backButtonText, { color: colors.text.primary }]}>Back</Text>
            </TactilePressable>
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
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 110, gap: 16 },
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