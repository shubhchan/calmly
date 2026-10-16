import React from 'react';
import { View, Text, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { useThemeColors } from '../theme/ThemeContext';
import { fontFamilies } from '../theme/typography';

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
  let colors: any;
  try {
    colors = useThemeColors();
  } catch {
    colors = {
      accentPrimary: '#3E7B52',
      bgCard: '#FFFFFF',
      borderLight: '#E6E0D4',
      textPrimary: '#1A212D',
      textSecondary: '#384455',
      textTertiary: '#607085',
      success: '#3E7B52',
      error: '#DB3A60',
      isDark: false,
    };
  }

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
      className={className}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderRadius: 20,
          backgroundColor: colors.bgCard,
          borderWidth: 1,
          borderColor: colors.borderLight,
          shadowColor: colors.textPrimary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: colors.isDark ? 0.2 : 0.04,
          shadowRadius: 6,
          elevation: 1.5,
          flex: 1,
        },
        style,
      ]}
    >
      {icon && (
        <View
          style={{
            marginRight: 12,
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: resolvedAccent + '18',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text
          style={[
            {
              fontFamily: fontFamilies.sans.medium,
              fontSize: 12,
              fontWeight: '500',
              color: colors.textTertiary,
              letterSpacing: 0.1,
            },
            labelStyle,
          ]}
        >
          {label}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 2 }}>
          <Text
            style={[
              {
                fontFamily: fontFamilies.sans.bold,
                fontSize: 17,
                fontWeight: '700',
                color: colors.textPrimary,
                letterSpacing: -0.2,
              },
              valueStyle,
            ]}
          >
            {value}
          </Text>
          {trendValue && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
              <Text
                style={{
                  fontFamily: fontFamilies.sans.semiBold,
                  fontSize: 12,
                  fontWeight: '600',
                  color: trendColors[trend],
                }}
              >
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
  let colors: any;
  try {
    colors = useThemeColors();
  } catch {
    colors = {
      bgCard: '#FFFFFF',
      borderLight: '#E6E0D4',
      textPrimary: '#1A212D',
      textSecondary: '#384455',
      textTertiary: '#607085',
      isDark: false,
    };
  }

  return (
    <View
      className={className}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderRadius: 18,
          backgroundColor: colors.bgCard,
          borderWidth: 1,
          borderColor: color + '30',
          shadowColor: colors.textPrimary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: colors.isDark ? 0.2 : 0.04,
          shadowRadius: 6,
          elevation: 1.5,
        },
        style,
      ]}
    >
      <View
        style={{
          marginRight: 12,
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: color + '1A',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: color }} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: fontFamilies.sans.medium, fontSize: 13, fontWeight: '500', color: colors.textSecondary }}>
          {mood}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
          <Text style={{ fontFamily: fontFamilies.sans.bold, fontSize: 16, fontWeight: '700', color: colors.textPrimary, minWidth: 42 }}>
            {Math.round(percentage)}%
          </Text>
          <View
            style={{
              marginLeft: 8,
              height: 5,
              flex: 1,
              maxWidth: 90,
              borderRadius: 3,
              backgroundColor: colors.borderLight,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                height: '100%',
                borderRadius: 3,
                width: `${Math.max(0, Math.min(100, percentage))}%`,
                backgroundColor: color,
              }}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

