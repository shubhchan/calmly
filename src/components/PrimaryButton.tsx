import React from 'react';
import { Pressable, Text, View, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { useThemeColors } from '../theme/ThemeContext';

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

const variants = {
  primary: 'bg-[var(--color-accent-primary)] text-white',
  secondary: 'bg-[var(--color-accent-bg)] text-[var(--color-accent-primary)] border border-[var(--color-accent-border)]',
  outline: 'border-2 border-[var(--color-accent-primary)] text-[var(--color-accent-primary)] bg-transparent',
  ghost: 'text-[var(--color-accent-primary)] bg-transparent',
};

const sizes = {
  sm: 'px-4 py-2 text-label-md',
  md: 'px-6 py-3 text-label-lg',
  lg: 'px-8 py-4 text-headline-sm',
};

export const PrimaryButton = React.forwardRef<React.ElementRef<typeof Pressable>, PrimaryButtonProps>(
  ({
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
  }, ref) => {
    const isDisabled = disabled || loading;
    const colors = useThemeColors();

    return (
      <Pressable
        ref={ref}
        onPress={onPress}
        disabled={isDisabled}
        className={`
          flex-row items-center justify-center rounded-full
          transition-all duration-200
          ${variants[variant]}
          ${sizes[size]}
          ${fullWidth ? 'w-full' : ''}
          ${isDisabled ? 'opacity-50' : 'active:scale-[0.98]'}
          ${className}
        `}
        style={style}
        android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
        {...props}
      >
        {loading && (
          <View className="mr-2" style={{ width: 16, height: 16 }}>
            <CircularProgress size={16} color={variant === 'primary' ? 'white' : colors.accentPrimary} />
          </View>
        )}
        {!loading && leftIcon && <View className="mr-2">{leftIcon}</View>}
        <Text
          className={`font-semibold ${variant === 'outline' || variant === 'ghost' ? '' : ''}`}
          style={textStyle}
        >
          {title}
        </Text>
        {!loading && rightIcon && <View className="ml-2">{rightIcon}</View>}
      </Pressable>
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