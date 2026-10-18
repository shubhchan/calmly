import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { useAppTheme } from '../../theme/ThemeContext';
import { borderWidths, iconSizes, shape, spacing } from '../../theme/tokens';
import { AppIcon } from '../AppIcon';
import { AppText } from './AppText';
import { IconButton } from './IconButton';

export type InlineAlertTone = 'neutral' | 'success' | 'warning' | 'error' | 'info';

export interface InlineAlertProps {
  tone: InlineAlertTone;
  title?: string;
  message?: string;
  children?: React.ReactNode;
  onDismiss?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

interface AlertToneSpec {
  background: string;
  border: string;
  icon: string;
  ink: string;
  titleInk: string;
}

/** Inline status banner for confirmations, warnings and errors within a screen. */
export function InlineAlert({
  tone,
  title,
  message,
  children,
  onDismiss,
  style,
  testID,
}: InlineAlertProps) {
  const theme = useAppTheme();
  const c = theme.colors;

  const toneSpecs: Record<InlineAlertTone, AlertToneSpec> = {
    neutral: {
      background: c.surface.muted,
      border: c.border.default,
      icon: 'i-information-circle',
      ink: c.text.secondary,
      titleInk: c.text.primary,
    },
    success: {
      background: c.status.success.subtle,
      border: c.status.success.border,
      icon: 'i-checkmark-circle',
      ink: c.status.success.foreground,
      titleInk: c.status.success.foreground,
    },
    warning: {
      background: c.status.warning.subtle,
      border: c.status.warning.border,
      icon: 'i-alert-circle',
      ink: c.status.warning.foreground,
      titleInk: c.status.warning.foreground,
    },
    error: {
      background: c.status.error.subtle,
      border: c.status.error.border,
      icon: 'i-alert-circle',
      ink: c.status.error.foreground,
      titleInk: c.status.error.foreground,
    },
    info: {
      background: c.status.info.subtle,
      border: c.status.info.border,
      icon: 'i-information-circle',
      ink: c.status.info.foreground,
      titleInk: c.status.info.foreground,
    },
  };

  const spec = toneSpecs[tone];

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: spacing[3],
          backgroundColor: spec.background,
          borderColor: spec.border,
          borderWidth: borderWidths.thin,
          borderRadius: shape.toast,
          padding: spacing[3],
        },
        style,
      ]}
      testID={testID}
    >
      <AppIcon name={spec.icon} size={iconSizes.md} color={spec.ink} animated={false} />
      <View style={{ flex: 1, gap: spacing[1] }}>
        {title ? (
          <AppText variant="label" color={spec.titleInk}>
            {title}
          </AppText>
        ) : null}
        {children ? (
          children
        ) : message ? (
          <AppText variant="bodySmall" tone="secondary">
            {message}
          </AppText>
        ) : null}
      </View>
      {onDismiss ? (
        <IconButton
          icon="i-close"
          variant="ghost"
          size="sm"
          tone="subtle"
          accessibilityLabel="Dismiss"
          onPress={onDismiss}
        />
      ) : null}
    </View>
  );
}
