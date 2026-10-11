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
import { JournalEntryScreen } from '../features/journal/JournalEntryScreen';
import { MoodCheckInScreen } from '../features/mood/MoodCheckInScreen';
import { BreathingSessionScreen } from '../features/calm/BreathingSessionScreen';
import { GroundingExerciseScreen } from '../features/calm/GroundingExerciseScreen';
import { BreathworkStudioScreen } from '../features/calm/BreathworkStudioScreen';
import { SoundscapesScreen } from '../features/calm/SoundscapesScreen';
import { SensoryGroundingScreen } from '../features/calm/SensoryGroundingScreen';
import { BodyScanScreen } from '../features/calm/BodyScanScreen';
import { PanicAnchorScreen } from '../features/calm/PanicAnchorScreen';
import { MoodCalendarScreen } from '../features/insights/MoodCalendarScreen';

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
  let colors: any;
  try {
    colors = useThemeColors();
  } catch {
    colors = { bgPrimary: '#FBF9F5', accentPrimary: '#3E7B52' };
  }
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors?.bgPrimary ?? '#FBF9F5',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <ActivityIndicator size="large" color={colors?.accentPrimary ?? '#3E7B52'} />
    </View>
  );
}

function TabCrashFallback({ tabName, onRetry }: { tabName: string; onRetry: () => void }) {
  let colors: any;
  try {
    colors = useThemeColors();
  } catch {
    colors = {
      bgPrimary: '#FBF9F5',
      textPrimary: '#1A212D',
      textTertiary: '#607085',
      accentPrimary: '#3E7B52',
    };
  }
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors?.bgPrimary ?? '#FBF9F5',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
      }}
    >
      <Text style={{ fontSize: 18, fontWeight: '700', color: colors?.textPrimary ?? '#1A212D', textAlign: 'center' }}>
        {tabName} couldn&apos;t load
      </Text>
      <Text style={{ marginTop: 8, fontSize: 14, color: colors?.textTertiary ?? '#607085', textAlign: 'center' }}>
        The rest of the app is fine — this tab hit a problem.
      </Text>
      <Pressable
        onPress={onRetry}
        style={{
          marginTop: 16,
          backgroundColor: colors?.accentPrimary ?? '#3E7B52',
          paddingVertical: 12,
          paddingHorizontal: 20,
          borderRadius: 12,
        }}
      >
        <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Try again</Text>
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
      return focused ? 'stats-chart' : 'stats-chart-outline';
    case 'Settings':
      return focused ? 'settings' : 'settings-outline';
    default:
      return 'ellipse';
  }
}

export function AppNavigator() {
  useRenderLog('app-navigator-render');
  useEffect(() => {
    bootLog('app-navigator-mounted');
  }, []);

  let themeColors: ReturnType<typeof useThemeColors> | undefined;
  try {
    themeColors = useThemeColors();
  } catch {
    themeColors = undefined;
  }
  const colors = themeColors ?? {
    accentPrimary: '#3E7B52',
    textTertiary: '#607085',
    textPrimary: '#1A212D',
    bgCard: '#FFFFFF',
    borderLight: '#E6E0D4',
    isDark: false,
  } as any;

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accentPrimary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.1,
          marginTop: -2,
          marginBottom: 4,
        },
        tabBarStyle: {
          backgroundColor: colors.bgCard,
          borderTopColor: colors.borderLight,
          borderTopWidth: 1,
          height: 60,
          paddingTop: 6,
          paddingBottom: 4,
          elevation: 4,
          shadowColor: colors.textPrimary ?? '#000000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: colors.isDark ? 0.3 : 0.04,
          shadowRadius: 8,
        },
        tabBarIcon: ({ color, focused }) => (
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={tabIcon(route.name, focused)} size={22} color={color} />
          </View>
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
      <RootStack.Screen name="JournalEntry" component={JournalEntryScreen} />
      <RootStack.Screen name="MoodCheckIn" component={MoodCheckInScreen} />
      <RootStack.Screen name="BreathingSession" component={BreathingSessionScreen} />
      <RootStack.Screen name="GroundingExercise" component={GroundingExerciseScreen} />
      <RootStack.Screen name="BreathworkStudio" component={BreathworkStudioScreen} />
      <RootStack.Screen name="Soundscapes" component={SoundscapesScreen} />
      <RootStack.Screen name="SensoryGrounding" component={SensoryGroundingScreen} />
      <RootStack.Screen name="BodyScan" component={BodyScanScreen} />
      <RootStack.Screen name="PanicAnchor" component={PanicAnchorScreen} />
      <RootStack.Screen name="MoodCalendar" component={MoodCalendarScreen} />
    </RootStack.Navigator>
  );
}
