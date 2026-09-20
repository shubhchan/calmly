import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Keyboard, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Card } from '../../components/Card';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Ionicons } from '@expo/vector-icons';
import { getCalmEncouragement } from '../../utils/encouragement';

const STEPS = [
  {
    id: 1,
    title: 'Notice',
    prompt: 'What are you feeling right now? Name the emotion without judgment.',
    placeholder: 'I\'m feeling...',
  },
  {
    id: 2,
    title: 'Humanity',
    prompt: 'Remind yourself: suffering is part of being human. You are not alone.',
    placeholder: 'This is hard, and that\'s okay because...',
  },
  {
    id: 3,
    title: 'Kindness',
    prompt: 'What would you say to a dear friend feeling this way? Say it to yourself.',
    placeholder: 'I would tell them...',
  },
  {
    id: 4,
    title: 'Soothe',
    prompt: 'Place a hand on your heart. Breathe. Offer yourself warmth.',
    placeholder: 'May I be kind to myself. May I give myself what I need.',
  },
];

export function SelfCompassionScreen() {
  const navigation = useNavigation();
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<string[]>(['', '', '', '']);
  const [completed, setCompleted] = useState(false);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
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
    const newResponses = [...responses];
    newResponses[currentStep] = text;
    setResponses(newResponses);
  };

  const step = STEPS[currentStep];
  const progress = (currentStep + 1) / STEPS.length;

  if (completed) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.completeCard}>
          <Ionicons name="heart" size={48} color="#F5A9A9" />
          <Text style={styles.completeTitle}>Practice Complete</Text>
          <Text style={styles.completeText}>{getCalmEncouragement('complete')}</Text>
          <PrimaryButton onPress={handleRestart} title="Practice Again" style={styles.restartButton} variant="outline" />
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
          <Text style={styles.headerTitle}>Self-Compassion</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: progress * 100 + '%' }]} />
        </View>
        <Text style={styles.stepCounter}>Step {currentStep + 1} of {STEPS.length}</Text>

        <Card style={styles.stepCard}>
          <Text style={styles.stepTitle}>{step.title}</Text>
          <Text style={styles.stepPrompt}>{step.prompt}</Text>
          <TextInput
            style={styles.textArea}
            placeholder={step.placeholder}
            value={responses[currentStep]}
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
            title={currentStep === STEPS.length - 1 ? 'Complete' : 'Next'}
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
  restartButton: { marginTop: 8, minWidth: 200 },
});