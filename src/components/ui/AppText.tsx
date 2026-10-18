import React from 'react';
import { Text, TextProps, TextStyle, StyleProp, ColorValue } from 'react-native';
import { useAppTheme } from '../../theme/ThemeContext';
import { resolveTextStyle, type TextVariant, type TextTone } from '../../theme/tokens';
import type { AppTheme } from '../../theme/themes';

export interface AppTextProps extends TextProps {
  variant?: TextVariant;
  tone?: TextTone;
  /** Explicit color override — prefer semantic tones. */
  color?: ColorValue;
  center?: boolean;
  style?: StyleProp<TextStyle>;
  children?: React.ReactNode;
}

function toneColor(tone: TextTone, theme: AppTheme): ColorValue | undefined {
  const c = theme.colors;
  switch (tone) {
    case 'inherit':
      return undefined;
    case 'primary':
      return c.text.primary;
    case 'secondary':
      return c.text.secondary;
    case 'tertiary':
      return c.text.tertiary;
    case 'inverse':
      return c.text.inverse;
    case 'disabled':
      return c.text.disabled;
    case 'link':
      return c.text.link;
    case 'onPrimary':
      return c.primary.foreground;
    case 'success':
      return c.status.success.foreground;
    case 'warning':
      return c.status.warning.foreground;
    case 'error':
      return c.status.error.foreground;
    case 'info':
      return c.status.info.foreground;
  }
}

/**
 * Themed text primitive. Every piece of copy in new UI code should render
 * through this component so typography and color stay token-driven.
 */
export function AppText({
  variant = 'body',
  tone = 'primary',
  color,
  center,
  style,
  children,
  ...rest
}: AppTextProps) {
  const theme = useAppTheme();
  return (
    <Text
      {...rest}
      style={[
        resolveTextStyle(variant),
        center ? { textAlign: 'center' } : null,
        { color: color ?? toneColor(tone, theme) },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export type HeadingVariant = 'display' | 'h1' | 'h2' | 'h3' | 'title';

export interface HeadingProps extends Omit<AppTextProps, 'variant'> {
  variant?: HeadingVariant;
}

/** Semantic heading — h1 by default. */
export function Heading({ variant = 'h1', ...rest }: HeadingProps) {
  return <AppText variant={variant} {...rest} />;
}
