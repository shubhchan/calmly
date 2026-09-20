import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleProp, ViewStyle } from 'react-native';
import { useNavigation, useRoute, NavigationProp, RouteProp } from '@react-navigation/native';
import { Card, CardContent, PrimaryButton, ProgressRing } from '../../components';
import { RootStackParamList, MoodType } from '../../types/navigation';

const moods: { id: MoodType; label: string; emoji: string; color: string }[] = [
  { id: 'happy', label: 'Happy', emoji: '😊', color: '#5A955A' },
  { id: 'peaceful', label: 'Peaceful', emoji: '😌', color: '#6B9BCD' },
  { id: 'grateful', label: 'Grateful', emoji: '🙏', color: '#EB876D' },
  { id: 'content', label: 'Content', emoji: '😌', color: '#74AC74' },
  { id: 'hopeful', label: 'Hopeful', emoji: '🌱', color: '#877FC5' },
  { id: 'excited', label: 'Excited', emoji: '🤩', color: '#EF9F8A' },
  { id: 'stressed', label: 'Stressed', emoji: '😰', color: '#EB697F' },
  { id: 'anxious', label: 'Anxious', emoji: '😟', color: '#EF8799' },
  { id: 'overwhelmed', label: 'Overwhelmed', emoji: '😵', color: '#5F9BB4' },
  { id: 'sad', label: 'Sad', emoji: '😢', color: '#877FC5' },
  { id: 'angry', label: 'Angry', emoji: '😠', color: '#EB876D' },
  { id: 'exhausted', label: 'Exhausted', emoji: '😴', color: '#74AC74' },
];

type Step = 'mood' | 'intensity' | 'stress' | 'energy' | 'context' | 'complete';

export function MoodCheckInScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'MoodCheckIn'>>();
  const { fromHome } = route.params ?? {};

  const [step, setStep] = useState<Step>('mood');
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [intensity, setIntensity] = useState(5);
  const [stress, setStress] = useState(5);
  const [energy, setEnergy] = useState<'low' | 'medium' | 'high'>('medium');
  const [context, setContext] = useState('');
  const [needs, setNeeds] = useState('');

  const progress = {
    mood: 0.17,
    intensity: 0.33,
    stress: 0.5,
    energy: 0.67,
    context: 0.83,
    complete: 1,
  }[step];

  const goBack = () => {
    if (step === 'mood') {
      navigation.goBack();
    } else if (step === 'intensity') {
      setStep('mood');
    } else if (step === 'stress') {
      setStep('intensity');
    } else if (step === 'energy') {
      setStep('stress');
    } else if (step === 'context') {
      setStep('energy');
    }
  };

  const goNext = () => {
    if (step === 'mood' && selectedMood) {
      setStep('intensity');
    } else if (step === 'intensity') {
      setStep('stress');
    } else if (step === 'stress') {
      setStep('energy');
    } else if (step === 'energy') {
      setStep('context');
    } else if (step === 'context') {
      setStep('complete');
      setTimeout(() => {
        navigation.goBack();
      }, 1000);
    }
  };

  const renderMoodSelector = () => (
    <View>
      <Text className="text-headline-md font-semibold mb-6 text-center" style={{ color: '#1E232E' }}>
        How are you feeling right now?
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 10, paddingBottom: 10 }}
      >
        {moods.map((mood) => (
          <Pressable
            key={mood.id}
            onPress={() => {
              setSelectedMood(mood.id);
              setTimeout(() => goNext(), 150);
            }}
            className={`flex items-center gap-2 px-4 py-3 rounded-2xl min-w-[100px] transition-all ${
              selectedMood === mood.id
                ? 'ring-2 ring-[var(--color-accent-primary)] scale-105'
                : ''
            }`}
            style={{
              backgroundColor: selectedMood === mood.id ? mood.color + '20' : '#FFFFFF',
              borderWidth: 1,
              borderColor: selectedMood === mood.id ? mood.color : '#E4DEBC',
            }}
          >
            <Text style={{ fontSize: 28 }}>{mood.emoji}</Text>
            <Text className="text-label-md font-semibold" style={{ color: selectedMood === mood.id ? mood.color : '#1E232E' }}>
              {mood.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );

  const renderSliderStep = (
    label: string,
    value: number,
    onChange: (v: number) => void,
    min: number,
    max: number,
    step: number,
    emoji: string
  ) => (
    <View>
      <Text className="text-headline-md font-semibold mb-2 text-center" style={{ color: '#1E232E' }}>
        {label}
      </Text>
      <Text className="text-body-lg font-bold text-center mb-6" style={{ color: '#1E232E' }}>
        {value} / {max}
      </Text>
      <View className="flex-1 flex items-center justify-center">
        <Text style={{ fontSize: 64 }}>{emoji}</Text>
      </View>
      <View className="w-full mt-8">
        <View className="flex-row justify-between mb-2">
          <Text className="text-body-sm" style={{ color: '#425474' }}>{min}</Text>
          <Text className="text-body-sm" style={{ color: '#425474' }}>{max}</Text>
        </View>
        <View className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#E4DEBC' }}>
          <View
            className="h-full rounded-full transition-all duration-100"
            style={{
              width: `${((value - min) / (max - min)) * 100}%`,
              backgroundColor: '#5A955A',
            }}
          />
        </View>
        <View className="flex-row justify-between mt-4">
          {[min, Math.round((min + max) / 2), max].map((v) => (
            <Pressable
              key={v}
              onPress={() => onChange(v)}
              className={`w-12 h-12 rounded-full flex items-center justify-center ${value === v ? 'ring-2' : ''}`}
              style={{
                backgroundColor: value === v ? '#5A955A' : '#F5F0DE',
                borderColor: value === v ? '#5A955A' : 'transparent',
              }}
            >
              <Text className="text-label-md font-semibold" style={{ color: value === v ? 'white' : '#1E232E' }}>
                {v}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );

  const renderEnergyStep = () => (
    <View>
      <Text className="text-headline-md font-semibold mb-6 text-center" style={{ color: '#1E232E' }}>
        What's your energy level?
      </Text>
      <View className="flex-row gap-4">
        {[
          { value: 'low' as const, label: 'Low', emoji: '🔋', desc: 'Drained, tired' },
          { value: 'medium' as const, label: 'Medium', emoji: '⚡', desc: 'Okay, normal' },
          { value: 'high' as const, label: 'High', emoji: '🚀', desc: 'Energized, ready' },
        ].map((e) => (
          <Pressable
            key={e.value}
            onPress={() => setEnergy(e.value)}
            className={`flex-1 flex items-center p-4 rounded-2xl border-2 transition-all ${
              energy === e.value
                ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-bg)]'
                : 'border-[var(--color-border-light)]'
            }`}
          >
            <Text style={{ fontSize: 32 }}>{e.emoji}</Text>
            <Text className={`text-label-md font-semibold mt-2 ${energy === e.value ? '' : ''}`} style={{ color: energy === e.value ? '#5A955A' : '#1E232E' }}>
              {e.label}
            </Text>
            <Text className="text-body-sm mt-1 text-center" style={{ color: '#425474' }}>
              {e.desc}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  const renderContextStep = () => (
    <View>
      <Text className="text-headline-md font-semibold mb-2 text-center" style={{ color: '#1E232E' }}>
        What happened? (Optional)
      </Text>
      <Text className="text-body-md mb-6 text-center" style={{ color: '#425474' }}>
        A few words about what's going on...
      </Text>
      <View className="space-y-4">
        <TextInput
          placeholder="What happened?"
          value={context}
          onChangeText={setContext}
          multiline
          numberOfLines={4}
          className="text-body-lg p-4 rounded-xl border"
          style={{
            backgroundColor: '#FFFFFF',
            borderColor: '#E4DEBC',
            color: '#1E232E',
          }}
        />
        <TextInput
          placeholder="What do you need right now?"
          value={needs}
          onChangeText={setNeeds}
          multiline
          numberOfLines={4}
          className="text-body-lg p-4 rounded-xl border"
          style={{
            backgroundColor: '#FFFFFF',
            borderColor: '#E4DEBC',
            color: '#1E232E',
          }}
        />
      </View>
    </View>
  );

  const renderCompleteStep = () => (
    <View className="flex items-center justify-center">
      <View
        className="flex items-center justify-center rounded-full mb-6"
        style={{
          width: 80,
          height: 80,
          backgroundColor: '#5A955A20',
        }}
      >
        <Text style={{ fontSize: 40 }}>✅</Text>
      </View>
      <Text className="text-display-sm font-bold text-center mb-2" style={{ color: '#1E232E' }}>
        Check-in complete!
      </Text>
      <Text className="text-body-lg text-center" style={{ color: '#34415A' }}>
        Thanks for checking in with yourself 🌱
      </Text>
    </View>
  );

  return (
    <View className="flex-1 bg-[var(--color-bg-primary)] flex flex-col">
      <View className="px-6 py-4 flex-row items-center justify-between">
        <Pressable onPress={goBack} className="p-2" disabled={step === 'complete'}>
          <Text style={{ fontSize: 24 }}>←</Text>
        </Pressable>
        <ProgressRing progress={progress} size={40} strokeWidth={4} showPercentage={false} />
        {step === 'complete' && <View style={{ width: 40 }} />}
      </View>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 100 }}>
        {step === 'mood' && renderMoodSelector()}
        {step === 'intensity' && renderSliderStep('How intense is this feeling?', intensity, setIntensity, 1, 10, 1, selectedMood ? moods.find(m => m.id === selectedMood)!.emoji : '😊')}
        {step === 'stress' && renderSliderStep('How stressed are you?', stress, setStress, 1, 10, 1, '😰')}
        {step === 'energy' && renderEnergyStep()}
        {step === 'context' && renderContextStep()}
        {step === 'complete' && renderCompleteStep()}
      </ScrollView>

      {step !== 'complete' && step !== 'mood' && (
        <View className="px-6 pb-8 flex-row gap-3">
          <PrimaryButton
            title="Back"
            variant="outline"
            size="md"
            onPress={goBack}
            className="flex-1"
            fullWidth
          />
          <PrimaryButton
            title="Next"
            variant="primary"
            size="md"
            onPress={goNext}
            disabled={step === 'intensity' && !intensity || step === 'stress' && !stress}
            className="flex-1"
            fullWidth
          />
        </View>
      )}
    </View>
  );
}