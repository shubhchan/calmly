import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { GratitudeScreen } from './GratitudeScreen';
import { GratitudeFormScreen } from './GratitudeFormScreen';

type GratitudeStackParamList = Pick<RootStackParamList, 'Gratitude' | 'GratitudeForm'>;

const Stack = createNativeStackNavigator<GratitudeStackParamList>();

export function GratitudeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Gratitude" component={GratitudeScreen} />
      <Stack.Screen name="GratitudeForm" component={GratitudeFormScreen} />
    </Stack.Navigator>
  );
}