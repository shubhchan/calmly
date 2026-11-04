import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { CalmScreen } from './CalmScreen';

type CalmStackParamList = Pick<RootStackParamList, 'CalmMain'>;

const Stack = createNativeStackNavigator<CalmStackParamList>();

export function CalmStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CalmMain" component={CalmScreen} />
    </Stack.Navigator>
  );
}