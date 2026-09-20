import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { InsightsScreen } from './InsightsScreen';
import { MoodCalendarScreen } from './MoodCalendarScreen';

type InsightsStackParamList = Pick<RootStackParamList, 'Insights' | 'MoodCalendar'>;

const Stack = createNativeStackNavigator<InsightsStackParamList>();

export function InsightsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Insights" component={InsightsScreen} />
      <Stack.Screen name="MoodCalendar" component={MoodCalendarScreen} />
    </Stack.Navigator>
  );
}