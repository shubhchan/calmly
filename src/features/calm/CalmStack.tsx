import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { CalmScreen } from './CalmScreen';
import { BreathworkStudioScreen } from './BreathworkStudioScreen';
import { SoundscapesScreen } from './SoundscapesScreen';
import { SensoryGroundingScreen } from './SensoryGroundingScreen';
import { BodyScanScreen } from './BodyScanScreen';
import { PanicAnchorScreen } from './PanicAnchorScreen';
import { BreathingSessionScreen } from './BreathingSessionScreen';
import { GroundingExerciseScreen } from './GroundingExerciseScreen';

type CalmStackParamList = Pick<
  RootStackParamList,
  | 'CalmMain'
  | 'BreathworkStudio'
  | 'Soundscapes'
  | 'SensoryGrounding'
  | 'BodyScan'
  | 'PanicAnchor'
  | 'BreathingSession'
  | 'GroundingExercise'
>;

const Stack = createNativeStackNavigator<CalmStackParamList>();

export function CalmStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CalmMain" component={CalmScreen} />
      <Stack.Screen name="BreathworkStudio" component={BreathworkStudioScreen} />
      <Stack.Screen name="Soundscapes" component={SoundscapesScreen} />
      <Stack.Screen name="SensoryGrounding" component={SensoryGroundingScreen} />
      <Stack.Screen name="BodyScan" component={BodyScanScreen} />
      <Stack.Screen name="PanicAnchor" component={PanicAnchorScreen} />
      <Stack.Screen name="BreathingSession" component={BreathingSessionScreen} />
      <Stack.Screen name="GroundingExercise" component={GroundingExerciseScreen} />
    </Stack.Navigator>
  );
}