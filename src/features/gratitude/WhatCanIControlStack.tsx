import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { WhatCanIControlScreen } from './WhatCanIControlScreen';

type WhatCanIControlStackParamList = Pick<RootStackParamList, 'WhatCanIControl'>;

const Stack = createNativeStackNavigator<WhatCanIControlStackParamList>();

export function WhatCanIControlStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="WhatCanIControl" component={WhatCanIControlScreen} />
    </Stack.Navigator>
  );
}