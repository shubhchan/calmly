import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { MoodCheckInScreen } from './MoodCheckInScreen';

type MoodStackParamList = Pick<RootStackParamList, 'MoodCheckIn'>;

const Stack = createNativeStackNavigator<MoodStackParamList>();

export function MoodStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MoodCheckIn" component={MoodCheckInScreen} />
    </Stack.Navigator>
  );
}