import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { useAppTheme } from '../../theme/ThemeContext';
import { radius, spacing } from '../../theme/tokens';
import { AppText } from './AppText';
import { Modal } from './Modal';

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  showHandle?: boolean;
  showCloseButton?: boolean;
  maxHeightRatio?: number;
  scrollable?: boolean;
  panelStyle?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Bottom-anchored sheet built on the base Modal, with a grabber, title block
 * and scrollable body. Dismisses via backdrop press, close button or back.
 */
export function BottomSheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
  footer,
  showHandle = true,
  showCloseButton = false,
  maxHeightRatio = 0.85,
  scrollable = true,
  panelStyle,
  testID,
}: BottomSheetProps) {
  const theme = useAppTheme();
  const c = theme.colors;

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      position="bottom"
      footer={footer}
      showCloseButton={showCloseButton}
      maxHeightRatio={maxHeightRatio}
      scrollable={scrollable}
      panelStyle={panelStyle}
      testID={testID}
    >
      {showHandle ? (
        <View style={{ alignItems: 'center', marginBottom: spacing[3] }}>
          <View
            style={{
              width: spacing[10],
              height: spacing[1],
              borderRadius: radius.full,
              backgroundColor: c.border.strong,
            }}
          />
        </View>
      ) : null}
      {title ? (
        <AppText
          variant="h3"
          style={{
            marginBottom: subtitle ? spacing[1] : spacing[4],
            paddingRight: showCloseButton ? spacing[8] : 0,
          }}
        >
          {title}
        </AppText>
      ) : null}
      {subtitle ? (
        <AppText variant="bodySmall" tone="tertiary" style={{ marginBottom: spacing[4] }}>
          {subtitle}
        </AppText>
      ) : null}
      {children}
    </Modal>
  );
}
