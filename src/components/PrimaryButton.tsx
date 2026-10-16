import React from 'react';
import { Pressable, Text, View, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { useThemeColors } from '../theme/ThemeContext';
import { hapticFeedback } from '../utils/haptics';
import { fontFamilies } from '../theme/typography';
import { TactilePressable } from './interactive/TactilePressable';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  fullWidth?: boolean;
}

export const PrimaryButton = React.forwardRef<React.ElementRef<typeof Pressable>, PrimaryButtonProps>(
  (
    {
      title,
      onPress,
      variant = 'primary',
      size = 'md',
      disabled = false,
      loading = false,
      leftIcon,
      rightIcon,
      className = '',
      style,
      textStyle,
      fullWidth = true,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;
    let colors: any;
    try {
      colors = useThemeColors();
    } catch {
      colors = {
        accentPrimary: '#3E7B52',
        accentBg: '#EDF5EF',
        accentBorder: '#C2DCBF',
        textPrimary: '#1A212D',
        textInverse: '#FBF9F5',
        isDark: false,
      };
    }

    const paddingStyles = {
      sm: { paddingVertical: 10, paddingHorizontal: 16, minHeight: 40 },
      md: { paddingVertical: 14, paddingHorizontal: 22, minHeight: 48 },
      lg: { paddingVertical: 16, paddingHorizontal: 28, minHeight: 54 },
    }[size];

    const fontSizes = {
      sm: 14,
      md: 16,
      lg: 17,
    }[size];

    const variantStyles: Record<string, ViewStyle> = {
      primary: {
        backgroundColor: colors.accentPrimary,
        borderWidth: 0,
        shadowColor: colors.accentPrimary,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: colors.isDark ? 0.35 : 0.2,
        shadowRadius: 8,
        elevation: 3,
      },
      secondary: {
        backgroundColor: colors.accentBg,
        borderColor: colors.accentBorder,
        borderWidth: 1,
      },
      outline: {
        backgroundColor: 'transparent',
        borderColor: colors.accentPrimary,
        borderWidth: 1.5,
      },
      ghost: {
        backgroundColor: 'transparent',
        borderWidth: 0,
      },
    };

    const textColor =
      variant === 'primary'
        ? '#FFFFFF'
        : colors.accentPrimary;

    const handlePress = () => {
      if (isDisabled) return;
      hapticFeedback.light();
      onPress?.();
    };

    return (
      <TactilePressable
        ref={ref as any}
        onPress={onPress}
        disabled={isDisabled}
        className={className}
        scaleDownTo={0.965}
        hapticStyle="light"
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 9999,
            width: fullWidth ? '100%' : undefined,
            opacity: isDisabled ? 0.5 : 1,
          },
          paddingStyles,
          variantStyles[variant],
          style,
        ]}
        {...props}
      >
        {loading && (
          <View style={{ marginRight: 8, width: 16, height: 16 }}>
            <CircularProgress size={16} color={textColor} />
          </View>
        )}
        {!loading && leftIcon && <View style={{ marginRight: 8 }}>{leftIcon}</View>}
        <Text
          style={[
            {
              color: textColor,
              fontSize: fontSizes,
              fontFamily: fontFamilies.sans.semiBold,
              fontWeight: '600',
              letterSpacing: 0.2,
              textAlign: 'center',
            },
            textStyle,
          ]}
        >
          {title}
        </Text>
        {!loading && rightIcon && <View style={{ marginLeft: 8 }}>{rightIcon}</View>}
      </TactilePressable>
    );
  }
);

PrimaryButton.displayName = 'PrimaryButton';

const CircularProgress = ({ size, color }: { size: number; color: string }) => {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 2,
        borderColor: color,
        borderTopColor: 'transparent',
      }}
    />
  );
};

interface SecondaryButtonProps extends Omit<PrimaryButtonProps, 'variant'> {
  variant?: 'secondary' | 'outline' | 'ghost';
}

export const SecondaryButton = ({ variant = 'secondary', ...props }: SecondaryButtonProps) => (
  <PrimaryButton variant={variant} {...props} />
);