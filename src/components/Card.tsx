import React, { forwardRef } from 'react';
import { View, Pressable, ViewStyle } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined';
  className?: string;
  onPress?: () => void;
}

// Driven by the app's own CSS variables (which follow ThemeContext's manual
// light/dark/system choice) rather than Tailwind's `dark:` variant, which only
// tracks the device's system setting and would drift out of sync when the user
// picks a theme explicitly in-app. `navy-*` was also never defined in the
// Tailwind config, so it rendered as nothing.
const variants: Record<string, string> = {
  default: 'bg-[var(--color-bg-card)] shadow-card',
  elevated: 'bg-[var(--color-bg-card)] shadow-card-hover',
  outlined: 'bg-[var(--color-bg-card)] border border-[var(--color-border-light)]',
};

const Card = forwardRef<React.ElementRef<typeof View>, CardProps>(
  ({ children, style, variant = 'default', className = '', onPress, ...props }, ref) => {
    if (onPress) {
      return (
        <Pressable
          ref={ref}
          className={`rounded-3xl ${variants[variant]} ${className}`}
          style={style}
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
        className={`rounded-3xl ${variants[variant]} ${className}`}
        style={style}
        {...props}
      >
        {children}
      </View>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader = ({ children, className = '', ...props }: React.ComponentProps<typeof View>) => (
  <View className={`px-6 pt-6 pb-4 ${className}`} {...props}>
    {children}
  </View>
);

export const CardContent = ({ children, className = '', ...props }: React.ComponentProps<typeof View>) => (
  <View className={`px-6 pb-6 ${className}`} {...props}>
    {children}
  </View>
);

export const CardFooter = ({ children, className = '', ...props }: React.ComponentProps<typeof View>) => (
  <View className={`px-6 pb-6 pt-4 border-t border-[var(--color-border-light)] ${className}`} {...props}>
    {children}
  </View>
);

export { Card };