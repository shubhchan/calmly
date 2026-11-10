import React, { Suspense, useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { createMaterialTopTabNavigator, MaterialTopTabBarProps } from '@react-navigation/material-top-tabs';
import { StackActions } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { TabParamList, RootStackParamList } from '../types/navigation';
import { useAppTheme, useThemeColors } from '../theme/ThemeContext';
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
import { ZenPlaygroundScreen } from '../features/calm/ZenPlaygroundScreen';
import { MoodCalendarScreen } from '../features/insights/MoodCalendarScreen';
import { ReflectionReportScreen } from '../features/insights/ReflectionReportScreen';
import { CloudStorageScreen } from '../features/settings/CloudStorageScreen';
import { ProfileScreen } from '../features/profile/ProfileScreen';
import { settingsRepository } from '../database/repositories/settingsRepository';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { hapticFeedback } from '../utils/haptics';
import { fontFamilies } from '../theme/typography';
import { FontBrowserScreen } from '../features/settings/FontBrowserScreen';
import { DesignSystemScreen } from '../design-system/DesignSystemScreen';
import { BrandedLoader } from '../components/interactive/LoadingState';
import { useAppReducedMotion } from '../theme/motion';
import { motion } from '../theme/tokens';
import { pushTransition, modalTransition, immersiveTransition } from './transitions';
import { useResponsive } from '../theme/responsive';

const Tab = createMaterialTopTabNavigator<TabParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

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
    colors = { bgPrimary: '#F4F5F1', accentPrimary: '#2C4F45' };
  }
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors?.bgPrimary ?? '#F4F5F1',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <BrandedLoader label="Opening your sanctuary…" />
    </View>
  );
}

function TabCrashFallback({ tabName, onRetry }: { tabName: string; onRetry: () => void }) {
  let colors: any;
  try {
    colors = useThemeColors();
  } catch {
    colors = {
      bgPrimary: '#F4F5F1',
      textPrimary: '#1A2420',
      textTertiary: '#6C7873',
      accentPrimary: '#2C4F45',
    };
  }
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors?.bgPrimary ?? '#F4F5F1',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
      }}
    >
      <Text style={{ fontSize: 18, fontWeight: '700', color: colors?.textPrimary ?? '#1A2420', textAlign: 'center' }}>
        {tabName} couldn&apos;t load
      </Text>
      <Text style={{ marginTop: 8, fontSize: 14, color: colors?.textTertiary ?? '#6C7873', textAlign: 'center' }}>
        The rest of the app is fine — this tab hit a problem.
      </Text>
      <Pressable
        onPress={onRetry}
        style={{
          marginTop: 16,
          backgroundColor: colors?.accentPrimary ?? '#2C4F45',
          paddingVertical: 12,
          paddingHorizontal: 20,
          borderRadius: 12,
        }}
      >
        <Text style={{ color: colors?.isDark ? (colors?.bgPrimary ?? '#0F1513') : '#FFFFFF', fontWeight: '700' }}>Try again</Text>
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

/** Route keys stay stable; the visible labels are the five-tab product nav. */
const TAB_LABELS: Record<string, string> = {
  Home: 'Today',
  Calm: 'Calm',
  Journal: 'Journal',
  Insights: 'Insights',
  Settings: 'Me',
};

function tabIcon(routeName: keyof TabParamList, focused: boolean): TabIconName {
  switch (routeName) {
    case 'Home':
      return focused ? 'sunny' : 'sunny-outline';
    case 'Journal':
      return focused ? 'book' : 'book-outline';
    case 'Calm':
      return focused ? 'leaf' : 'leaf-outline';
    case 'Insights':
      return focused ? 'analytics' : 'analytics-outline';
    case 'Settings':
      return focused ? 'person' : 'person-outline';
    default:
      return 'ellipse-outline';
  }
}

interface AnimatedTabItemProps {
  route: any;
  isFocused: boolean;
  navigation: MaterialTopTabBarProps['navigation'];
  colors: any;
}

/**
 * One tab: icon and label, with press physics on the UI thread.
 * Active state is ink and weight, never a floating pill or glow.
 */
const AnimatedTabItem = React.memo(function AnimatedTabItem({
  route,
  isFocused,
  navigation,
  colors,
}: AnimatedTabItemProps) {
  const scale = useSharedValue(1);

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    // Same asymmetric feel as TactilePressable: tight in, settling out.
    scale.value = withSpring(0.92, motion.spring.pressIn);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, motion.spring.release);
  };

  // A small settle pop when a tab becomes active, so selecting it feels
  // acknowledged rather than swapped.
  const wasFocused = useSharedValue(isFocused);
  useEffect(() => {
    if (isFocused && !wasFocused.value) {
      scale.value = 0.94;
      scale.value = withSpring(1, motion.spring.release);
    }
    wasFocused.value = isFocused;
  }, [isFocused, scale, wasFocused]);

  const handlePress = useCallback(() => {
    hapticFeedback.selection();
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (event.defaultPrevented) return;

    if (isFocused) {
      // Re-tapping the active tab snaps its nested stack back to the root screen.
      const state = navigation.getState();
      const tabRoute = state.routes.find((r: any) => r.key === route.key);
      const nestedState = (tabRoute as any)?.state;
      if (nestedState && (nestedState.index ?? 0) > 0) {
        navigation.dispatch({ ...StackActions.popToTop(), target: nestedState.key });
      }
      return;
    }

    navigation.navigate(route.name);
  }, [navigation, route.key, route.name, isFocused]);

  const iconName = tabIcon(route.name as keyof TabParamList, isFocused);
  const tintColor = isFocused ? colors.primary.default : colors.text.tertiary;
  const label = TAB_LABELS[route.name] ?? route.name;

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={tabBarStyles.tabItemPressable}
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={label}
    >
      <Animated.View style={[tabBarStyles.tabItemInner, pressStyle]}>
        <Ionicons name={iconName} size={23} color={tintColor} />
        <Text
          style={[
            tabBarStyles.tabLabel,
            {
              color: tintColor,
              fontWeight: isFocused ? '600' : '500',
            },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
});

/**
 * One row in the desktop rail. Same press physics and ink-only active state as
 * the mobile tab, laid out horizontally.
 */
const DesktopRailItem = React.memo(function DesktopRailItem({
  route,
  isFocused,
  navigation,
  colors,
}: AnimatedTabItemProps) {
  const scale = useSharedValue(1);

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = useCallback(() => {
    hapticFeedback.selection();
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });
    if (event.defaultPrevented) return;

    if (isFocused) {
      const tabRoute = navigation.getState().routes.find((r: any) => r.key === route.key);
      const nestedState = (tabRoute as any)?.state;
      if (nestedState && (nestedState.index ?? 0) > 0) {
        navigation.dispatch({ ...StackActions.popToTop(), target: nestedState.key });
      }
      return;
    }
    navigation.navigate(route.name);
  }, [navigation, route.key, route.name, isFocused]);

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={() => {
        scale.value = withSpring(0.98, motion.spring.pressIn);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, motion.spring.release);
      }}
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={TAB_LABELS[route.name] ?? route.name}
      style={{ marginBottom: 4 }}
    >
      <Animated.View
        style={[
          railStyles.item,
          isFocused && { backgroundColor: colors.primary.subtle },
          pressStyle,
        ]}
      >
        <Ionicons
          name={tabIcon(route.name as keyof TabParamList, isFocused)}
          size={20}
          color={isFocused ? colors.primary.default : colors.text.secondary}
        />
        <Text
          style={[
            railStyles.label,
            {
              color: isFocused ? colors.primary.default : colors.text.secondary,
              fontWeight: isFocused ? '600' : '500',
            },
          ]}
        >
          {TAB_LABELS[route.name] ?? route.name}
        </Text>
      </Animated.View>
    </Pressable>
  );
});

/**
 * Desktop navigation: a quiet left rail with the wordmark, the same five
 * destinations, and nothing else. Content keeps the full remaining width.
 */
function DesktopTabRail({
  state,
  navigation,
}: Pick<MaterialTopTabBarProps, 'state' | 'navigation'>) {
  const colors = useAppTheme().colors;
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        railStyles.shell,
        {
          backgroundColor: colors.surface.default,
          borderRightColor: colors.border.subtle,
          paddingTop: Math.max(insets?.top ?? 0, 20) + 24,
          paddingBottom: Math.max(insets?.bottom ?? 0, 12) + 16,
        },
      ]}
    >
      <View style={railStyles.brand}>
        <Ionicons name="leaf" size={21} color={colors.primary.default} />
        <Text style={[railStyles.wordmark, { color: colors.text.primary }]}>Calmly</Text>
      </View>

      <View style={railStyles.nav}>
        {state.routes.map((route, index) => (
          <DesktopRailItem
            key={route.key}
            route={route}
            isFocused={state.index === index}
            navigation={navigation}
            colors={colors as any}
          />
        ))}
      </View>

      <View style={[railStyles.footer, { borderTopColor: colors.border.subtle }]}>
        <Text style={[railStyles.footerText, { color: colors.text.tertiary }]}>
          A quiet place,{'\n'}on every screen.
        </Text>
      </View>
    </View>
  );
}

const railStyles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 10,
  },
  shell: {
    width: 248,
    height: '100%',
    flexShrink: 0,
    paddingHorizontal: 18,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 10,
    paddingBottom: 30,
  },
  wordmark: {
    fontFamily: fontFamilies.serif.regular,
    fontSize: 23,
    letterSpacing: -0.2,
  },
  nav: {
    flex: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  label: {
    fontFamily: fontFamilies.sans.regular,
    fontSize: 14,
    letterSpacing: 0.1,
  },
  footer: {
    paddingTop: 14,
    paddingHorizontal: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerText: {
    fontFamily: fontFamilies.sans.regular,
    fontSize: 11.5,
    lineHeight: 17,
    letterSpacing: 0.1,
  },
});

/**
 * Flat, quiet tab bar. A single surface with a hairline rule, no blur and no
 * shadow — contrast does the separating.
 */
function CustomTabBar({ state, navigation }: MaterialTopTabBarProps) {
  const colors = useAppTheme().colors;
  const { usesDesktopNav } = useResponsive();
  const insets = useSafeAreaInsets();

  if (usesDesktopNav) {
    return (
      <View style={railStyles.overlay}>
        <DesktopTabRail state={state} navigation={navigation} />
      </View>
    );
  }

  const bottomInset = insets?.bottom ?? 0;
  const barHeight = 60 + (bottomInset > 0 ? bottomInset : 10);

  // Hide tab bar if active tab is displaying an inner/nested stack screen
  const currentTab = state.routes[state.index];
  const nested = (currentTab as any)?.state;
  if (nested && typeof nested.index === 'number' && nested.index > 0) {
    return null;
  }

  return (
    <View
      style={[
        tabBarStyles.tabBarShell,
        {
          height: barHeight,
          paddingBottom: bottomInset > 0 ? bottomInset : 10,
          backgroundColor: colors.surface.default,
          borderTopColor: colors.border.subtle,
        },
      ]}
    >
      {state.routes.map((route, index) => (
        <AnimatedTabItem
          key={route.key}
          route={route}
          isFocused={state.index === index}
          navigation={navigation}
          colors={colors}
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
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
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
    gap: 3,
  },
  tabLabel: {
    fontSize: 12,
    fontFamily: fontFamilies.sans.semiBold,
    letterSpacing: 0.15,
    textAlign: 'center',
    marginTop: 2,
    width: '100%',
  },
});

/** Width of the desktop rail. Scenes are inset by the same amount. */
const DESKTOP_RAIL_WIDTH = 248;

export function AppNavigator() {
  useRenderLog('app-navigator-render');
  const { usesDesktopNav } = useResponsive();
  useEffect(() => {
    bootLog('app-navigator-mounted');
  }, []);

  const screenOptions = useMemo(
    () =>
      ({ route }: { route: any }) => ({
        headerShown: false,
        // Match the previous bottom-tabs laziness: a tab mounts on first visit,
        // but the page on each side stays ready so a swipe reveals real content.
        lazy: true,
        lazyPreloadDistance: 1,
        // Finger-tracking paging is for touch layouts only. A pushed page keeps
        // its own horizontal gestures and native swipe-back.
        swipeEnabled: !usesDesktopNav && (route.state?.index ?? 0) === 0,
        // Nav bar taps switch instantly — no pager slide between main screens.
        animationEnabled: false,
        sceneStyle: usesDesktopNav ? { paddingLeft: DESKTOP_RAIL_WIDTH } : undefined,
      }),
    [usesDesktopNav],
  );

  const screenListeners = useMemo(
    () =>
      ({ route, navigation }: any) => ({
        blur: () => {
          // Stands in for bottom-tabs' popToTopOnBlur: leaving a tab returns it
          // to its first screen, so the bar never stays hidden on return.
          const tabRoute = navigation
            .getState()
            .routes.find((r: any) => r.key === route.key);
          const nested = tabRoute?.state;
          if (nested && (nested.index ?? 0) > 0) {
            navigation.dispatch({ ...StackActions.popToTop(), target: nested.key });
          }
        },
      }),
    [],
  );

  return (
    <Tab.Navigator
      initialRouteName="Home"
      tabBar={(props) => <CustomTabBar {...props} />}
      tabBarPosition="bottom"
      screenOptions={screenOptions}
      screenListeners={screenListeners}
    >
      <Tab.Screen name="Home" component={GuardedHomeStack} />
      <Tab.Screen name="Calm" component={GuardedCalmStack} />
      <Tab.Screen name="Journal" component={GuardedJournalStack} />
      <Tab.Screen name="Insights" component={GuardedInsightsStack} />
      <Tab.Screen name="Settings" component={GuardedSettingsStack} />
    </Tab.Navigator>
  );
}


function AppLockRoute({ navigation }: any) {
  return <AppLockScreen onUnlocked={() => navigation?.goBack?.()} />;
}

export function RootNavigator() {
  useRenderLog('root-navigator-render');
  const reducedMotion = useAppReducedMotion();
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [initialRoute, setInitialRoute] = useState<'App' | 'Onboarding'>('App');

  useEffect(() => {
    let mounted = true;
    bootLog('root-navigator-checking-onboarding');
    settingsRepository
      .getSettings()
      .then((settings) => {
        if (mounted) {
          const needsOnboarding = !settings.onboardingComplete;
          setInitialRoute(needsOnboarding ? 'Onboarding' : 'App');
          setOnboardingChecked(true);
          bootLog(`root-navigator-onboarding-${needsOnboarding ? 'required' : 'skipped'}`);
        }
      })
      .catch(() => {
        if (mounted) {
          setOnboardingChecked(true);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    bootLog('root-navigator-mounted');
  }, []);

  // One transition matrix, resolved from the user's motion preference.
  const push = useMemo(() => pushTransition(reducedMotion), [reducedMotion]);
  const modal = useMemo(() => modalTransition(reducedMotion), [reducedMotion]);
  const immersive = useMemo(() => immersiveTransition(reducedMotion), [reducedMotion]);

  if (!onboardingChecked) {
    return <TabLoadingFallback />;
  }

  return (
    <RootStack.Navigator initialRouteName={initialRoute} screenOptions={push}>
      <RootStack.Screen name="App" component={AppNavigator} />
      <RootStack.Screen name="Main" component={AppNavigator} />

      {/* Introspective Modals & Sheet Flows */}
      <RootStack.Screen name="JournalEntry" component={JournalEntryScreen} options={modal} />
      <RootStack.Screen name="MoodCheckIn" component={MoodCheckInScreen} options={modal} />
      <RootStack.Screen name="HabitForm" component={HabitFormScreen} options={modal} />
      <RootStack.Screen name="GratitudeForm" component={GratitudeFormScreen} options={modal} />
      <RootStack.Screen name="SetPin" component={SetPinScreen} options={modal} />

      {/* Immersive Somatic Focus Modes (quiet fade) */}
      <RootStack.Screen name="BreathingSession" component={BreathingSessionScreen} options={immersive} />
      <RootStack.Screen name="PanicAnchor" component={PanicAnchorScreen} options={immersive} />
      <RootStack.Screen name="GroundingExercise" component={GroundingExerciseScreen} options={immersive} />

      {/* Pushed Sanctuaries (horizontal slide) */}
      <RootStack.Screen name="Onboarding" component={OnboardingScreen} options={push} />
      <RootStack.Screen name="Profile" component={ProfileScreen} options={push} />
      <RootStack.Screen name="AppLock" component={AppLockRoute} options={push} />
      <RootStack.Screen name="Habits" component={HabitListScreen} options={push} />
      <RootStack.Screen name="HabitDetail" component={HabitDetailScreen} options={push} />
      <RootStack.Screen name="Routines" component={RoutinesScreen} options={push} />
      <RootStack.Screen name="RoutineDetail" component={RoutineDetailScreen} options={push} />
      <RootStack.Screen name="Gratitude" component={GratitudeScreen} options={push} />
      <RootStack.Screen name="Affirmations" component={AffirmationsScreen} options={push} />
      <RootStack.Screen name="AffirmationDetail" component={AffirmationDetailScreen} options={push} />
      <RootStack.Screen name="SelfCompassion" component={SelfCompassionScreen} options={push} />
      <RootStack.Screen name="WhatCanIControl" component={WhatCanIControlScreen} options={push} />
      <RootStack.Screen name="ThoughtReframing" component={ThoughtReframingScreen} options={push} />
      <RootStack.Screen name="Notifications" component={NotificationsScreen} options={push} />
      <RootStack.Screen name="AppLockSettings" component={AppLockSettingsScreen} options={push} />
      <RootStack.Screen name="DataManagement" component={DataManagementScreen} options={push} />
      <RootStack.Screen name="CloudStorage" component={CloudStorageScreen} options={push} />
      <RootStack.Screen name="BreathworkStudio" component={BreathworkStudioScreen} options={push} />
      <RootStack.Screen name="ZenPlayground" component={ZenPlaygroundScreen} options={push} />
      <RootStack.Screen name="Soundscapes" component={SoundscapesScreen} options={push} />
      <RootStack.Screen name="SensoryGrounding" component={SensoryGroundingScreen} options={push} />
      <RootStack.Screen name="BodyScan" component={BodyScanScreen} options={push} />
      <RootStack.Screen name="MoodCalendar" component={MoodCalendarScreen} options={push} />
      <RootStack.Screen name="ReflectionReport" component={ReflectionReportScreen} options={push} />
      <RootStack.Screen name="FontBrowser" component={FontBrowserScreen} options={push} />
      <RootStack.Screen name="DesignSystem" component={DesignSystemScreen} options={push} />
    </RootStack.Navigator>
  );
}
