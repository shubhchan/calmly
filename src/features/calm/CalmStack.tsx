import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { CalmScreen } from './CalmScreen';
import { BreathingSessionScreen } from './BreathingSessionScreen';
import { GroundingExerciseScreen } from './GroundingExerciseScreen';

type CalmStackParamList = Pick<RootStackParamList, 'CalmMain' | 'BreathingSession' | 'GroundingExercise'>;

const Stack = createNativeStackNavigator<CalmStackParamList>();

export function CalmStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CalmMain" component={CalmScreen} />
      <Stack.Screen name="BreathingSession" component={BreathingSessionScreen} />
      <Stack.Screen name="GroundingExercise" component={GroundingExerciseScreen} />
    </Stack.Navigator>
  );
}