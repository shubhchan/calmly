import React, { forwardRef } from 'react';
import { View, Pressable, ViewStyle, StyleProp } from 'react-native';
import { useThemeColors } from '../theme/ThemeContext';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'elevated' | 'outlined';
  className?: string;
  onPress?: () => void;
}

const Card = forwardRef<React.ElementRef<typeof View>, CardProps>(
  ({ children, style, variant = 'default', className = '', onPress, ...props }, ref) => {
    let colors: any;
    try {
      colors = useThemeColors();
    } catch {
      colors = {
        bgCard: '#FFFFFF',
        borderLight: '#E6E0D4',
        textPrimary: '#1A212D',
        isDark: false,
      };
    }

    const isDark = !!colors?.isDark;

    const baseCardStyle: ViewStyle = {
      backgroundColor: colors?.bgCard ?? '#FFFFFF',
      borderRadius: variant === 'elevated' ? 24 : 20,
      borderWidth: 1,
      borderColor: colors?.borderLight ?? '#E6E0D4',
      overflow: 'hidden',
    };

    const variantStyles: Record<string, ViewStyle> = {
      default: {
        shadowColor: colors?.textPrimary ?? '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.25 : 0.04,
        shadowRadius: 8,
        elevation: 2,
      },
      elevated: {
        shadowColor: colors?.textPrimary ?? '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDark ? 0.35 : 0.07,
        shadowRadius: 14,
        elevation: 3.5,
      },
      outlined: {
        shadowOpacity: 0,
        elevation: 0,
      },
    };

    const combinedStyle = [baseCardStyle, variantStyles[variant], style];

    if (onPress) {
      return (
        <Pressable
          ref={ref}
          className={className}
          style={({ pressed }) => [
            combinedStyle,
            pressed && { opacity: 0.92, transform: [{ scale: 0.992 }] },
          ]}
          onPress={onPress}
          {...props}
        >
          {children}
        </Pressable>
      );
    }

    return (
      <View
        ref={ref}
        className={className}
        style={combinedStyle}
        {...props}
      >
        {children}
      </View>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader = ({ children, style, className = '', ...props }: React.ComponentProps<typeof View>) => (
  <View style={[{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 }, style]} className={className} {...props}>
    {children}
  </View>
);

export const CardContent = ({ children, style, className = '', ...props }: React.ComponentProps<typeof View>) => (
  <View style={[{ paddingHorizontal: 20, paddingVertical: 18 }, style]} className={className} {...props}>
    {children}
  </View>
);

export const CardFooter = ({ children, style, className = '', ...props }: React.ComponentProps<typeof View>) => {
  let colors: any;
  try {
    colors = useThemeColors();
  } catch {
    colors = { borderLight: '#E6E0D4' };
  }
  return (
    <View
      style={[
        {
          paddingHorizontal: 20,
          paddingVertical: 14,
          borderTopWidth: 1,
          borderTopColor: colors?.borderLight ?? '#E6E0D4',
        },
        style,
      ]}
      className={className}
      {...props}
    >
      {children}
    </View>
  );
};

export { Card };