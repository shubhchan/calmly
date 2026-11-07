import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useNavigation, useRoute, NavigationProp, RouteProp } from '@react-navigation/native';
import { AppText, Button, ProgressRing, AppIcon, ScreenHeader } from '../../components';
import type { AppIconName } from '../../components';
import { RootStackParamList, GroundingType } from '../../types/navigation';
import { useAppTheme } from '../../theme/ThemeContext';
import { calmRepository } from '../../database/repositories/calmRepository';
import { hapticFeedback } from '../../utils/haptics';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const groundingSteps: Record<GroundingType, { label: string; instruction: string; icon: AppIconName }[]> = {
  '5-4-3-2-1': [
    { label: '5 things you see', instruction: 'Look around and name five things you can see. Notice their shape, light and detail.', icon: 'l-eye' },
    { label: '4 things you feel', instruction: 'Notice four physical textures or sensations: fabric, the chair, temperature.', icon: 'l-hands' },
    { label: '3 things you hear', instruction: 'Listen for three distinct sounds, near or far. Let them be there.', icon: 'l-ear' },
    { label: '2 things you smell', instruction: 'Notice two scents. If they are faint, feel the cool air as you breathe in.', icon: 'i-flower' },
    { label: '1 thing you taste', instruction: 'Notice one taste: tea, water, or simply your tongue resting.', icon: 'i-restaurant' },
  ],
  'body-scan': [
    { label: 'Feet and legs', instruction: 'Bring attention to your feet. Notice tingling or pressure. Let your calves uncoil.', icon: 'l-pin' },
    { label: 'Hips and core', instruction: 'Sense where your body meets the seat. Let your lower abdomen soften.', icon: 'l-calm' },
    { label: 'Chest and breath', instruction: 'Notice the quiet rhythm of your heart. Breathe into any tight space.', icon: 'l-pulse' },
    { label: 'Shoulders and hands', instruction: 'Unclench your fingers. Let your shoulders drop away from your ears.', icon: 'i-hand-l' },
    { label: 'Neck and face', instruction: 'Unclench your jaw, smooth your brow, and let your expression rest.', icon: 'm-peaceful' },
  ],
  cognitive: [
    { label: 'Orient time and place', instruction: 'State today\'s date, the day of the week, and the room you are in.', icon: 'i-calendar' },
    { label: 'Physical anchor', instruction: 'Name three facts about this space. “I am sitting here. The room is quiet.”', icon: 'i-loc' },
    { label: 'Grounding phrase', instruction: 'Silently repeat: “I am safe in this moment. This will pass.”', icon: 'l-lock' },
    { label: 'What I control', instruction: 'Name what is in your hands now: this breath and this step.', icon: 'i-bulb' },
    { label: 'Warm horizon', instruction: 'Recall one small comfort: a warm cup, a blanket, a kind face.', icon: 'l-star' },
  ],
  physical: [
    { label: 'Firm footing', instruction: 'Press both soles into the ground. Feel it hold your full weight.', icon: 'l-pin' },
    { label: 'Tense and release', instruction: 'Squeeze your hands into fists for five seconds, then release completely.', icon: 'i-hand-l' },
    { label: 'Gentle reach', instruction: 'Raise both arms, lengthen your spine, inhale, then lower softly.', icon: 'l-expand' },
    { label: 'Tactile grounding', instruction: 'Touch something near you. Trace its edge, texture and coolness.', icon: 'i-hand-r' },
    { label: 'Slow march', instruction: 'Take ten slow steps in place. Feel each heel lift and settle.', icon: 'l-walk' },
  ],
};

const groundingTitles: Record<GroundingType, string> = {
  '5-4-3-2-1': 'Senses',
  'body-scan': 'Body scan',
  cognitive: 'Cognitive reset',
  physical: 'Physical grounding',
};

/**
 * Grounding exercise — one instruction at a time, one action to continue.
 */
export function GroundingExerciseScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'GroundingExercise'>>();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { type = '5-4-3-2-1' } = (route?.params ?? {}) as { type?: GroundingType };

  const safeType: GroundingType = type && groundingSteps[type] ? type : '5-4-3-2-1';
  const steps = groundingSteps[safeType] ?? groundingSteps['5-4-3-2-1'] ?? [];
  const safeSteps = Array.isArray(steps) ? steps : [];
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  const safeCurrentStep = Math.max(0, Math.min(currentStep, Math.max(0, safeSteps.length - 1)));
  const current = safeSteps[safeCurrentStep] ?? safeSteps[0];
  const progress = safeSteps.length > 0 ? (safeCurrentStep + 1) / safeSteps.length : 0;
  const safeTitle = groundingTitles[safeType] ?? 'Grounding';

  const handleNext = () => {
    if (currentStep < safeSteps.length - 1) {
      hapticFeedback.selection();
      setCurrentStep(currentStep + 1);
    } else {
      hapticFeedback.success();
      setIsComplete(true);
      calmRepository.logSession({
        type: 'grounding',
        preset: safeType,
        duration: 180,
        completed: true,
      }).catch(() => { });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      hapticFeedback.selection();
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <ScreenContainer scroll={false} backgroundColor={colors.background.default}>
      <ScreenHeader title={safeTitle} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: 140 + insets.bottom,
          alignItems: 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        <ProgressRing progress={progress} size={72} strokeWidth={5} showPercentage={false}>
          <AppText variant="label" tone="link">
            {safeCurrentStep + 1}/{safeSteps.length}
          </AppText>
        </ProgressRing>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 18, marginBottom: 28 }}>
          {safeSteps.map((_, index) => (
            <View
              key={index}
              style={{
                width: index === currentStep ? 22 : 7,
                height: 7,
                borderRadius: 4,
                backgroundColor: index <= currentStep ? colors.primary.default : colors.border.default,
              }}
            />
          ))}
        </View>

        <View key={safeCurrentStep} style={{ width: '100%' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: colors.surface.muted,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AppIcon name={current?.icon ?? 'i-leaf'} size={22} color={colors.primary.default} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="overline" tone="tertiary">
                Step {safeCurrentStep + 1}
              </AppText>
              <AppText variant="h3" style={{ marginTop: 2 }}>
                {current?.label ?? 'Grounding'}
              </AppText>
            </View>
          </View>

          <AppText variant="bodyLarge" tone="secondary" style={{ marginTop: 24 }}>
            {current?.instruction ?? ''}
          </AppText>
        </View>
      </ScrollView>

      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 24,
          paddingTop: 14,
          paddingBottom: Math.max(insets.bottom + 12, 24),
          borderTopWidth: 1,
          borderTopColor: colors.border.default,
          backgroundColor: colors.background.default,
          flexDirection: 'row',
          gap: 12,
        }}
      >
        {!isComplete ? (
          <>
            <Button
              title="Back"
              variant="secondary"
              size="md"
              onPress={handlePrevious}
              disabled={currentStep === 0}
              style={{ flex: 1 }}
              fullWidth={false}
            />
            <Button
              title={currentStep === safeSteps.length - 1 ? 'Finish' : 'Next'}
              variant="primary"
              size="md"
              onPress={handleNext}
              style={{ flex: 2 }}
              fullWidth={false}
            />
          </>
        ) : (
          <>
            <Button
              title="Repeat"
              variant="secondary"
              size="md"
              onPress={() => { setCurrentStep(0); setIsComplete(false); }}
              style={{ flex: 1 }}
              fullWidth={false}
            />
            <Button
              title="Done"
              variant="primary"
              size="md"
              onPress={() => navigation.goBack()}
              style={{ flex: 2 }}
              fullWidth={false}
            />
          </>
        )}
      </View>
    </ScreenContainer>
  );
}
