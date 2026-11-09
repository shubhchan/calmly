import React, { useMemo, useRef, useState } from 'react';
import { PanResponder, View, Platform, TouchableOpacity } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useAppTheme } from '../../theme/ThemeContext';
import { sketchPath, type SketchStroke } from '../../features/journal/sketch';
import { sketchInks } from '../../features/journal/papers';
import { AppText } from '../ui/AppText';

export interface SketchPadProps {
  strokes: SketchStroke[];
  onChange: (next: SketchStroke[]) => void;
  color?: string;
  onColorChange?: (color: string) => void;
  accentColor?: string;
  width?: number | string;
  height?: number;
  zeroPad?: boolean;
  compact?: boolean;
  hideHeader?: boolean;
  hideFooter?: boolean;
  isFreeform?: boolean;
  onClose?: () => void;
  accessibilityLabel?: string;
}

export function SketchPad({
  strokes,
  onChange,
  color: activeColorProp,
  onColorChange,
  accentColor,
  width = '100%',
  height,
  zeroPad = false,
  compact = false,
  hideHeader = false,
  hideFooter = false,
  isFreeform = false,
  onClose,
  accessibilityLabel = 'Drawing pad',
}: SketchPadProps) {
  const { colors, isDark } = useAppTheme();
  const availableInks = useMemo(() => sketchInks(isDark, accentColor), [isDark, accentColor]);
  const [internalColor, setInternalColor] = useState(availableInks[0].color);

  const currentColor = activeColorProp || internalColor;
  const selectColor = (c: string) => {
    setInternalColor(c);
    onColorChange?.(c);
  };

  const [draft, setDraft] = useState<SketchStroke | null>(null);
  const draftRef = useRef<SketchStroke | null>(null);
  const strokesRef = useRef(strokes);
  strokesRef.current = strokes;

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (event) => {
          const point = {
            x: event.nativeEvent.locationX,
            y: event.nativeEvent.locationY,
          };
          const stroke: SketchStroke = { color: currentColor, points: [point] };
          draftRef.current = stroke;
          setDraft(stroke);
        },
        onPanResponderMove: (event) => {
          const current = draftRef.current;
          if (!current) return;
          const next: SketchStroke = {
            color: current.color,
            points: [
              ...current.points,
              { x: event.nativeEvent.locationX, y: event.nativeEvent.locationY },
            ],
          };
          draftRef.current = next;
          setDraft(next);
        },
        onPanResponderRelease: () => {
          const current = draftRef.current;
          draftRef.current = null;
          setDraft(null);
          if (current && current.points.length > 0) {
            onChange([...strokesRef.current, current]);
          }
        },
        onPanResponderTerminate: () => {
          draftRef.current = null;
          setDraft(null);
        },
      }),
    [currentColor, onChange]
  );

  const handleUndo = () => {
    if (strokes.length > 0) {
      onChange(strokes.slice(0, -1));
    }
  };

  const handleClear = () => {
    if (strokes.length > 0) {
      onChange([]);
    }
  };

  const visible = draft ? [...strokes, draft] : strokes;

  return (
    <View
      style={{
        width: (width as any),
        height: height ?? (isFreeform ? '100%' : 190),
        borderRadius: zeroPad ? 0 : 14,
        backgroundColor: zeroPad
          ? 'transparent'
          : isDark
          ? 'rgba(26, 34, 30, 0.94)'
          : 'rgba(255, 255, 255, 0.94)',
        padding: zeroPad ? 0 : compact ? 4 : 6,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* In-flow header when NOT freeform (Doop mock OTWwlveYaS) */}
      {!isFreeform && !hideHeader && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 6,
            paddingVertical: 4,
            borderBottomWidth: 1,
            borderBottomColor: colors.border.subtle,
            marginBottom: 4,
          }}
        >
          <AppText
            style={{
              fontSize: 11,
              fontWeight: '700',
              letterSpacing: 1.1,
              textTransform: 'uppercase',
              color: accentColor || colors.primary.default,
            }}
          >
            Sketch
          </AppText>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {strokes.length > 0 && (
              <TouchableOpacity
                onPress={handleUndo}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                accessibilityRole="button"
                accessibilityLabel="Undo"
              >
                <AppText style={{ fontSize: 11, color: colors.text.secondary }}>Undo</AppText>
              </TouchableOpacity>
            )}
            {onClose && (
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                accessibilityRole="button"
                accessibilityLabel="Close sketch"
              >
                <AppText style={{ fontSize: 11, color: colors.text.tertiary }}>Close</AppText>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Drawing Canvas Area */}
      <View
        {...responder.panHandlers}
        accessibilityRole="image"
        accessibilityLabel={accessibilityLabel}
        style={{
          flex: 1,
          borderRadius: zeroPad ? 0 : 8,
          backgroundColor: zeroPad
            ? 'transparent'
            : isDark
            ? colors.surface.default
            : '#FFFFFF',
          borderWidth: zeroPad ? 0 : 1,
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : colors.border.subtle,
          overflow: 'hidden',
          ...(Platform.OS === 'web'
            ? ({
                cursor: 'crosshair',
                userSelect: 'none',
                touchAction: 'none',
              } as any)
            : {}),
        }}
      >
        <Svg width="100%" height="100%">
          {visible.map((stroke, index) =>
            stroke.points.length === 1 ? (
              <Circle
                key={`dot-${index}`}
                cx={stroke.points[0].x}
                cy={stroke.points[0].y}
                r={1.6}
                fill={stroke.color}
              />
            ) : (
              <Path
                key={`stroke-${index}`}
                d={sketchPath(stroke.points)}
                stroke={stroke.color}
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            )
          )}
        </Svg>
      </View>

      {/* Footer with ink swatches and Undo / Clear */}
      {!hideFooter && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: compact ? 3 : 5,
            paddingHorizontal: 4,
            borderTopWidth: zeroPad ? 0 : 1,
            borderTopColor: colors.border.subtle,
            marginTop: 2,
          }}
        >
          {/* Ink color palette dots */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: compact ? 7 : 9 }}>
            {availableInks.map((ink) => {
              const isSelected = ink.color.toLowerCase() === currentColor.toLowerCase();
              return (
                <TouchableOpacity
                  key={ink.id}
                  onPress={() => selectColor(ink.color)}
                  hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                  accessibilityRole="button"
                  accessibilityLabel={`Color ${ink.id}`}
                  style={{
                    width: compact ? 13 : 16,
                    height: compact ? 13 : 16,
                    borderRadius: 999,
                    backgroundColor: ink.color,
                    borderWidth: isSelected ? 2 : 1,
                    borderColor: isSelected
                      ? isDark
                        ? '#FFF'
                        : '#1A2420'
                      : 'rgba(0,0,0,0.12)',
                  }}
                />
              );
            })}
          </View>

          {/* Undo and Clear actions */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {strokes.length > 0 && (
              <>
                <TouchableOpacity
                  onPress={handleUndo}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  accessibilityRole="button"
                  accessibilityLabel="Undo last stroke"
                >
                  <AppText style={{ fontSize: compact ? 10 : 11.5, color: colors.text.secondary }}>
                    Undo
                  </AppText>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleClear}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  accessibilityRole="button"
                  accessibilityLabel="Clear drawing"
                >
                  <AppText style={{ fontSize: compact ? 10 : 11.5, color: colors.text.tertiary }}>
                    Clear
                  </AppText>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      )}
    </View>
  );
}
