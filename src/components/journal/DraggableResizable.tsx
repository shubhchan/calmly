import React, { useMemo, useRef } from 'react';
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
  containerHeight = 600,
  isFreeform,
  isSelected = false,
  onSelect,
  renderHeaderBar,
  minWidth = 120,
  minHeight = 100,
  maxWidth = 800,
  maxHeight = 1000,
  style,
  children,
}: DraggableResizableProps) {
  const { colors, isDark } = useAppTheme();

  const layoutRef = useRef(layout);
  layoutRef.current = layout;

  const dragStartRef = useRef({ x: layout.x, y: layout.y });
  const resizeStartRef = useRef({ width: layout.width, height: layout.height });

  const effectiveMaxWidth = Math.min(maxWidth, containerWidth > 0 ? containerWidth : maxWidth);
  const effectiveMaxHeight = Math.min(maxHeight, containerHeight > 0 ? containerHeight : maxHeight);

  // PanResponder for dragging whole element
  const dragResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 2 || Math.abs(gesture.dy) > 2,
        onPanResponderGrant: () => {
          onSelect?.();
          dragStartRef.current = { x: layoutRef.current.x, y: layoutRef.current.y };
        },
        onPanResponderMove: (_, gesture) => {
          const current = layoutRef.current;
          const maxX = Math.max(0, (containerWidth || 360) - current.width);
          const maxY = Math.max(0, (containerHeight || 600) - current.height);

          const nextX = Math.round(Math.max(0, Math.min(maxX, dragStartRef.current.x + gesture.dx)));
          const nextY = Math.round(Math.max(0, Math.min(maxY, dragStartRef.current.y + gesture.dy)));

          onChange({
            ...current,
            x: nextX,
            y: nextY,
          });
        },
        onPanResponderRelease: () => {
          // Finished drag
        },
      }),
    [containerWidth, containerHeight, onChange, onSelect]
  );

  // PanResponder for bottom-right corner resize handle
  const resizeResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 2 || Math.abs(gesture.dy) > 2,
        onPanResponderGrant: () => {
          onSelect?.();
          resizeStartRef.current = {
            width: layoutRef.current.width,
            height: layoutRef.current.height,
          };
        },
        onPanResponderMove: (_, gesture) => {
          const current = layoutRef.current;
          const nextW = Math.round(
            Math.max(
              minWidth,
              Math.min(effectiveMaxWidth - current.x, resizeStartRef.current.width + gesture.dx)
            )
          );
          const nextH = Math.round(
            Math.max(
              minHeight,
              Math.min(effectiveMaxHeight - current.y, resizeStartRef.current.height + gesture.dy)
            )
          );

          onChange({
            ...current,
            width: nextW,
            height: nextH,
          });
        },
        onPanResponderRelease: () => {
          // Finished resize
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
          backgroundColor: isDark ? 'rgba(30, 38, 34, 0.96)' : 'rgba(255, 255, 255, 0.96)',
          borderWidth: isSelected ? 1.5 : 1,
          borderColor: isSelected
            ? colors.primary.default
            : isDark
            ? 'rgba(255, 255, 255, 0.12)'
            : 'rgba(44, 79, 69, 0.25)',
          shadowColor: '#14241E',
          shadowOffset: { width: 0, height: isSelected ? 6 : 3 },
          shadowOpacity: isSelected ? 0.18 : 0.08,
          shadowRadius: isSelected ? 16 : 8,
          elevation: isSelected ? 8 : 3,
          zIndex: isSelected ? 30 : 15,
          overflow: 'hidden',
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
            paddingHorizontal: 8,
            paddingVertical: 5,
            backgroundColor: isDark ? '#1F2B26' : '#E3ECE7',
            borderBottomWidth: 1,
            borderBottomColor: colors.border.subtle,
            ...(Platform.OS === 'web' ? ({ cursor: 'grab' } as any) : {}),
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={styles.gripDot} />
            <View style={styles.gripDot} />
            <View style={styles.gripDot} />
          </View>
        </View>
      )}

      {/* Main content body */}
      <View style={{ flex: 1, overflow: 'hidden' }}>{children}</View>

      {/* Bottom-right diagonal resize corner handle */}
      <View
        {...resizeResponder.panHandlers}
        accessibilityRole="adjustable"
        accessibilityLabel="Resize handle"
        style={{
          position: 'absolute',
          right: 2,
          bottom: 2,
          width: 22,
          height: 22,
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 40,
          backgroundColor: 'transparent',
          ...(Platform.OS === 'web' ? ({ cursor: 'se-resize' } as any) : {}),
        }}
      >
        <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
          <Path
            d="M21 15v6h-6M21 21l-7-7"
            stroke={isSelected ? colors.primary.default : colors.text.tertiary}
            strokeWidth={2.4}
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
