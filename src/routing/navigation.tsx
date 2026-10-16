import React, { Suspense, useEffect, useRef, useCallback } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  Easing,
} from 'react-native-reanimated';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { hapticFeedback } from '../utils/haptics';
import { fontFamilies } from '../theme/typography';

const Tab = createBottomTabNavigator<TabParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

/**
 * Standard pushed sub-pages: 100% native platform transition (UINavigationController / Fragment).
 * Driven directly by the GPU/render thread with subpixel gesture parallax and zero dropped frames.
 */
const defaultStackOptions: NativeStackNavigationOptions = {
  headerShown: false,
  animation: 'default',
  gestureEnabled: true,
};

/**
 * Introspective modals (Journal Entry, Mood Check-In, Forms):
 * Clean native bottom sheet presentation.
 */
const modalOptions: NativeStackNavigationOptions = {
  headerShown: false,
  animation: 'slide_from_bottom',
  presentation: 'modal',
  gestureEnabled: true,
};

/**
 * Immersive somatic focus & relief (Breathing Sessions, Acute Panic SOS):
 * Tranquil hardware-accelerated fade.
 */
const fullScreenFocusOptions: NativeStackNavigationOptions = {
  headerShown: false,
  animation: 'fade',
  presentation: 'fullScreenModal',
  gestureEnabled: true,
};

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

interface AnimatedTabItemProps {
  route: any;
  isFocused: boolean;
  navigation: BottomTabBarProps['navigation'];
  colors: any;
  isDark: boolean;
}

/**
 * Tab item with a spring-animated focus pill, icon swell and press physics —
 * all on the UI thread. Mirrors the iOS 18 tab bar convention while staying
 * fully themed for Android.
 */
const AnimatedTabItem = React.memo(function AnimatedTabItem({
  route,
  isFocused,
  navigation,
  colors,
  isDark,
}: AnimatedTabItemProps) {
  const scale = useSharedValue(1);
  const focus = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    focus.value = withSpring(isFocused ? 1 : 0, { mass: 0.5, damping: 18, stiffness: 240 });
  }, [isFocused, focus]);

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const pillStyle = useAnimatedStyle(() => ({
    opacity: focus.value,
    transform: [{ scale: interpolate(focus.value, [0, 1], [0.55, 1]) }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(focus.value, [0, 1], [1, 1.08]) }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.88, { duration: 90, easing: Easing.out(Easing.quad) });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { mass: 0.5, damping: 15, stiffness: 260 });
  };

  const handlePress = useCallback(() => {
    hapticFeedback.selection();
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  }, [navigation, route.key, route.name, isFocused]);

  const iconName = tabIcon(route.name as keyof TabParamList, isFocused);
  const tintColor = isFocused ? colors.accentPrimary : colors.textTertiary;

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={tabBarStyles.tabItemPressable}
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={route.name}
    >
      <Animated.View style={[tabBarStyles.tabItemInner, pressStyle]}>
        <View style={tabBarStyles.tabIconWrapper}>
          <Animated.View
            pointerEvents="none"
            style={[
              tabBarStyles.tabFocusPill,
              { backgroundColor: colors.accentBg ?? (isDark ? '#172E1E' : '#EDF5EF') },
              pillStyle,
            ]}
          />
          <Animated.View style={iconStyle}>
            <Ionicons name={iconName} size={23} color={tintColor} />
          </Animated.View>
        </View>
        <Text
          style={[
            tabBarStyles.tabLabel,
            {
              color: tintColor,
              fontWeight: isFocused ? '700' : '500',
            },
          ]}
          numberOfLines={1}
        >
          {route.name}
        </Text>
      </Animated.View>
    </Pressable>
  );
});

/**
 * Floating "Liquid Glass" tab bar. On iOS the BlurView samples live scroll
 * content behind the bar (systemChromeMaterial). On Android — where realtime
 * background blur costs a RenderNode sample per frame — it degrades gracefully
 * to a near-opaque translucent material rather than dropping frames.
 */
function CustomTabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  let themeColors: ReturnType<typeof useThemeColors> | undefined;
  try {
    themeColors = useThemeColors();
  } catch {
    themeColors = undefined;
  }
  const colors = themeColors ?? ({
    accentPrimary: '#3E7B52',
    accentBg: '#EDF5EF',
    textTertiary: '#607085',
    textPrimary: '#1A212D',
    bgCard: '#FFFFFF',
    borderLight: '#E6E0D4',
    isDark: false,
  } as any);

  const isDark = !!colors.isDark;
  const bottomInset = insets?.bottom ?? 0;
  const barHeight = 58 + (bottomInset > 0 ? bottomInset : 10);
  const androidFallback = isDark ? 'rgba(24, 33, 48, 0.94)' : 'rgba(255, 255, 255, 0.94)';

  return (
    <View
      style={[
        tabBarStyles.tabBarShell,
        {
          height: barHeight,
          paddingBottom: bottomInset > 0 ? bottomInset : 10,
          borderTopColor: colors.isDark ? 'rgba(255,255,255,0.06)' : colors.borderLight,
          shadowColor: colors.textPrimary ?? '#000000',
          shadowOpacity: isDark ? 0.4 : 0.07,
        },
      ]}
    >
      <BlurView
        pointerEvents="none"
        intensity={isDark ? 70 : 90}
        tint={isDark ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'}
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: Platform.OS === 'android' ? androidFallback : 'transparent' },
        ]}
      />

      {state.routes.map((route, index) => (
        <AnimatedTabItem
          key={route.key}
          route={route}
          isFocused={state.index === index}
          navigation={navigation}
          colors={colors}
          isDark={isDark}
        />
      ))}
    </View>
  );
}

const tabBarStyles = StyleSheet.create({
  tabBarShell: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    elevation: 16,
    shadowOffset: { width: 0, height: -3 },
    shadowRadius: 14,
  },
  tabItemPressable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    paddingVertical: 2,
  },
  tabItemInner: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  tabIconWrapper: {
    width: 52,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabFocusPill: {
    position: 'absolute',
    width: 52,
    height: 30,
    borderRadius: 15,
  },
  tabLabel: {
    fontSize: 11,
    fontFamily: fontFamilies.sans.semiBold,
    letterSpacing: 0.1,
    textAlign: 'center',
    marginTop: 2,
    width: '100%',
  },
});

export function AppNavigator() {
  useRenderLog('app-navigator-render');
  useEffect(() => {
    bootLog('app-navigator-mounted');
  }, []);

  return (
    <Tab.Navigator
      initialRouteName="Home"
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
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
    <RootStack.Navigator initialRouteName="App" screenOptions={defaultStackOptions}>
      <RootStack.Screen name="App" component={AppNavigator} />

      {/* Introspective Modals & Sheet Flows */}
      <RootStack.Screen name="JournalEntry" component={JournalEntryScreen} options={modalOptions} />
      <RootStack.Screen name="MoodCheckIn" component={MoodCheckInScreen} options={modalOptions} />
      <RootStack.Screen name="HabitForm" component={HabitFormScreen} options={modalOptions} />
      <RootStack.Screen name="GratitudeForm" component={GratitudeFormScreen} options={modalOptions} />
      <RootStack.Screen name="SetPin" component={SetPinScreen} options={modalOptions} />

      {/* Immersive Somatic Focus Modes (Fade from bottom) */}
      <RootStack.Screen name="BreathingSession" component={BreathingSessionScreen} options={fullScreenFocusOptions} />
      <RootStack.Screen name="PanicAnchor" component={PanicAnchorScreen} options={fullScreenFocusOptions} />
      <RootStack.Screen name="GroundingExercise" component={GroundingExerciseScreen} options={fullScreenFocusOptions} />

      {/* Sleek Horizontal Slide Pushed Sanctuaries */}
      <RootStack.Screen name="Onboarding" component={OnboardingScreen} options={defaultStackOptions} />
      <RootStack.Screen name="AppLock" component={AppLockScreen} options={defaultStackOptions} />
      <RootStack.Screen name="Habits" component={HabitListScreen} options={defaultStackOptions} />
      <RootStack.Screen name="HabitDetail" component={HabitDetailScreen} options={defaultStackOptions} />
      <RootStack.Screen name="Routines" component={RoutinesScreen} options={defaultStackOptions} />
      <RootStack.Screen name="RoutineDetail" component={RoutineDetailScreen} options={defaultStackOptions} />
      <RootStack.Screen name="Gratitude" component={GratitudeScreen} options={defaultStackOptions} />
      <RootStack.Screen name="Affirmations" component={AffirmationsScreen} options={defaultStackOptions} />
      <RootStack.Screen name="AffirmationDetail" component={AffirmationDetailScreen} options={defaultStackOptions} />
      <RootStack.Screen name="SelfCompassion" component={SelfCompassionScreen} options={defaultStackOptions} />
      <RootStack.Screen name="WhatCanIControl" component={WhatCanIControlScreen} options={defaultStackOptions} />
      <RootStack.Screen name="ThoughtReframing" component={ThoughtReframingScreen} options={defaultStackOptions} />
      <RootStack.Screen name="Notifications" component={NotificationsScreen} options={defaultStackOptions} />
      <RootStack.Screen name="AppLockSettings" component={AppLockSettingsScreen} options={defaultStackOptions} />
      <RootStack.Screen name="DataManagement" component={DataManagementScreen} options={defaultStackOptions} />
      <RootStack.Screen name="BreathworkStudio" component={BreathworkStudioScreen} options={defaultStackOptions} />
      <RootStack.Screen name="Soundscapes" component={SoundscapesScreen} options={defaultStackOptions} />
      <RootStack.Screen name="SensoryGrounding" component={SensoryGroundingScreen} options={defaultStackOptions} />
      <RootStack.Screen name="BodyScan" component={BodyScanScreen} options={defaultStackOptions} />
      <RootStack.Screen name="MoodCalendar" component={MoodCalendarScreen} options={defaultStackOptions} />
    </RootStack.Navigator>
  );
}
