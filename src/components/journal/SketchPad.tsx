import React, { useMemo, useRef, useState } from 'react';
import { PanResponder, View, Platform, TouchableOpacity } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useAppTheme } from '../../theme/ThemeContext';
import { sketchPath, type SketchStroke } from '../../features/journal/sketch';
import { sketchInks } from '../../features/journal/papers';
import { AppText } from '../ui/AppText';

export interface SketchPadProps {
  strokes: SketchStroke[];
  onChange: (next: SketchStroke[]) => void;
  color?: string;
  onColorChange?: (color: string) => void;
  width?: number | string;
  height?: number;
  zeroPad?: boolean;
  compact?: boolean;
  hideHeader?: boolean;
  hideFooter?: boolean;
  onToggleHideHeader?: () => void;
  onToggleHideFooter?: () => void;
  onToggleZeroPad?: () => void;
  onToggleCompact?: () => void;
  onClose?: () => void;
  dragHandlers?: any;
  isFreeform?: boolean;
  accessibilityLabel?: string;
}

export function SketchPad({
  strokes,
  onChange,
  color: activeColorProp,
  onColorChange,
  width = '100%',
  height,
  zeroPad = false,
  compact = false,
  hideHeader = false,
  hideFooter = false,
  onToggleHideHeader,
  onToggleHideFooter,
  onToggleZeroPad,
  onToggleCompact,
  onClose,
  dragHandlers,
  isFreeform = false,
  accessibilityLabel = 'Drawing pad',
}: SketchPadProps) {
  const { colors, isDark } = useAppTheme();
  const availableInks = useMemo(() => sketchInks(isDark), [isDark]);
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
        height: height ?? (isFreeform ? '100%' : 200),
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
      {/* Optional Control / Drag Header Bar */}
      {isFreeform && !hideHeader && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: isDark ? '#141C18' : '#1A2420',
            borderRadius: 8,
            paddingHorizontal: compact ? 6 : 8,
            paddingVertical: compact ? 3 : 5,
            marginBottom: zeroPad ? 0 : 4,
          }}
        >
          {/* Drag Handle with Grip and Move Icon */}
          <View
            {...(dragHandlers || {})}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              paddingRight: 6,
              ...(Platform.OS === 'web' ? ({ cursor: 'grab' } as any) : {}),
            }}
          >
            <Svg width={11} height={11} viewBox="0 0 24 24" fill="none">
              <Path
                d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20"
                stroke="#D2B078"
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <AppText
              style={{
                fontSize: 10,
                fontWeight: '700',
                letterSpacing: 0.6,
                textTransform: 'uppercase',
                color: '#D2B078',
              }}
            >
              Drag
            </AppText>
          </View>

          {/* Action buttons matching Doop: Header, Footer, ZeroPad, Compact, Close */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {/* Toggle Header (Self-hide button) */}
            {onToggleHideHeader && (
              <TouchableOpacity
                onPress={onToggleHideHeader}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                accessibilityRole="button"
                accessibilityLabel="Hide header"
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                }}
              >
                <Svg width={11} height={11} viewBox="0 0 24 24" fill="none">
                  <Path d="M4 6h16M4 12h10" stroke="#FFF" strokeWidth={2} strokeLinecap="round" />
                </Svg>
              </TouchableOpacity>
            )}

            {/* Toggle Footer */}
            {onToggleHideFooter && (
              <TouchableOpacity
                onPress={onToggleHideFooter}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                accessibilityRole="button"
                accessibilityLabel="Toggle footer"
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: !hideFooter ? 'rgba(255, 255, 255, 0.22)' : 'rgba(255, 255, 255, 0.08)',
                }}
              >
                <Svg width={11} height={11} viewBox="0 0 24 24" fill="none">
                  <Circle cx={6} cy={12} r={2.5} fill="#B4C0BA" />
                  <Circle cx={12} cy={12} r={2.5} fill="#B4C0BA" />
                  <Circle cx={18} cy={12} r={2.5} fill="#B4C0BA" />
                </Svg>
              </TouchableOpacity>
            )}

            {/* Zero Padding Toggle */}
            {onToggleZeroPad && (
              <TouchableOpacity
                onPress={onToggleZeroPad}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                accessibilityRole="button"
                accessibilityLabel="Zero padding"
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: zeroPad ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                }}
              >
                <Svg width={11} height={11} viewBox="0 0 24 24" fill="none">
                  <Rect
                    x={3}
                    y={3}
                    width={18}
                    height={18}
                    rx={2}
                    stroke={zeroPad ? '#FFF' : '#B4C0BA'}
                    strokeWidth={2}
                  />
                </Svg>
              </TouchableOpacity>
            )}

            {/* Compact Toggle */}
            {onToggleCompact && (
              <TouchableOpacity
                onPress={onToggleCompact}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                accessibilityRole="button"
                accessibilityLabel="Compact mode"
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: compact ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                }}
              >
                <Svg width={11} height={11} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M4 14h6v6M20 10h-6V4"
                    stroke={compact ? '#FFF' : '#B4C0BA'}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </TouchableOpacity>
            )}

            {/* Close / Remove */}
            {onClose && (
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                accessibilityRole="button"
                accessibilityLabel="Remove sketch"
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(227, 141, 132, 0.18)',
                }}
              >
                <Svg width={11} height={11} viewBox="0 0 24 24" fill="none">
                  <Path d="M18 6L6 18M6 6l12 12" stroke="#E38D84" strokeWidth={2.4} strokeLinecap="round" />
                </Svg>
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
          ...(Platform.OS === 'web' ? ({ cursor: 'crosshair' } as any) : {}),
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
            paddingTop: compact ? 3 : 6,
            paddingHorizontal: 2,
            borderTopWidth: zeroPad ? 0 : 1,
            borderTopColor: colors.border.subtle,
            marginTop: 2,
          }}
        >
          {/* Ink color palette dots */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: compact ? 6 : 8 }}>
            {availableInks.map((ink) => {
              const isSelected = ink.color === currentColor;
              return (
                <TouchableOpacity
                  key={ink.id}
                  onPress={() => selectColor(ink.color)}
                  hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                  accessibilityRole="button"
                  accessibilityLabel={`Color ${ink.id}`}
                  style={{
                    width: compact ? 12 : 15,
                    height: compact ? 12 : 15,
                    borderRadius: 999,
                    backgroundColor: ink.color,
                    borderWidth: isSelected ? 2 : 1,
                    borderColor: isSelected
                      ? isDark
                        ? '#FFF'
                        : '#1A2420'
                      : 'rgba(0,0,0,0.1)',
                  }}
                />
              );
            })}
          </View>

          {/* Undo and Clear actions */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {strokes.length > 0 && (
              <>
                <TouchableOpacity
                  onPress={handleUndo}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  accessibilityRole="button"
                  accessibilityLabel="Undo last stroke"
                >
                  <AppText style={{ fontSize: compact ? 9.5 : 11, color: colors.text.secondary }}>
                    Undo
                  </AppText>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleClear}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  accessibilityRole="button"
                  accessibilityLabel="Clear drawing"
                >
                  <AppText style={{ fontSize: compact ? 9.5 : 11, color: colors.text.tertiary }}>
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
