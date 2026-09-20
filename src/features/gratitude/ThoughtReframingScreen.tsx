import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Keyboard, TextInput, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Card } from '../../components/Card';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Ionicons } from '@expo/vector-icons';

const STEPS = [
  {
    id: 1,
    title: 'The Situation',
    prompt: 'What happened? Describe the triggering event.',
    placeholder: 'What happened...',
  },
  {
    id: 2,
    title: 'Automatic Thought',
    prompt: 'What thought popped into your mind? The "voice" in your head.',
    placeholder: 'I\'m thinking...',
  },
  {
    id: 3,
    title: 'Emotion & Intensity',
    prompt: 'What did you feel? Rate intensity 0-100%.',
    placeholder: 'I felt... (e.g., anxious 80%, sad 60%)',
  },
  {
    id: 4,
    title: 'Evidence For',
    prompt: 'What facts support this thought? Be objective.',
    placeholder: 'Evidence supporting this thought...',
  },
  {
    id: 5,
    title: 'Evidence Against',
    prompt: 'What facts contradict this thought? Past experiences, other perspectives.',
    placeholder: 'Evidence against this thought...',
  },
  {
    id: 6,
    title: 'Balanced Thought',
    prompt: 'Considering all evidence, what\'s a more balanced perspective?',
    placeholder: 'A more balanced thought...',
  },
  {
    id: 7,
    title: 'Re-rate Emotion',
    prompt: 'After reframing, how intense is the emotion now? 0-100%.',
    placeholder: 'Now I feel... (e.g., anxious 40%, sad 30%)',
  },
];

export function ThoughtReframingScreen() {
  const navigation = useNavigation();
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

  const step = (STEPS ?? [])[currentStep] ?? STEPS[0] ?? { title: '', prompt: '', placeholder: '' };
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
    const before = Number.isNaN(parsedBefore) ? 0 : Math.min(100, Math.max(0, parsedBefore));
    const after = Number.isNaN(parsedAfter) ? 0 : Math.min(100, Math.max(0, parsedAfter));
    const reduction = Math.max(0, before - after);

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.completeCard}>
          <Ionicons name="refresh" size={48} color="#5A955A" />
          <Text style={styles.completeTitle}>Reframing Complete</Text>
          <Text style={styles.completeText}>
            You\'ve examined your thinking and found a more balanced perspective.
          </Text>
          <View style={styles.changeIndicator}>
            <Text style={styles.changeLabel}>Emotional Intensity Change</Text>
            <View style={styles.changeBars}>
              <View style={styles.changeBarWrapper}>
                <Text style={styles.changeBarLabel}>Before</Text>
                <View style={styles.changeBarTrack}>
                  <View style={[styles.changeBarFill, { width: `${before ?? 0}%` }]} />
                </View>
                <Text style={styles.changeBarValue}>{before ?? 0}%</Text>
              </View>
              <View style={styles.changeBarWrapper}>
                <Text style={styles.changeBarLabel}>After</Text>
                <View style={styles.changeBarTrack}>
                  <View style={[styles.changeBarFillAfter, { width: `${after ?? 0}%` }]} />
                </View>
                <Text style={styles.changeBarValue}>{after ?? 0}%</Text>
              </View>
            </View>
            {reduction > 0 && (
              <Text style={styles.reductionText}>Reduced by {reduction}% 🌿</Text>
            )}
          </View>
          <PrimaryButton onPress={handleRestart} title="Reframe Another Thought" style={styles.restartButton} variant="outline" />
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#1E232E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thought Reframing</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: progress * 100 + '%' }]} />
        </View>
        <Text style={styles.stepCounter}>Step {currentStep + 1} of {(STEPS ?? []).length}</Text>

        <Card style={styles.stepCard}>
          <Text style={styles.stepTitle}>{step?.title ?? ''}</Text>
          <Text style={styles.stepPrompt}>{step?.prompt ?? ''}</Text>
          <TextInput
            style={styles.textArea}
            placeholder={step?.placeholder ?? ''}
            value={(responses ?? [])[currentStep] ?? ''}
            onChangeText={handleUpdateResponse}
            placeholderTextColor="#425474"
            multiline
            numberOfLines={4}
            autoCapitalize="sentences"
          />
        </Card>
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.buttonRow}>
          {currentStep > 0 && (
            <TouchableOpacity onPress={handleBack} style={styles.bottomBackButton}>
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          <PrimaryButton
            onPress={handleNext}
            title={currentStep === (STEPS ?? []).length - 1 ? 'Complete' : 'Next'}
            style={styles.nextButton}
            fullWidth={currentStep === 0}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFBF7' },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100, gap: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '600', color: '#1E232E', textAlign: 'center' },
  headerSpacer: { width: 44 },
  progressBar: { height: 4, borderRadius: 2, backgroundColor: '#E4DEBC', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#5A955A', borderRadius: 2 },
  stepCounter: { textAlign: 'center', fontSize: 13, color: '#425474', marginTop: 8 },
  stepCard: { gap: 12 },
  stepTitle: { fontSize: 18, fontWeight: '600', color: '#5A955A' },
  stepPrompt: { fontSize: 15, color: '#34415A', lineHeight: 22 },
  textArea: { fontSize: 16, color: '#1E232E', minHeight: 100, textAlignVertical: 'top', paddingTop: 4 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingBottom: 20, paddingTop: 12, backgroundColor: '#FDFBF7', borderTopWidth: 1, borderTopColor: '#E4DEBC' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  bottomBackButton: { flex: 1, paddingVertical: 14, borderRadius: 16, alignItems: 'center', backgroundColor: 'transparent', borderWidth: 1, borderColor: '#E4DEBC' },
  backButtonText: { fontSize: 16, fontWeight: '600', color: '#34415A' },
  nextButton: { flex: 1, minHeight: 56 },
  completeCard: { alignItems: 'center', paddingVertical: 40, gap: 16 },
  completeTitle: { fontSize: 24, fontWeight: '600', color: '#1E232E' },
  completeText: { fontSize: 16, color: '#34415A', textAlign: 'center', paddingHorizontal: 20 },
  changeIndicator: { marginVertical: 16, padding: 16, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E4DEBC', width: '100%' },
  changeLabel: { fontSize: 14, fontWeight: '600', color: '#34415A', marginBottom: 12, textAlign: 'center' },
  changeBars: { flexDirection: 'row', justifyContent: 'space-around', gap: 16 },
  changeBarWrapper: { alignItems: 'center', gap: 6, flex: 1 },
  changeBarLabel: { fontSize: 12, fontWeight: '500', color: '#425474' },
  changeBarTrack: { width: 80, height: 8, borderRadius: 4, backgroundColor: '#E4DEBC', overflow: 'hidden' },
  changeBarFill: { height: '100%', backgroundColor: '#F5A9A9', borderRadius: 4 },
  changeBarFillAfter: { height: '100%', backgroundColor: '#5A955A', borderRadius: 4 },
  changeBarValue: { fontSize: 12, fontWeight: '600', color: '#34415A' },
  reductionText: { marginTop: 12, fontSize: 14, fontWeight: '600', color: '#5A955A' },
  restartButton: { marginTop: 8, minWidth: 240 },
});