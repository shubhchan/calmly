import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet } from 'react-native';
import { Card } from '../../components/Card';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenHeader, SelfCompassionIllustration, TactilePressable } from '../../components';
import { getCalmEncouragement } from '../../utils/encouragement';
import { useAppTheme } from '../../theme/ThemeContext';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { PopIn } from '../../components/interactive/PopIn';
import { resolveTint } from '../../theme/tints';

const STEPS = [
  {
    id: 1,
    title: 'Mindful Notice',
    prompt: 'What difficult emotion are you experiencing right now? Name it gently without self-judgment.',
    placeholder: 'I am noticing feelings of...',
  },
  {
    id: 2,
    title: 'Common Humanity',
    prompt: 'Remind yourself: struggle is an inevitable part of the shared human condition. You are not broken or alone.',
    placeholder: 'Other people feel this too, and it is natural because...',
  },
  {
    id: 3,
    title: 'Loving Kindness',
    prompt: 'What gentle words would you whisper to a dear friend experiencing this? Offer those same words to yourself.',
    placeholder: 'I would tell them with care...',
  },
  {
    id: 4,
    title: 'Soothe & Ground',
    prompt: 'Place a warm hand over your heart or abdomen. Take three deep, grounding breaths. Receive your own warmth.',
    placeholder: 'May I be patient with myself. May I give myself the grace I need today.',
  },
];

export function SelfCompassionScreen() {
  const { colors, isDark } = useAppTheme();
  const lilacTint = resolveTint(!!isDark, 'lilac');
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<string[]>(['', '', '', '']);
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
    setResponses(['', '', '', '']);
    setCompleted(false);
  };

  const handleUpdateResponse = (text: string) => {
    const safeResponses = [...(responses ?? ['', '', '', ''])];
    if (currentStep < 0 || currentStep >= (STEPS ?? []).length) return;
    safeResponses[currentStep] = text ?? '';
    setResponses(safeResponses);
  };

  const step = (STEPS ?? [])[currentStep] ?? STEPS[0];
  const progress = (STEPS ?? []).length > 0 ? (currentStep + 1) / (STEPS ?? []).length : 0;

  if (completed) {
    return (
      <ScreenContainer contentContainerStyle={styles.content}>
        <PopIn index={0}>
        <Card tone="lilac" style={styles.completeCard}>
          <SelfCompassionIllustration width={160} height={135} style={{ marginBottom: 10 }} />
          <Text style={[styles.completeTitle, { color: lilacTint.text }]}>Practice Complete</Text>
          <Text style={[styles.completeText, { color: lilacTint.text }]}>
            {(() => {
              try {
                return getCalmEncouragement('complete') ?? 'You showed yourself profound kindness today.';
              } catch {
                return 'You showed yourself profound kindness today.';
              }
            })()}
          </Text>
          <PrimaryButton onPress={handleRestart} title="Practice Again" style={styles.restartButton} variant="outline" />
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
        <ScreenHeader title="Self-Compassion Pause" />

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
              title={currentStep === (STEPS ?? []).length - 1 ? 'Complete Practice' : 'Continue'}
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
  restartButton: { marginTop: 12, minWidth: 200 },
});