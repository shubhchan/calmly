import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { SelfCompassionScreen } from './SelfCompassionScreen';

type SelfCompassionStackParamList = Pick<RootStackParamList, 'SelfCompassion'>;

const Stack = createNativeStackNavigator<SelfCompassionStackParamList>();

export function SelfCompassionStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SelfCompassion" component={SelfCompassionScreen} />
    </Stack.Navigator>
  );
}