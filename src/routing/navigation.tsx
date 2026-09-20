import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator, NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { TabParamList, RootStackParamList } from '../types/navigation';
import { useThemeColors } from '../theme/ThemeContext';
import { HomeStack } from '../features/home/HomeStack';
import { JournalStack } from '../features/journal/JournalStack';
import { CalmStack } from '../features/calm/CalmStack';
import { InsightsStack } from '../features/insights/InsightsStack';
import { SettingsStack } from '../features/settings/SettingsStack';
import { HabitListScreen } from '../features/habits/HabitListScreen';
import { HabitDetailScreen } from '../features/habits/HabitDetailScreen';
import { HabitFormScreen } from '../features/habits/HabitFormScreen';
import { RoutinesScreen } from '../features/habits/RoutinesScreen';
import { RoutineDetailScreen } from '../features/habits/RoutineDetailScreen';
import { GratitudeScreen } from '../features/gratitude/GratitudeScreen';
import { GratitudeFormScreen } from '../features/gratitude/GratitudeFormScreen';
import { AffirmationsScreen } from '../features/gratitude/AffirmationsScreen';
import { AffirmationDetailScreen } from '../features/gratitude/AffirmationDetailScreen';
import { SelfCompassionScreen } from '../features/gratitude/SelfCompassionScreen';
import { WhatCanIControlScreen } from '../features/gratitude/WhatCanIControlScreen';
import { ThoughtReframingScreen } from '../features/gratitude/ThoughtReframingScreen';
import { OnboardingScreen } from '../features/settings/OnboardingScreen';
import { AppLockScreen } from '../features/settings/AppLockScreen';
import { AppLockSettingsScreen } from '../features/settings/AppLockSettingsScreen';
import { NotificationsScreen } from '../features/settings/NotificationsScreen';
import { SetPinScreen } from '../features/settings/SetPinScreen';
import { DataManagementScreen } from '../features/settings/DataManagementScreen';

const Tab = createBottomTabNavigator<TabParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

const screenOptions: NativeStackNavigationOptions = { headerShown: false };

type TabIconName = React.ComponentProps<typeof Ionicons>['name'];

function tabIcon(routeName: keyof TabParamList, focused: boolean): TabIconName {
  switch (routeName) {
    case 'Home':
      return focused ? 'home' : 'home-outline';
    case 'Journal':
      return focused ? 'book' : 'book-outline';
    case 'Calm':
      return focused ? 'leaf' : 'leaf-outline';
    case 'Insights':
      return focused ? 'bar-chart' : 'bar-chart-outline';
    case 'Settings':
      return focused ? 'person' : 'person-outline';
    default:
      return 'ellipse';
  }
}

export function AppNavigator() {
  const colors = useThemeColors();

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accentPrimary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.bgCard,
          borderTopColor: colors.borderLight,
          borderTopWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarIcon: ({ color, size, focused }) => (
          <Ionicons name={tabIcon(route.name, focused)} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Journal" component={JournalStack} />
      <Tab.Screen name="Calm" component={CalmStack} />
      <Tab.Screen name="Insights" component={InsightsStack} />
      <Tab.Screen name="Settings" component={SettingsStack} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  return (
    <RootStack.Navigator initialRouteName="App" screenOptions={screenOptions}>
      <RootStack.Screen name="App" component={AppNavigator} />
      {/* Each root route renders its leaf screen directly (not a nested stack),
          so navigate('HabitDetail', { id }) lands on the detail screen instead
          of a re-mounted stack stuck on its initial list route. */}
      <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
      <RootStack.Screen name="AppLock" component={AppLockScreen} />
      <RootStack.Screen name="Habits" component={HabitListScreen} />
      <RootStack.Screen name="HabitDetail" component={HabitDetailScreen} />
      <RootStack.Screen name="HabitForm" component={HabitFormScreen} />
      <RootStack.Screen name="Routines" component={RoutinesScreen} />
      <RootStack.Screen name="RoutineDetail" component={RoutineDetailScreen} />
      <RootStack.Screen name="Gratitude" component={GratitudeScreen} />
      <RootStack.Screen name="GratitudeForm" component={GratitudeFormScreen} />
      <RootStack.Screen name="Affirmations" component={AffirmationsScreen} />
      <RootStack.Screen name="AffirmationDetail" component={AffirmationDetailScreen} />
      <RootStack.Screen name="SelfCompassion" component={SelfCompassionScreen} />
      <RootStack.Screen name="WhatCanIControl" component={WhatCanIControlScreen} />
      <RootStack.Screen name="ThoughtReframing" component={ThoughtReframingScreen} />
      <RootStack.Screen name="Notifications" component={NotificationsScreen} />
      <RootStack.Screen name="AppLockSettings" component={AppLockSettingsScreen} />
      <RootStack.Screen name="SetPin" component={SetPinScreen} />
      <RootStack.Screen name="DataManagement" component={DataManagementScreen} />
    </RootStack.Navigator>
  );
}
