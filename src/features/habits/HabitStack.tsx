import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { HabitListScreen } from './HabitListScreen';
import { HabitDetailScreen } from './HabitDetailScreen';
import { HabitFormScreen } from './HabitFormScreen';
import { RoutinesScreen } from './RoutinesScreen';
import { RoutineDetailScreen } from './RoutineDetailScreen';

type HabitStackParamList = Pick<RootStackParamList, 'Habits' | 'HabitDetail' | 'HabitForm' | 'Routines' | 'RoutineDetail'>;

const Stack = createNativeStackNavigator<HabitStackParamList>();

export function HabitStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Habits" component={HabitListScreen} />
      <Stack.Screen name="HabitDetail" component={HabitDetailScreen} />
      <Stack.Screen name="HabitForm" component={HabitFormScreen} />
      <Stack.Screen name="Routines" component={RoutinesScreen} />
      <Stack.Screen name="RoutineDetail" component={RoutineDetailScreen} />
    </Stack.Navigator>
  );
}