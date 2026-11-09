import React, { useMemo, useRef, useState } from 'react';
import { View, PanResponder, Platform, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useAppTheme } from '../../theme/ThemeContext';
import { ElementLayout } from '../../types/journalLayout';

interface DraggableResizableProps {
  layout: ElementLayout;
  onChange: (next: ElementLayout) => void;
  containerWidth?: number;
  containerHeight?: number;
  isFreeform: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
  renderHeaderBar?: (dragHandlers: any) => React.ReactNode;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  style?: any;
  children: React.ReactNode;
}

export function DraggableResizable({
  layout,
  onChange,
  containerWidth = 360,
  containerHeight = 1200,
  isFreeform,
  isSelected = false,
  onSelect,
  renderHeaderBar,
  minWidth = 140,
  minHeight = 110,
  maxWidth = 800,
  maxHeight = 2000,
  style,
  children,
}: DraggableResizableProps) {
  const { colors, isDark } = useAppTheme();
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const layoutRef = useRef(layout);
  layoutRef.current = layout;

  const dragStartRef = useRef({ x: layout.x, y: layout.y });
  const resizeStartRef = useRef({ width: layout.width, height: layout.height });

  // Safe boundary maximums allowing movement across the whole journal paper sheet
  const safeMaxX = Math.max(100, (containerWidth || 360) - layout.width);
  const safeMaxY = Math.max(600, (containerHeight || 1200) - layout.height);
  const effectiveMaxWidth = Math.min(maxWidth, Math.max(300, (containerWidth || 360) - layout.x));
  const effectiveMaxHeight = Math.min(maxHeight, 1800);

  // PanResponder for dragging element via the header bar / drag handle
  const dragResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 1 || Math.abs(gesture.dy) > 1,
        onMoveShouldSetPanResponderCapture: (_, gesture) => Math.abs(gesture.dx) > 1 || Math.abs(gesture.dy) > 1,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          setIsDragging(true);
          onSelect?.();
          dragStartRef.current = {
            x: Number(layoutRef.current.x) || 0,
            y: Number(layoutRef.current.y) || 0,
          };
        },
        onPanResponderMove: (_, gesture) => {
          const current = layoutRef.current;
          const targetX = dragStartRef.current.x + gesture.dx;
          const targetY = dragStartRef.current.y + gesture.dy;

          const clampedX = Math.round(Math.max(0, Math.min(safeMaxX, targetX)));
          const clampedY = Math.round(Math.max(0, Math.min(safeMaxY, targetY)));

          onChange({
            ...current,
            x: clampedX,
            y: clampedY,
          });
        },
        onPanResponderRelease: () => {
          setIsDragging(false);
        },
        onPanResponderTerminate: () => {
          setIsDragging(false);
        },
      }),
    [safeMaxX, safeMaxY, onChange, onSelect]
  );

  // PanResponder for bottom-right corner resize handle
  const resizeResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 1 || Math.abs(gesture.dy) > 1,
        onMoveShouldSetPanResponderCapture: (_, gesture) => Math.abs(gesture.dx) > 1 || Math.abs(gesture.dy) > 1,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          setIsResizing(true);
          onSelect?.();
          resizeStartRef.current = {
            width: Number(layoutRef.current.width) || 200,
            height: Number(layoutRef.current.height) || 160,
          };
        },
        onPanResponderMove: (_, gesture) => {
          const current = layoutRef.current;
          const targetW = resizeStartRef.current.width + gesture.dx;
          const targetH = resizeStartRef.current.height + gesture.dy;

          const clampedW = Math.round(Math.max(minWidth, Math.min(effectiveMaxWidth, targetW)));
          const clampedH = Math.round(Math.max(minHeight, Math.min(effectiveMaxHeight, targetH)));

          onChange({
            ...current,
            width: clampedW,
            height: clampedH,
          });
        },
        onPanResponderRelease: () => {
          setIsResizing(false);
        },
        onPanResponderTerminate: () => {
          setIsResizing(false);
        },
      }),
    [minWidth, minHeight, effectiveMaxWidth, effectiveMaxHeight, onChange, onSelect]
  );

  if (!isFreeform) {
    return <View style={style}>{children}</View>;
  }

  const { x, y, width, height } = layout;

  return (
    <View
      onTouchStart={onSelect}
      style={[
        {
          position: 'absolute',
          left: x,
          top: y,
          width,
          height,
          borderRadius: 16,
          backgroundColor: isDark ? 'rgba(28, 36, 32, 0.96)' : 'rgba(255, 255, 255, 0.97)',
          borderWidth: isSelected || isDragging || isResizing ? 2 : 1.2,
          borderColor: isSelected || isDragging || isResizing
            ? colors.primary.default
            : isDark
            ? 'rgba(255, 255, 255, 0.15)'
            : 'rgba(44, 79, 69, 0.3)',
          shadowColor: '#14241E',
          shadowOffset: { width: 0, height: isSelected || isDragging ? 8 : 3 },
          shadowOpacity: isSelected || isDragging ? 0.22 : 0.08,
          shadowRadius: isSelected || isDragging ? 18 : 8,
          elevation: isSelected || isDragging ? 10 : 3,
          zIndex: isSelected || isDragging || isResizing ? 40 : 20,
          overflow: 'visible', // Visible so corner resize handle stays easily grabable
        },
        style,
      ]}
    >
      {/* Header bar / drag handle */}
      {renderHeaderBar ? (
        renderHeaderBar(dragResponder.panHandlers)
      ) : (
        <View
          {...dragResponder.panHandlers}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 10,
            paddingVertical: 6,
            backgroundColor: isDark ? '#19241F' : '#E3ECE7',
            borderTopLeftRadius: 14,
            borderTopRightRadius: 14,
            borderBottomWidth: 1,
            borderBottomColor: colors.border.subtle,
            ...(Platform.OS === 'web'
              ? ({
                  cursor: isDragging ? 'grabbing' : 'grab',
                  userSelect: 'none',
                  touchAction: 'none',
                } as any)
              : {}),
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={styles.gripDot} />
            <View style={styles.gripDot} />
            <View style={styles.gripDot} />
            <AppText
              style={{
                fontSize: 10,
                fontWeight: '700',
                letterSpacing: 0.8,
                textTransform: 'uppercase',
                color: colors.primary.default,
                marginLeft: 4,
              }}
            >
              Drag
            </AppText>
          </View>
        </View>
      )}

      {/* Main content body */}
      <View style={{ flex: 1, borderRadius: 12, overflow: 'hidden' }}>{children}</View>

      {/* Bottom-right diagonal resize corner handle */}
      <View
        {...resizeResponder.panHandlers}
        accessibilityRole="adjustable"
        accessibilityLabel="Resize handle"
        style={{
          position: 'absolute',
          right: -4,
          bottom: -4,
          width: 32,
          height: 32,
          borderTopLeftRadius: 12,
          borderBottomRightRadius: 14,
          backgroundColor: isSelected || isResizing ? colors.primary.default : isDark ? '#2E3D35' : '#DDE5E0',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.18,
          shadowRadius: 3,
          elevation: 5,
          ...(Platform.OS === 'web'
            ? ({
                cursor: 'se-resize',
                userSelect: 'none',
                touchAction: 'none',
              } as any)
            : {}),
        }}
      >
        <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
          <Path
            d="M21 15v6h-6M21 21l-7-7"
            stroke={isSelected || isResizing ? '#FFFFFF' : colors.text.secondary}
            strokeWidth={2.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  gripDot: {
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: '#838F89',
  },
});
