import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { HomeScreen } from './HomeScreen';
import { MoodCheckInScreen } from '../mood/MoodCheckInScreen';

type HomeStackParamList = Pick<RootStackParamList, 'Home' | 'MoodCheckIn'>;

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="MoodCheckIn" component={MoodCheckInScreen} />
    </Stack.Navigator>
  );
}