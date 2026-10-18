import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { useAppTheme } from '../../theme/ThemeContext';
import { iconSizes, radius, spacing } from '../../theme/tokens';
import { resolveTint, type TintName } from '../../theme/tints';
import { AppIcon } from '../AppIcon';
import { AppText } from './AppText';
import { Button, type ButtonVariant } from './Button';

export interface EmptyStateAction {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
}

export interface EmptyStateProps {
  iconName: string;
  iconTone?: TintName;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Friendly zero-data state: tinted icon plate, title, description and optional action. */
export function EmptyState({
  iconName,
  iconTone = 'sage',
  title,
  description,
  action,
  compact = false,
  style,
  testID,
}: EmptyStateProps) {
  const theme = useAppTheme();
  const tint = resolveTint(theme.isDark, iconTone);
  const plateSize = compact ? 52 : 64;

  return (
    <View
      style={[
        { alignItems: 'center', paddingVertical: compact ? spacing[6] : spacing[8] },
        style,
      ]}
      testID={testID}
    >
      <View
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{
          width: plateSize,
          height: plateSize,
          borderRadius: radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: tint.bg,
        }}
      >
        <AppIcon
          name={iconName}
          size={compact ? iconSizes.lg : iconSizes.xl}
          color={tint.accent}
        />
      </View>
      <AppText variant="h3" center style={{ marginTop: spacing[4] }}>
        {title}
      </AppText>
      {description ? (
        <AppText
          variant="body"
          tone="secondary"
          center
          style={{ marginTop: spacing[2], maxWidth: 320 }}
        >
          {description}
        </AppText>
      ) : null}
      {action ? (
        <View style={{ marginTop: compact ? spacing[4] : spacing[5] }}>
          <Button
            title={action.label}
            onPress={action.onPress}
            variant={action.variant ?? 'primary'}
          />
        </View>
      ) : null}
    </View>
  );
}
