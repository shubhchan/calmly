import React from 'react';
import { View, Text, Pressable, StyleProp, ViewStyle } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useThemeColors } from '../theme/ThemeContext';

interface BottomNavProps {
  className?: string;
  style?: StyleProp<ViewStyle>;
}

const tabs = [
  { name: 'Home', icon: HomeIcon, focusedIcon: HomeIconFocused, route: 'Home' },
  { name: 'Journal', icon: JournalIcon, focusedIcon: JournalIconFocused, route: 'Journal' },
  { name: 'Calm', icon: CalmIcon, focusedIcon: CalmIconFocused, route: 'Calm' },
  { name: 'Insights', icon: InsightsIcon, focusedIcon: InsightsIconFocused, route: 'Insights' },
  { name: 'Habits', icon: HabitsIcon, focusedIcon: HabitsIconFocused, route: 'Habits' },
  { name: 'Me', icon: MeIcon, focusedIcon: MeIconFocused, route: 'Settings' },
] as const;

function HomeIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <Path d="M9 22V12h6v10" />
    </Svg>
  );
}

function HomeIconFocused({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <Path d="M9 22V12h6v10" />
    </Svg>
  );
}

function JournalIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <Path d="M14 2v6h6" />
      <Path d="M16 13H8" />
      <Path d="M16 17H8" />
      <Path d="M10 9H8" />
    </Svg>
  );
}

function JournalIconFocused({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <Path d="M14 2v6h6" />
      <Path d="M16 13H8" />
      <Path d="M16 17H8" />
      <Path d="M10 9H8" />
    </Svg>
  );
}

function CalmIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 2a10 10 0 1 0 10 10" />
      <Path d="M12 6v6l4 2" />
    </Svg>
  );
}

function CalmIconFocused({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 2a10 10 0 1 0 10 10" />
      <Path d="M12 6v6l4 2" />
    </Svg>
  );
}

function InsightsIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M18 20V10" />
      <Path d="M12 20V4" />
      <Path d="M6 20v-6" />
    </Svg>
  );
}

function InsightsIconFocused({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M18 20V10" />
      <Path d="M12 20V4" />
      <Path d="M6 20v-6" />
    </Svg>
  );
}

function MeIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <Circle cx="12" cy="7" r="4" />
    </Svg>
  );
}

function MeIconFocused({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <Circle cx="12" cy="7" r="4" />
    </Svg>
  );
}

function HabitsIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9 11l3 3L22 4" />
      <Path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </Svg>
  );
}

function HabitsIconFocused({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M9 11l3 3L22 4" />
      <Path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </Svg>
  );
}

export const BottomNav = ({ className = '', style }: BottomNavProps) => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const colors = useThemeColors();

  const currentRoute = route.name;

  return (
    <View
      className={`
        flex-row items-center justify-around h-16
        bg-[var(--color-bg-card)] border-t border-[var(--color-border-light)]
        shadow-soft-lg
        ${className}
      `}
      style={style}
    >
      {tabs.map((tab) => {
        const isFocused = currentRoute === tab.route;
        const Icon = isFocused ? tab.focusedIcon : tab.icon;
        const color = isFocused ? colors.accentPrimary : colors.textTertiary;

        return (
          <Pressable
            key={tab.name}
            onPress={() => navigation.navigate(tab.route)}
            className="flex-1 flex items-center justify-center py-2 px-3"
            accessibilityRole="button"
            accessibilityLabel={tab.name}
            accessibilityState={{ selected: isFocused }}
          >
            <Icon color={color} size={26} />
            <Text
              className={`text-label-sm mt-1 ${isFocused ? 'font-semibold' : 'font-medium'}`}
              style={{ color }}
            >
              {tab.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};