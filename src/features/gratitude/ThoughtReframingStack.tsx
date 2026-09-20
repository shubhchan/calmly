import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { ThoughtReframingScreen } from './ThoughtReframingScreen';

type ThoughtReframingStackParamList = Pick<RootStackParamList, 'ThoughtReframing'>;

const Stack = createNativeStackNavigator<ThoughtReframingStackParamList>();

export function ThoughtReframingStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ThoughtReframing" component={ThoughtReframingScreen} />
    </Stack.Navigator>
  );
}