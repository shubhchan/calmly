import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { JournalScreen } from './JournalScreen';
import { JournalEntryScreen } from './JournalEntryScreen';

type JournalStackParamList = Pick<RootStackParamList, 'Journal' | 'JournalEntry'>;

const Stack = createNativeStackNavigator<JournalStackParamList>();

export function JournalStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Journal" component={JournalScreen} />
      <Stack.Screen name="JournalEntry" component={JournalEntryScreen} />
    </Stack.Navigator>
  );
}