import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { InsightsScreen } from './InsightsScreen';
import { MoodCalendarScreen } from './MoodCalendarScreen';

type InsightsStackParamList = Pick<RootStackParamList, 'InsightsMain' | 'MoodCalendar'>;

const Stack = createNativeStackNavigator<InsightsStackParamList>();

const FallbackScreen = () => null;
const SafeInsightsScreen = (InsightsScreen ?? FallbackScreen) as React.ComponentType<any>;
const SafeMoodCalendarScreen = (MoodCalendarScreen ?? FallbackScreen) as React.ComponentType<any>;

export function InsightsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="InsightsMain">
      <Stack.Screen name="InsightsMain" component={SafeInsightsScreen} />
      <Stack.Screen name="MoodCalendar" component={SafeMoodCalendarScreen} />
    </Stack.Navigator>
  );
}