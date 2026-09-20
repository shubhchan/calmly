import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleProp, ViewStyle } from 'react-native';
import { useNavigation, useRoute, NavigationProp, RouteProp } from '@react-navigation/native';
import { Card, PrimaryButton, ProgressRing } from '../../components';
import { RootStackParamList, GroundingType } from '../../types/navigation';

const groundingSteps: Record<GroundingType, { label: string; instruction: string; icon: string }[]> = {
  '5-4-3-2-1': [
    { label: '5 Things You See', instruction: 'Look around and name 5 things you can see. Notice colors, shapes, details.', icon: '👁️' },
    { label: '4 Things You Feel', instruction: 'Notice 4 things you can physically feel. Fabric, temperature, pressure, texture.', icon: '🤲' },
    { label: '3 Things You Hear', instruction: 'Listen for 3 sounds. Near or far, loud or quiet. Just notice them.', icon: '👂' },
    { label: '2 Things You Smell', instruction: 'Notice 2 scents in the air. If you can\'t smell anything, notice the neutral air.', icon: '👃' },
    { label: '1 Thing You Taste', instruction: 'Notice 1 taste. Your tongue, a sip of water, or just the absence of taste.', icon: '👅' },
  ],
  'body-scan': [
    { label: 'Feet & Legs', instruction: 'Bring attention to your feet. Notice any sensations. Let them relax.', icon: '🦶' },
    { label: 'Hips & Pelvis', instruction: 'Move awareness to your hips. Release any tension you\'re holding.', icon: '🧘' },
    { label: 'Abdomen & Chest', instruction: 'Notice your breathing. Let your belly soften. Heart rate settling.', icon: '🫁' },
    { label: 'Hands & Arms', instruction: 'Feel your hands. Unclench your jaw. Let shoulders drop away from ears.', icon: '✋' },
    { label: 'Neck & Face', instruction: 'Soften your eyes. Unfurrow your brow. Let your tongue rest from the roof of mouth.', icon: '😌' },
  ],
  cognitive: [
    { label: 'Name the Date', instruction: 'Say today\'s date, day of the week, month, year, and season out loud.', icon: '📅' },
    { label: 'Name Your Location', instruction: 'Where are you right now? City, building, room, specific spot.', icon: '📍' },
    { label: 'Name 3 Facts', instruction: 'State 3 objective facts about your current situation. No judgments.', icon: '✅' },
    { label: 'Safe Statement', instruction: 'Say: "I am safe right now. This feeling will pass. I can handle this."', icon: '🛡️' },
    { label: 'Future Anchor', instruction: 'Name one thing you\'re looking forward to, however small.', icon: '🌱' },
  ],
  physical: [
    { label: 'Press Feet Down', instruction: 'Press your feet firmly into the floor. Feel the ground supporting you. Hold 10 seconds.', icon: '👣' },
    { label: 'Grip & Release', instruction: 'Make tight fists. Squeeze hard for 5 seconds. Release suddenly. Feel the contrast.', icon: '✊' },
    { label: 'Stretch Arms Up', instruction: 'Reach up high. Stretch through fingertips. Take a deep breath. Lower slowly.', icon: '🤸' },
    { label: 'Touch Something', instruction: 'Touch 3 objects near you. Notice temperature, texture, weight. Describe each.', icon: '🖐️' },
    { label: 'Walk in Place', instruction: 'Slowly march in place. Feel each foot lift and land. Count 20 steps.', icon: '🚶' },
  ],
};

const groundingTitles: Record<GroundingType, string> = {
  '5-4-3-2-1': '5-4-3-2-1 Senses',
  'body-scan': 'Body Scan',
  cognitive: 'Cognitive Grounding',
  physical: 'Physical Grounding',
};

const groundingIcons: Record<GroundingType, string> = {
  '5-4-3-2-1': '👁️',
  'body-scan': '🧘',
  cognitive: '🧠',
  physical: '🤲',
};

export function GroundingExerciseScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'GroundingExercise'>>();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { type = '5-4-3-2-1' } = (route?.params ?? {}) as { type?: GroundingType };

  const safeType: GroundingType = (type && groundingSteps[type] ? type : '5-4-3-2-1');
  const steps = groundingSteps[safeType] ?? groundingSteps['5-4-3-2-1'] ?? [];
  const safeSteps = Array.isArray(steps) ? steps : [];
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const safeCurrentStep = Math.max(0, Math.min(currentStep, Math.max(0, safeSteps.length - 1)));
  const current = safeSteps[safeCurrentStep] ?? safeSteps[0] ?? { label: 'Grounding', instruction: 'Take a slow breath and notice the present moment.', icon: '🌿' };
  const progress = safeSteps.length > 0 ? (safeCurrentStep + 1) / safeSteps.length : 0;
  const safeTitle = groundingTitles[safeType] ?? groundingTitles['5-4-3-2-1'] ?? safeType ?? 'Grounding';
  const safeIcon = groundingIcons[safeType] ?? groundingIcons['5-4-3-2-1'] ?? '🌿';

  const handleNext = () => {
    if (currentStep < safeSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsComplete(true);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setIsComplete(false);
  };

  const handleDone = () => {
    navigation.goBack();
  };

  return (
    <View className="flex-1 bg-[var(--color-bg-primary)] flex flex-col">
      <View className="px-6 py-4 flex-row items-center justify-between">
        <Pressable onPress={() => navigation.goBack()} className="p-2">
          <Text style={{ fontSize: 24 }}>←</Text>
        </Pressable>
        <Text className="text-headline-sm font-semibold" style={{ color: '#1E232E' }}>
          {safeTitle}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="flex items-center mb-8">
          <Text style={{ fontSize: 64 }}>{safeIcon}</Text>
          <Text className="text-headline-md font-semibold mt-4 text-center" style={{ color: '#1E232E' }}>
            Step {safeSteps.length > 0 ? safeCurrentStep + 1 : 0} of {safeSteps.length}
          </Text>
        </View>

        <ProgressRing
          progress={Number.isFinite(progress) ? progress : 0}
          size={80}
          strokeWidth={6}
          showPercentage={false}
          className="mb-8"
        />

        <View className="w-full mb-8">
          <Card variant="elevated">
            <View className="p-6">
              <View className="flex-row items-start gap-4">
                <View
                  className="flex items-center justify-center rounded-2xl flex-shrink-0"
                  style={{
                    width: 56,
                    height: 56,
                    backgroundColor: '#F0F4F0',
                  }}
                >
                  <Text style={{ fontSize: 28 }}>{current?.icon ?? '🌿'}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-headline-md font-semibold mb-2" style={{ color: '#1E232E' }}>
                    {current?.label ?? 'Grounding'}
                  </Text>
                  <Text className="text-body-lg leading-relaxed" style={{ color: '#34415A' }}>
                    {current?.instruction ?? ''}
                  </Text>
                </View>
              </View>
            </View>
          </Card>
        </View>

        <View className="flex-row items-center justify-center gap-4 mb-6">
          {(safeSteps ?? []).map((_, index) => (
            <View
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${index === currentStep ? 'w-6' : ''}`}
              style={{
                backgroundColor: index <= currentStep ? '#5A955A' : '#E4DEBC',
              }}
            />
          ))}
        </View>
      </ScrollView>

      <View className="px-6 pb-8 flex-row gap-3">
        {!isComplete ? (
          <>
            <PrimaryButton
              title="Previous"
              variant="outline"
              size="md"
              onPress={handlePrevious}
              disabled={currentStep === 0}
              className="flex-1"
              fullWidth
            />
            <PrimaryButton
              title={currentStep === safeSteps.length - 1 ? 'Complete' : 'Next'}
              variant="primary"
              size="md"
              onPress={handleNext}
              className="flex-1"
              fullWidth
            />
          </>
        ) : (
          <>
            <PrimaryButton
              title="Restart"
              variant="outline"
              size="md"
              onPress={handleRestart}
              className="flex-1"
              fullWidth
            />
            <PrimaryButton
              title="Done"
              variant="primary"
              size="md"
              onPress={handleDone}
              className="flex-1"
              fullWidth
            />
          </>
        )}
      </View>
    </View>
  );
}