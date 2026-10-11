import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { SettingsScreen } from './SettingsScreen';
import { NotificationsScreen } from './NotificationsScreen';
import { AppLockSettingsScreen } from './AppLockSettingsScreen';
import { SetPinScreen } from './SetPinScreen';
import { DataManagementScreen } from './DataManagementScreen';
import { OnboardingScreen } from './OnboardingScreen';

type SettingsStackParamList = Pick<RootStackParamList, 'SettingsMain' | 'Notifications' | 'AppLockSettings' | 'SetPin' | 'DataManagement' | 'Onboarding'>;

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export function SettingsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SettingsMain" component={SettingsScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="AppLockSettings" component={AppLockSettingsScreen} />
      <Stack.Screen name="SetPin" component={SetPinScreen} />
      <Stack.Screen name="DataManagement" component={DataManagementScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
    </Stack.Navigator>
  );
}