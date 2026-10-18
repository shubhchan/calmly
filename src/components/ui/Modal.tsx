import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Modal as RNModal,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppReducedMotion } from '../../theme/motion';
import { useAppTheme } from '../../theme/ThemeContext';
import { motion, motionPresets, resolveShadow, shape, spacing } from '../../theme/tokens';
import { AppText } from './AppText';
import { IconButton } from './IconButton';

export type ModalPosition = 'center' | 'bottom' | 'top';

export interface ModalProps {
  visible: boolean;
  onClose?: () => void;
  onClosed?: () => void;
  position?: ModalPosition;
  title?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  dismissOnBackdropPress?: boolean;
  showCloseButton?: boolean;
  scrollable?: boolean;
  maxWidth?: number;
  maxHeightRatio?: number;
  panelStyle?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Themed base dialog with animated mount/unmount, backdrop dismissal,
 * hardware-back handling and optional scrolling body.
 */
export function Modal({
  visible,
  onClose,
  onClosed,
  position = 'center',
  title,
  children,
  footer,
  dismissOnBackdropPress = true,
  showCloseButton = true,
  scrollable = false,
  maxWidth = 420,
  maxHeightRatio = 0.85,
  panelStyle,
  contentStyle,
  testID,
}: ModalProps) {
  const theme = useAppTheme();
  const c = theme.colors;
  const insets = useSafeAreaInsets();
  const reducedMotion = useAppReducedMotion();
  const { height: windowHeight } = useWindowDimensions();

  const [mounted, setMounted] = useState(visible);
  const progress = useSharedValue(0);
  const onClosedRef = useRef(onClosed);

  useEffect(() => {
    onClosedRef.current = onClosed;
  }, [onClosed]);

  const handleExited = useCallback(() => {
    setMounted(false);
    onClosedRef.current?.();
  }, []);

  useEffect(() => {
    if (!visible) return;
    setMounted(true);
    if (reducedMotion) {
      progress.value = 1;
    } else {
      progress.value = 0;
      progress.value = withTiming(1, motionPresets.modal);
    }
  }, [visible, reducedMotion, progress]);

  useEffect(() => {
    if (visible || !mounted) return;
    if (reducedMotion) {
      progress.value = 0;
      handleExited();
    } else {
      progress.value = withTiming(0, motionPresets.collapse, (finished) => {
        if (finished) runOnJS(handleExited)();
      });
    }
  }, [visible, reducedMotion, mounted, progress, handleExited]);

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  const panelAnimatedStyle = useAnimatedStyle(() => {
    const hiddenOffset =
      position === 'bottom'
        ? windowHeight + spacing[8]
        : position === 'top'
          ? -(windowHeight + spacing[8])
          : motion.rise;
    const scale =
      position === 'center' ? 1 - (1 - progress.value) * (1 - motion.settleScale) : 1;
    return {
      opacity: progress.value,
      transform: [{ translateY: (1 - progress.value) * hiddenOffset }, { scale }],
    };
  });

  const containerStyle: ViewStyle =
    position === 'center'
      ? { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing[5] }
      : position === 'bottom'
        ? { flex: 1, justifyContent: 'flex-end' }
        : {
            flex: 1,
            justifyContent: 'flex-start',
            paddingHorizontal: spacing[5],
            paddingTop: insets.top + spacing[5],
          };

  return (
    <RNModal
      transparent
      visible={mounted}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
      testID={testID}
    >
      <View style={containerStyle}>
        <Animated.View
          style={[StyleSheet.absoluteFill, { backgroundColor: c.overlay.scrim }, backdropAnimatedStyle]}
        />
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={dismissOnBackdropPress ? onClose : undefined}
          accessible={false}
        />
        <Animated.View
          accessibilityViewIsModal
          onAccessibilityEscape={onClose}
          style={[
            {
              width: '100%',
              maxWidth: position === 'bottom' ? undefined : maxWidth,
              maxHeight: `${maxHeightRatio * 100}%` as `${number}%`,
              backgroundColor: c.surface.elevated,
              padding: spacing[5],
              paddingBottom: position === 'bottom' ? spacing[5] + insets.bottom : spacing[5],
              ...(position === 'bottom' ? shape.bottomSheet : { borderRadius: shape.dialog }),
            },
            resolveShadow('xl', theme.isDark, c.text.primary),
            panelAnimatedStyle,
            panelStyle,
          ]}
        >
          {showCloseButton ? (
            <View style={{ position: 'absolute', top: spacing[3], right: spacing[3], zIndex: 1 }}>
              <IconButton
                icon="i-close"
                accessibilityLabel="Close"
                variant="ghost"
                onPress={onClose}
              />
            </View>
          ) : null}
          {title ? (
            <View style={{ marginBottom: spacing[3], paddingRight: showCloseButton ? spacing[8] : 0 }}>
              <AppText variant="h3">{title}</AppText>
            </View>
          ) : null}
          {scrollable ? (
            <ScrollView
              scrollEnabled
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              style={[{ flexShrink: 1 }, contentStyle]}
            >
              {children}
            </ScrollView>
          ) : (
            <View style={contentStyle}>{children}</View>
          )}
          {footer ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: spacing[3],
                marginTop: spacing[5],
              }}
            >
              {footer}
            </View>
          ) : null}
        </Animated.View>
      </View>
    </RNModal>
  );
}
