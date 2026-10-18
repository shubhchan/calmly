import React from 'react';
import { View } from 'react-native';
import { useAppTheme } from '../../theme/ThemeContext';
import { iconSizes, radius, sizes, spacing } from '../../theme/tokens';
import { AppIcon } from '../AppIcon';
import { AppText } from './AppText';
import { Button } from './Button';
import { Modal } from './Modal';

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
  iconName?: string;
  loading?: boolean;
  testID?: string;
}

/**
 * Confirmation dialog built on the base Modal, with a tinted icon plate and
 * cancel/confirm actions for destructive or high-stakes choices.
 */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  destructive = false,
  iconName,
  loading = false,
  testID,
}: ConfirmDialogProps) {
  const theme = useAppTheme();
  const c = theme.colors;
  const plateSize = sizes.touchTarget + spacing[3];
  const icon = iconName ?? (destructive ? 'i-alert-circle' : 'i-information-circle');
  const plateBackground = destructive ? c.status.error.subtle : c.primary.subtle;
  const iconColor = destructive ? c.status.error.default : c.primary.default;

  return (
    <Modal
      visible={visible}
      onClose={onCancel}
      position="center"
      testID={testID}
      footer={
        <>
          <Button
            title={cancelLabel}
            variant="secondary"
            onPress={onCancel}
            disabled={loading}
          />
          <Button
            title={confirmLabel}
            variant={destructive ? 'destructive' : 'primary'}
            onPress={onConfirm}
            loading={loading}
          />
        </>
      }
    >
      <View style={{ alignItems: 'center', paddingTop: spacing[3] }}>
        <View
          style={{
            width: plateSize,
            height: plateSize,
            borderRadius: radius.full,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: plateBackground,
            marginBottom: spacing[4],
          }}
        >
          <AppIcon name={icon} size={iconSizes.xl} color={iconColor} animated={false} />
        </View>
        <AppText variant="h3" center>
          {title}
        </AppText>
        {message ? (
          <AppText variant="body" tone="secondary" center style={{ marginTop: spacing[2] }}>
            {message}
          </AppText>
        ) : null}
      </View>
    </Modal>
  );
}
