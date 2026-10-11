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
    prompt: 'What circumstance feels overwhelming or uncertain? Describe the situation briefly.',
    placeholder: 'The situation is...',
  },
  {
    id: 2,
    title: 'Outside My Control',
    prompt: 'What aspects belong to other people, past events, or random factors that you cannot force?',
    placeholder: 'I cannot control other people\'s reactions, the weather, past choices...',
  },
  {
    id: 3,
    title: 'Inside My Control',
    prompt: 'What small boundary, attitude, breath, or concrete decision is truly yours to choose right now?',
    placeholder: 'I can control my breathing, how I speak, my boundaries...',
  },
  {
    id: 4,
    title: 'My Immediate Step',
    prompt: 'Given what you actually influence, what is one tangible, compassionate action you will take?',
    placeholder: 'My next step is...',
  },
];

export function WhatCanIControlScreen() {
  const navigation = useNavigation();
  const colors = useThemeColors();
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
      <ScrollView
        style={[styles.container, { backgroundColor: colors.bgPrimary }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.completeCard}>
          <View style={[styles.completeIconWrap, { backgroundColor: colors.accentPrimary + '18' }]}>
            <Ionicons name="shield-checkmark" size={48} color={colors.accentPrimary} />
          </View>
          <Text style={[styles.completeTitle, { color: colors.textPrimary }]}>Clarity Unlocked</Text>
          <Text style={[styles.completeText, { color: colors.textSecondary }]}>
            You have separated what you can change from what you must release. Channel your energy with calm intention.
          </Text>

          <View style={[styles.summaryBox, { backgroundColor: colors.bgPrimary, borderColor: colors.borderLight }]}>
            <Text style={[styles.summaryLabel, { color: colors.accentPrimary }]}>Your Chosen Action:</Text>
            <Text style={[styles.summaryText, { color: colors.textPrimary }]}>{(responses ?? [])[3] || 'Take a deep breath and stay present.'}</Text>
          </View>

          <PrimaryButton onPress={handleRestart} title="Do Exercise Again" style={styles.restartButton} variant="outline" />
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
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Sphere of Control</Text>
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
              title={currentStep === (STEPS ?? []).length - 1 ? 'View Action Plan' : 'Continue'}
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
  summaryBox: {
    width: '100%',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    gap: 6,
    marginTop: 6,
  },
  summaryLabel: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryText: { fontSize: 16, lineHeight: 22, fontWeight: '500' },
  restartButton: { marginTop: 12, minWidth: 200 },
});