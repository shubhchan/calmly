import React, { Suspense, useEffect, useRef } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator, NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { TabParamList, RootStackParamList } from '../types/navigation';
import { useThemeColors } from '../theme/ThemeContext';
import { bootLog } from '../components/ErrorBoundary';
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

/**
 * Logs the first render attempt of a navigator (body runs even if the commit
 * later stalls), so the boot trail distinguishes "render never attempted"
 * from "rendered but never committed".
 */
function useRenderLog(label: string) {
  const loggedRef = useRef(false);
  if (!loggedRef.current) {
    loggedRef.current = true;
    bootLog(label);
  }
}

function TabLoadingFallback() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#FDFBF7',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <ActivityIndicator size="large" color="#5A955A" />
    </View>
  );
}

function TabCrashFallback({ tabName, onRetry }: { tabName: string; onRetry: () => void }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#FDFBF7',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
      }}
    >
      <Text style={{ fontSize: 18, fontWeight: '700', color: '#1E232E', textAlign: 'center' }}>
        {tabName} couldn&apos;t load
      </Text>
      <Text style={{ marginTop: 8, fontSize: 14, color: '#425474', textAlign: 'center' }}>
        The rest of the app is fine — this tab hit a problem.
      </Text>
      <Pressable
        onPress={onRetry}
        style={{
          marginTop: 16,
          backgroundColor: '#5A955A',
          paddingVertical: 12,
          paddingHorizontal: 20,
          borderRadius: 10,
        }}
      >
        <Text style={{ color: '#FDFBF7', fontWeight: '700' }}>Try again</Text>
      </Pressable>
    </View>
  );
}

/**
 * Isolates one tab so a single bad tab screen can never blank the whole
 * navigation container: render errors show an inline retry card for that tab,
 * and a suspended tab shows a spinner instead of blocking the root commit.
 */
class TabErrorBoundary extends React.Component<
  { tabName: string; children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    bootLog(`tab-crash:${this.props.tabName}`);
    console.error(`Tab ${this.props.tabName} crashed:`, error);
  }

  render() {
    if (this.state.failed) {
      return (
        <TabCrashFallback
          tabName={this.props.tabName}
          onRetry={() => this.setState({ failed: false })}
        />
      );
    }
    return this.props.children;
  }
}

function guardTab<T extends React.ComponentType<any>>(Component: T, tabName: string): T {
  const Guarded = (props: any) => (
    <TabErrorBoundary tabName={tabName}>
      <Suspense fallback={<TabLoadingFallback />}>
        <Component {...props} />
      </Suspense>
    </TabErrorBoundary>
  );
  Guarded.displayName = `Guarded(${tabName})`;
  return Guarded as unknown as T;
}

const GuardedHomeStack = guardTab(HomeStack, 'Home');
const GuardedJournalStack = guardTab(JournalStack, 'Journal');
const GuardedCalmStack = guardTab(CalmStack, 'Calm');
const GuardedInsightsStack = guardTab(InsightsStack, 'Insights');
const GuardedSettingsStack = guardTab(SettingsStack, 'Settings');

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
  useRenderLog('app-navigator-render');
  useEffect(() => {
    bootLog('app-navigator-mounted');
  }, []);

  // Same defensive pattern as HomeScreen: a theme failure must never take
  // down the whole tab bar — fall back to light-theme literals.
  let themeColors: ReturnType<typeof useThemeColors> | undefined;
  try {
    themeColors = useThemeColors();
  } catch {
    themeColors = undefined;
  }
  const colors = themeColors ?? {
    accentPrimary: '#5A955A',
    textTertiary: '#425474',
    bgCard: '#FFFFFF',
    borderLight: '#E4DEBC',
  };

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
      <Tab.Screen name="Home" component={GuardedHomeStack} />
      <Tab.Screen name="Journal" component={GuardedJournalStack} />
      <Tab.Screen name="Calm" component={GuardedCalmStack} />
      <Tab.Screen name="Insights" component={GuardedInsightsStack} />
      <Tab.Screen name="Settings" component={GuardedSettingsStack} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  useRenderLog('root-navigator-render');
  useEffect(() => {
    bootLog('root-navigator-mounted');
  }, []);

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
