import React from 'react';
import { View, Text, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { useThemeColors } from '../theme/ThemeContext';

interface StatPillProps {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon?: React.ReactNode;
  accentColor?: string;
  className?: string;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  valueStyle?: StyleProp<TextStyle>;
}

export const StatPill = ({
  label,
  value,
  trend = 'neutral',
  trendValue,
  icon,
  accentColor,
  className = '',
  style,
  labelStyle,
  valueStyle,
}: StatPillProps) => {
  const colors = useThemeColors();
  const resolvedAccent = accentColor ?? colors.accentPrimary;

  const trendColors = {
    up: colors.success,
    down: colors.error,
    neutral: colors.textTertiary,
  };

  const trendIcons = {
    up: '↑',
    down: '↓',
    neutral: '→',
  };

  return (
    <View
      className={`
        flex-row items-center px-4 py-3 rounded-full
        bg-[var(--color-bg-card)] border border-[var(--color-border-light)]
        shadow-card
        ${className}
      `}
      style={style}
    >
      {icon && (
        <View
          className="mr-3 flex items-center justify-center"
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: resolvedAccent + '20',
          }}
        >
          {icon}
        </View>
      )}
      <View className="flex-1">
        <Text
          className="text-body-sm font-medium"
          style={[{ color: colors.textSecondary }, labelStyle]}
        >
          {label}
        </Text>
        <View className="flex-row items-baseline mt-0.5">
          <Text
            className="font-bold text-headline-sm"
            style={[{ color: colors.textPrimary }, valueStyle]}
          >
            {value}
          </Text>
          {trendValue && (
            <View className="flex-row items-center ml-2">
              <Text className="text-label-sm" style={{ color: trendColors[trend] }}>
                {trendIcons[trend]} {trendValue}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

interface MoodStatPillProps {
  mood: string;
  percentage: number;
  color: string;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

export const MoodStatPill = ({
  mood,
  percentage,
  color,
  className = '',
  style,
}: MoodStatPillProps) => {
  const colors = useThemeColors();

  return (
    <View
      className={`
        flex-row items-center px-4 py-3 rounded-full
        bg-[var(--color-bg-card)] border
        shadow-card
        ${className}
      `}
      style={[style, { borderColor: color + '40' }]}
    >
      <View
        className="mr-3 flex items-center justify-center rounded-full"
        style={{ width: 32, height: 32, backgroundColor: color + '20' }}
      >
        <View className="rounded-full" style={{ width: 16, height: 16, backgroundColor: color }} />
      </View>
      <View className="flex-1">
        <Text className="text-body-sm font-medium" style={{ color: colors.textSecondary }}>
          {mood}
        </Text>
        <View className="flex-row items-baseline mt-0.5">
          <Text className="font-bold text-headline-sm" style={{ color: colors.textPrimary }}>
            {Math.round(percentage)}%
          </Text>
          <View
            className="ml-2 h-1.5 flex-1 max-w-20 rounded-full overflow-hidden"
            style={{ backgroundColor: colors.borderLight }}
          >
            <View
              className="h-full rounded-full"
              style={{ width: `${Math.max(0, Math.min(100, percentage))}%`, backgroundColor: color }}
            />
          </View>
        </View>
      </View>
    </View>
  );
};
