import React from 'react';
import { View, Text, StyleProp, ViewStyle, TextStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useAppTheme } from '../theme/ThemeContext';

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  trackColor?: string;
  progressColor?: string;
  showPercentage?: boolean;
  children?: React.ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const ProgressRing = ({
  progress,
  size = 80,
  strokeWidth = 6,
  trackColor,
  progressColor,
  showPercentage = true,
  children,
  className = '',
  style,
  textStyle,
}: ProgressRingProps) => {
  // SVG stroke props aren't touched by NativeWind's className compiler, so they
  // need literal resolved colors, not 'var(--x)' strings — pull them from the
  // live theme instead of hardcoding a CSS-variable default.
  const { colors } = useAppTheme();
  const resolvedTrackColor = trackColor ?? colors.border.default;
  const resolvedProgressColor = progressColor ?? colors.primary.default;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference * (1 - Math.max(0, Math.min(1, progress)));

  return (
    <View className={`flex items-center justify-center ${className}`} style={style}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={resolvedTrackColor}
          strokeWidth={strokeWidth}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={resolvedProgressColor}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {(showPercentage || children) && (
        <View
          style={{
            position: 'absolute',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {showPercentage && (
            <Text className="font-bold text-headline-md text-[var(--color-text-primary)]" style={textStyle}>
              {Math.round(progress * 100)}%
            </Text>
          )}
          {children && !showPercentage && children}
        </View>
      )}
    </View>
  );
};

interface MiniProgressRingProps extends Omit<ProgressRingProps, 'size' | 'showPercentage'> {
  size?: number;
}

export const MiniProgressRing = ({
  progress,
  size = 40,
  strokeWidth = 4,
  trackColor,
  progressColor,
  className = '',
  style,
}: MiniProgressRingProps) => {
  const { colors } = useAppTheme();
  const resolvedTrackColor = trackColor ?? colors.border.default;
  const resolvedProgressColor = progressColor ?? colors.primary.default;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference * (1 - Math.max(0, Math.min(1, progress)));

  return (
    <View className={`flex items-center justify-center ${className}`} style={style}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={resolvedTrackColor}
          strokeWidth={strokeWidth}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={resolvedProgressColor}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
    </View>
  );
};
