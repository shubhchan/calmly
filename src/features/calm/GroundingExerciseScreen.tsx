import React, { useState } from 'react';
import { View, Text, ScrollView, Platform } from 'react-native';
import { useNavigation, useRoute, NavigationProp, RouteProp } from '@react-navigation/native';
import { Card, PrimaryButton, ProgressRing, AppIcon, ScreenHeader } from '../../components';
import type { AppIconName } from '../../components';
import { RootStackParamList, GroundingType } from '../../types/navigation';
import { useAppTheme } from '../../theme/ThemeContext';
import { calmRepository } from '../../database/repositories/calmRepository';
import { hapticFeedback } from '../../utils/haptics';
import Animated, { FadeIn, FadeInRight, useReducedMotion } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { ScreenContainer } from '../../components/layout/ScreenContainer';

const groundingSteps: Record<GroundingType, { label: string; instruction: string; icon: AppIconName }[]> = {
  '5-4-3-2-1': [
    { label: '5 Things You See', instruction: 'Look around and name 5 things you can see right now. Notice their shapes, light, and subtle details.', icon: 'l-eye' },
    { label: '4 Things You Feel', instruction: 'Notice 4 physical textures or sensations: the fabric of your clothes, chair support, or temperature.', icon: 'l-hands' },
    { label: '3 Things You Hear', instruction: 'Listen for 3 distinct sounds nearby or in the distance. Simply observe them without judgment.', icon: 'l-ear' },
    { label: '2 Things You Smell', instruction: 'Notice 2 scents in the air. If scent is faint, notice the fresh coolness of breathing in.', icon: 'i-flower' },
    { label: '1 Thing You Taste', instruction: 'Notice 1 taste: tea, water, or just resting your tongue gently on the palate.', icon: 'i-restaurant' },
  ],
  'body-scan': [
    { label: 'Feet & Legs', instruction: 'Bring gentle awareness to your feet. Notice any tingling or pressure. Allow your calf muscles to uncoil.', icon: 'l-pin' },
    { label: 'Hips & Core', instruction: 'Sense where your body meets the seat. Let your lower abdomen soften and expand freely.', icon: 'l-calm' },
    { label: 'Chest & Breath', instruction: 'Notice the quiet rhythm of your heart and ribcage. Breathe into any tight spaces.', icon: 'l-pulse' },
    { label: 'Shoulders & Hands', instruction: 'Unclench your fingers. Let your shoulders drop away from your ears. Release held effort.', icon: 'i-hand-l' },
    { label: 'Neck & Face', instruction: 'Unclench your jaw. Smooth the brow between your eyes. Let your expression rest in peaceful stillness.', icon: 'm-peaceful' },
  ],
  cognitive: [
    { label: 'Orient Time & Place', instruction: 'State today\'s date, day of week, and your present physical room out loud or in your mind.', icon: 'i-calendar' },
    { label: 'Physical Anchor', instruction: 'Look around and identify 3 concrete facts about this space: "I am sitting here, the room is quiet."', icon: 'i-loc' },
    { label: 'Grounding Mantra', instruction: 'Silently repeat: "I am safe in this present moment. This discomfort is temporary and will pass."', icon: 'l-lock' },
    { label: 'What I Control', instruction: 'Acknowledge what is in your hands right now: only this next breath and this current step.', icon: 'i-bulb' },
    { label: 'Warm Horizon', instruction: 'Recall one small, simple comfort you enjoy—a warm cup of tea, a cozy blanket, a kind smile.', icon: 'l-star' },
  ],
  physical: [
    { label: 'Firm Footing', instruction: 'Press both soles firmly into the ground. Feel the solid earth supporting your full weight.', icon: 'l-pin' },
    { label: 'Tense & Release', instruction: 'Squeeze your hands into tight fists for 5 seconds. Now release completely. Notice the contrast of relief.', icon: 'i-hand-l' },
    { label: 'Gentle Reach', instruction: 'Raise both arms toward the sky, lengthening your spine. Inhale deeply, then lower softly.', icon: 'l-expand' },
    { label: 'Tactile Grounding', instruction: 'Touch an object near you. Trace its edges, texture, and coolness with deliberate curiosity.', icon: 'i-hand-r' },
    { label: 'Slow March', instruction: 'Take 10 slow, deliberate steps in place. Feel each heel lift and settle securely.', icon: 'l-walk' },
  ],
};

const groundingTitles: Record<GroundingType, string> = {
  '5-4-3-2-1': '5-4-3-2-1 Senses',
  'body-scan': 'Body Scan Relaxation',
  cognitive: 'Cognitive Reset',
  physical: 'Physical Grounding',
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

  const { colors, isDark } = useAppTheme();

  const reducedMotion = useReducedMotion();
  const safeCurrentStep = Math.max(0, Math.min(currentStep, Math.max(0, safeSteps.length - 1)));
  const current = safeSteps[safeCurrentStep] ?? safeSteps[0];
  const progress = safeSteps.length > 0 ? (safeCurrentStep + 1) / safeSteps.length : 0;
  const safeTitle = groundingTitles[safeType] ?? 'Grounding Exercise';

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
      }).catch(() => {});
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      hapticFeedback.selection();
      setCurrentStep(currentStep - 1);
    }
  };

  const androidBarFallback = isDark ? 'rgba(24, 33, 48, 0.94)' : 'rgba(255, 255, 255, 0.94)';

  return (
    <ScreenContainer scroll={false} backgroundColor={colors.background.default}>
      <ScreenHeader title={safeTitle} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 130, alignItems: 'center' }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ marginBottom: 16, alignItems: 'center' }}>
          <ProgressRing
            progress={progress}
            size={76}
            strokeWidth={5}
            showPercentage={false}
          >
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.primary.default }}>
              {safeCurrentStep + 1}/{safeSteps.length}
            </Text>
          </ProgressRing>
        </View>

        {/* Step Indicator Pills */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 24 }}>
          {safeSteps.map((_, index) => (
            <View
              key={index}
              style={{
                width: index === currentStep ? 24 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: index <= currentStep ? colors.primary.default : colors.border.default,
              }}
            />
          ))}
        </View>

        {/* Exercise Card with animated step transition */}
        <Animated.View
          key={safeCurrentStep}
          entering={reducedMotion ? FadeIn.duration(150) : FadeInRight.duration(260)}
          style={{ width: '100%', marginBottom: 24 }}
        >
          <Card variant="elevated">
            <View style={{ padding: 22 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    backgroundColor: colors.primary.subtle,
                    borderWidth: 1,
                    borderColor: colors.primary.subtleBorder,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AppIcon name={current?.icon ?? 'i-leaf'} size={26} color={colors.primary.default} />
                </View>
                <View style={{ marginLeft: 14, flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: colors.primary.default, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Step {safeCurrentStep + 1}
                  </Text>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text.primary, marginTop: 2 }}>
                    {current?.label ?? 'Grounding'}
                  </Text>
                </View>
              </View>

              <Text style={{ fontSize: 16, lineHeight: 26, color: colors.text.secondary }}>
                {current?.instruction ?? ''}
              </Text>
            </View>
          </Card>
        </Animated.View>
      </ScrollView>

      {/* Liquid Glass Bottom Floating Bar */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 28,
          borderTopWidth: 1,
          borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : colors.border.default,
          overflow: 'hidden',
          flexDirection: 'row',
          gap: 12,
        }}
      >
        <BlurView
          intensity={isDark ? 65 : 85}
          tint={isDark ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'}
          style={[
            {
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: Platform.OS === 'android' ? androidBarFallback : 'transparent',
            },
          ]}
        />
        {!isComplete ? (
          <>
            <PrimaryButton
              title="Previous"
              variant="outline"
              size="md"
              onPress={handlePrevious}
              disabled={currentStep === 0}
              style={{ flex: 1 }}
              fullWidth={false}
            />
            <PrimaryButton
              title={currentStep === safeSteps.length - 1 ? 'Finish' : 'Next Step'}
              variant="primary"
              size="md"
              onPress={handleNext}
              style={{ flex: 2 }}
              fullWidth={false}
            />
          </>
        ) : (
          <>
            <PrimaryButton
              title="Repeat"
              variant="outline"
              size="md"
              onPress={() => { setCurrentStep(0); setIsComplete(false); }}
              style={{ flex: 1 }}
              fullWidth={false}
            />
            <PrimaryButton
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