import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { AffirmationsScreen } from './AffirmationsScreen';
import { AffirmationDetailScreen } from './AffirmationDetailScreen';

type AffirmationsStackParamList = Pick<RootStackParamList, 'Affirmations' | 'AffirmationDetail'>;

const Stack = createNativeStackNavigator<AffirmationsStackParamList>();

export function AffirmationsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Affirmations" component={AffirmationsScreen} />
      <Stack.Screen name="AffirmationDetail" component={AffirmationDetailScreen} />
    </Stack.Navigator>
  );
}