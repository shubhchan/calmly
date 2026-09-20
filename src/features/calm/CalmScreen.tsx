import React from 'react';
import { View, Text, ScrollView, Pressable, StyleProp, ViewStyle } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { Card, CardContent, PrimaryButton, ProgressRing } from '../../components';
import { RootStackParamList, BreathingPreset, GroundingType } from '../../types/navigation';

const breathingPresets: { id: BreathingPreset; label: string; description: string; pattern: number[] }[] = [
  { id: 'box', label: 'Box Breathing', description: '4-4-4-4', pattern: [4, 4, 4, 4] },
  { id: '4-6', label: '4-6 Breathing', description: 'Inhale 4, Exhale 6', pattern: [4, 0, 6, 0] },
  { id: '4-7-8', label: '4-7-8 Technique', description: 'Inhale 4, Hold 7, Exhale 8', pattern: [4, 7, 8, 0] },
  { id: 'deep', label: 'Deep Breathing', description: '6-2-8', pattern: [6, 2, 8, 0] },
  { id: 'slow', label: 'Slow Breathing', description: '5-5-5', pattern: [5, 0, 5, 0] },
  { id: 'relaxation', label: 'Relaxation', description: '4-6-8', pattern: [4, 6, 8, 0] },
];

const groundingExercises: { id: GroundingType; label: string; description: string; icon: string }[] = [
  { id: '5-4-3-2-1', label: '5-4-3-2-1 Senses', description: 'Ground through your senses', icon: '👁️' },
  { id: 'body-scan', label: 'Body Scan', description: 'Progressive relaxation', icon: '🧘' },
  { id: 'cognitive', label: 'Cognitive Grounding', description: 'Reorient your thoughts', icon: '🧠' },
  { id: 'physical', label: 'Physical Grounding', description: 'Connect with your body', icon: '🤲' },
];

const emotionalStates = [
  { id: 'anxious', label: 'Anxious', icon: '😰', color: '#EB697F' },
  { id: 'angry', label: 'Angry', icon: '😠', color: '#EB876D' },
  { id: 'sad', label: 'Sad', icon: '😢', color: '#877FC5' },
  { id: 'overwhelmed', label: 'Overwhelmed', icon: '😵', color: '#5F9BB4' },
  { id: 'overthinking', label: 'Overthinking', icon: '🤯', color: '#6B9BCD' },
  { id: 'exhausted', label: 'Exhausted', icon: '😴', color: '#5A955A' },
  { id: 'encouragement', label: 'Need encouragement', icon: '💪', color: '#5A955A' },
  { id: 'relax', label: 'Want to relax', icon: '🌿', color: '#877FC5' },
];

export function CalmScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const handleBreathing = (preset: BreathingPreset) => {
    navigation.navigate('BreathingSession', { preset });
  };

  const handleGrounding = (type: GroundingType) => {
    navigation.navigate('GroundingExercise', { type });
  };

  return (
    <ScrollView
      className="flex-1 bg-[var(--color-bg-primary)]"
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 100 }}
    >
      <View className="mb-8">
        <Text className="text-display-sm font-bold" style={{ color: '#1E232E' }}>
          Calm Mode
        </Text>
        <Text className="text-body-lg mt-1" style={{ color: '#34415A' }}>
          Find your center. Choose what you need right now.
        </Text>
      </View>

      <Card variant="elevated" className="mb-6">
        <CardContent>
          <Text className="text-headline-md font-semibold mb-4" style={{ color: '#1E232E' }}>
            How are you feeling?
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10, paddingBottom: 4 }}
          >
            {emotionalStates.map((state) => (
              <Pressable
                key={state.id}
                onPress={() => {
                  if (state.id === 'anxious' || state.id === 'overwhelmed') {
                    handleBreathing('4-7-8');
                  } else if (state.id === 'angry') {
                    handleBreathing('box');
                  } else if (state.id === 'exhausted') {
                    handleGrounding('body-scan');
                  } else {
                    handleBreathing('relaxation');
                  }
                }}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl min-w-[140px]"
                style={{ backgroundColor: state.color + '15', borderWidth: 1, borderColor: state.color + '40' }}
              >
                <Text style={{ fontSize: 24 }}>{state.icon}</Text>
                <Text className="text-label-md font-semibold" style={{ color: state.color }}>
                  {state.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </CardContent>
      </Card>

      <Card variant="elevated" className="mb-6">
        <CardContent>
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-headline-md font-semibold" style={{ color: '#1E232E' }}>
              Breathing Exercises
            </Text>
          </View>
          <View className="space-y-3">
            {breathingPresets.map((preset) => (
              <Pressable
                key={preset.id}
                onPress={() => handleBreathing(preset.id)}
                className="flex-row items-center justify-between p-4 rounded-2xl"
                style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E4DEBC' }}
              >
                <View className="flex-row items-center">
                  <View
                    className="flex items-center justify-center rounded-xl"
                    style={{
                      width: 48,
                      height: 48,
                      backgroundColor: '#F0F4F0',
                    }}
                  >
                    <Text style={{ fontSize: 20 }}>🌬️</Text>
                  </View>
                  <View className="ml-3">
                    <Text className="text-headline-sm font-semibold" style={{ color: '#1E232E' }}>
                      {preset.label}
                    </Text>
                    <Text className="text-body-sm" style={{ color: '#425474' }}>
                      {preset.description}
                    </Text>
                  </View>
                </View>
                <Text className="text-label-md" style={{ color: '#5A955A' }}>
                  Start
                </Text>
              </Pressable>
            ))}
          </View>
        </CardContent>
      </Card>

      <Card variant="elevated" className="mb-6">
        <CardContent>
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-headline-md font-semibold" style={{ color: '#1E232E' }}>
              Grounding Exercises
            </Text>
          </View>
          <View className="space-y-3">
            {groundingExercises.map((exercise) => (
              <Pressable
                key={exercise.id}
                onPress={() => handleGrounding(exercise.id)}
                className="flex-row items-center justify-between p-4 rounded-2xl"
                style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E4DEBC' }}
              >
                <View className="flex-row items-center">
                  <View
                    className="flex items-center justify-center rounded-xl"
                    style={{
                      width: 48,
                      height: 48,
                      backgroundColor: '#F0F4F0',
                    }}
                  >
                    <Text style={{ fontSize: 20 }}>{exercise.icon}</Text>
                  </View>
                  <View className="ml-3">
                    <Text className="text-headline-sm font-semibold" style={{ color: '#1E232E' }}>
                      {exercise.label}
                    </Text>
                    <Text className="text-body-sm" style={{ color: '#425474' }}>
                      {exercise.description}
                    </Text>
                  </View>
                </View>
                <Text className="text-label-md" style={{ color: '#5A955A' }}>
                  Start
                </Text>
              </Pressable>
            ))}
          </View>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent className="flex items-center text-center py-8">
          <Text style={{ fontSize: 48 }}>🚨</Text>
          <Text className="text-headline-md font-semibold mt-4" style={{ color: '#1E232E' }}>
            Emergency Calm
          </Text>
          <Text className="text-body-md mt-2" style={{ color: '#34415A' }}>
            A 60-second guided sequence for immediate relief
          </Text>
          <PrimaryButton
            title="Start Emergency Calm"
            variant="primary"
            size="md"
            onPress={() => handleBreathing('4-7-8')}
            className="mt-6 w-auto"
            fullWidth={false}
            leftIcon={<Text style={{ fontSize: 18 }}>⚡</Text>}
          />
        </CardContent>
      </Card>
    </ScrollView>
  );
}