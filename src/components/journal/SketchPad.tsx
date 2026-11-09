import React, { useMemo, useRef, useState } from 'react';
import { PanResponder, View, Platform, TouchableOpacity } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
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
  /** Background color of the containing paper — used for the dot ring in inline mode */
  paperBgColor?: string;
  width?: number | string;
  height?: number;
  zeroPad?: boolean;
  compact?: boolean;
  hideHeader?: boolean;
  hideFooter?: boolean;
  isFreeform?: boolean;
  onClose?: () => void;
  onResize?: () => void;
  accessibilityLabel?: string;
}

/** Render the undo SVG icon (circular arrow) matching Doop OTWwlveYaS */
function UndoIcon({ color = '#6C7873' }: { color?: string }) {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 9a8 8 0 1 1 2 8"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M4 4v5h5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Render the erase SVG icon (eraser) matching Doop OTWwlveYaS */
function EraseIcon({ color = '#6C7873' }: { color?: string }) {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 15l7-7 5 5-7 7H6z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M8 20h12" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function SketchPad({
  strokes,
  onChange,
  color: activeColorProp,
  onColorChange,
  accentColor,
  paperBgColor,
  width = '100%',
  height,
  zeroPad = false,
  compact = false,
  hideHeader = false,
  hideFooter = false,
  isFreeform = false,
  onClose,
  onResize,
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
    [currentColor, onChange],
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

  /**
   * Ring color behind selected ink dot.
   * In inline (non-freeform) mode: use the paper background color so it looks like
   * `box-shadow: 0 0 0 2px <paperBg>, 0 0 0 3.5px currentColor` from the mock.
   * In freeform mode: use white/surface.
   */
  const dotRingColor = paperBgColor || (isDark ? colors.surface.default : '#FFFFFF');

  return (
    <View
      style={{
        width: width as any,
        height: height ?? (isFreeform ? '100%' : 190),
        borderRadius: zeroPad ? 0 : 16,
        backgroundColor: zeroPad
          ? 'transparent'
          : isDark
          ? 'rgba(26, 34, 30, 0.94)'
          : 'rgba(255, 255, 255, 0.72)',
        borderWidth: zeroPad ? 0 : 1,
        borderColor: zeroPad
          ? 'transparent'
          : isDark
          ? 'rgba(255,255,255,0.08)'
          : `rgba(176,138,79,0.28)`,
        padding: zeroPad ? 0 : compact ? 8 : 10,
        paddingBottom: zeroPad ? 0 : compact ? 6 : 8,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── In-flow header when NOT freeform (Doop mock OTWwlveYaS) ── */}
      {!isFreeform && !hideHeader && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 4,
          }}
        >
          <AppText
            style={{
              fontSize: 11,
              fontWeight: '600',
              letterSpacing: 0.12 * 11,
              textTransform: 'uppercase',
              color: accentColor ? darken(accentColor) : '#8A7550',
            }}
          >
            Sketch
          </AppText>

          {/* Action icons: Undo, Erase, Resize, Close */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TouchableOpacity
              onPress={handleUndo}
              hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
              accessibilityRole="button"
              accessibilityLabel="Undo"
              style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}
            >
              <UndoIcon color={colors.text.secondary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleClear}
              hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
              accessibilityRole="button"
              accessibilityLabel="Clear drawing"
              style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}
            >
              <EraseIcon color={colors.text.secondary} />
            </TouchableOpacity>
            {onResize ? (
              <TouchableOpacity
                onPress={onResize}
                hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                accessibilityRole="button"
                accessibilityLabel="Resize block or adjust spacing"
                style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name="options-outline" size={15} color={colors.text.secondary} />
              </TouchableOpacity>
            ) : null}
            {onClose ? (
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                accessibilityRole="button"
                accessibilityLabel="Remove sketch"
                style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name="close" size={16} color={colors.text.secondary} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      )}

      {/* ── Drawing Canvas Area ── */}
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
          borderWidth: zeroPad ? 0 : 0,
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
            ),
          )}
        </Svg>
      </View>

      {/* ── Footer with ink swatches (Doop mock OTWwlveYaS / 09dIMTqlOD) ── */}
      {!hideFooter && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: compact ? 5 : 8,
            borderTopWidth: zeroPad ? 0 : 1,
            borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(26,36,32,0.08)',
            marginTop: 2,
          }}
        >
          {/* Ink color palette dots — 14×14 matching mock */}
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
                    width: compact ? 12 : 14,
                    height: compact ? 12 : 14,
                    borderRadius: 999,
                    backgroundColor: ink.color,
                    // Selected ring: 2px paper-bg gap, then 1.5px accent ring — matching mock CSS
                    borderWidth: isSelected ? 3.5 : 0,
                    borderColor: isSelected ? ink.color : 'transparent',
                    shadowColor: isSelected ? ink.color : '#000',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: isSelected ? 1 : 0,
                    shadowRadius: 0,
                    // Web: use outline for exact ring effect
                    ...(Platform.OS === 'web' && isSelected
                      ? ({
                          outline: `2px solid ${dotRingColor}`,
                          outlineOffset: '1px',
                          boxShadow: `0 0 0 3.5px ${ink.color}`,
                        } as any)
                      : {}),
                  }}
                />
              );
            })}
          </View>

          {/* "Undo · Clean" text matching freeform mock, plain "Undo" for inline */}
          <TouchableOpacity
            onPress={handleUndo}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            accessibilityRole="button"
            accessibilityLabel="Undo"
          >
            <AppText
              style={{ fontSize: compact ? 10 : 11.5, color: colors.text.secondary }}
            >
              {isFreeform ? 'Undo · Clean' : 'Undo'}
            </AppText>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

/** Slightly darken a hex color for the "Sketch" label in inline mode */
function darken(hex: string): string {
  const clean = hex.replace('#', '');
  const r = Math.max(0, parseInt(clean.substring(0, 2), 16) - 20);
  const g = Math.max(0, parseInt(clean.substring(2, 4), 16) - 15);
  const b = Math.max(0, parseInt(clean.substring(4, 6), 16) - 10);
  return `rgb(${r},${g},${b})`;
}
