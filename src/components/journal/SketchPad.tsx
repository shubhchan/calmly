import React, { useMemo, useRef, useState } from 'react';
import { PanResponder, View, Platform, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme/ThemeContext';
import { sketchPath, type SketchStroke } from '../../features/journal/sketch';
import { sketchInks } from '../../features/journal/papers';
import { AppText } from '../ui/AppText';

export interface SketchPadProps {
  strokes: SketchStroke[];
  onChange: (next: SketchStroke[]) => void;
  accentColor?: string;
  width?: number | string;
  height?: number;
  /** Tools appear only while the pad is selected. */
  active?: boolean;
  /** A tap without a drag — used to show or hide the tools. */
  onToggleControls?: () => void;
  /** A locked pad ignores touches, so a finished sketch cannot be disturbed. */
  locked?: boolean;
  onToggleLock?: (locked: boolean) => void;
  onResize?: () => void;
  onClose?: () => void;
  accessibilityLabel?: string;
}

/** Render the undo SVG icon (circular arrow). */
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

/** Render the erase SVG icon (eraser). */
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

/**
 * A sketch block on the journal page. The pad is bare paper you draw straight on;
 * its tools float in only while the pad is selected, and disappear on their own.
 */
export function SketchPad({
  strokes,
  onChange,
  accentColor,
  width = '100%',
  height = 168,
  active = false,
  onToggleControls,
  locked = false,
  onToggleLock,
  onResize,
  onClose,
  accessibilityLabel = 'Drawing pad',
}: SketchPadProps) {
  const { colors, isDark } = useAppTheme();
  const availableInks = useMemo(() => sketchInks(isDark, accentColor), [isDark, accentColor]);
  const [currentColor, setCurrentColor] = useState(availableInks[0].color);

  const [draft, setDraft] = useState<SketchStroke | null>(null);
  const draftRef = useRef<SketchStroke | null>(null);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  const strokesRef = useRef(strokes);
  strokesRef.current = strokes;

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !locked,
        onMoveShouldSetPanResponder: () => !locked,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (event) => {
          const point = {
            x: event.nativeEvent.locationX,
            y: event.nativeEvent.locationY,
          };
          draftRef.current = { color: currentColor, points: [point] };
          startPointRef.current = point;
          setDraft(draftRef.current);
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
          const start = startPointRef.current;
          draftRef.current = null;
          startPointRef.current = null;
          setDraft(null);

          if (!current || current.points.length === 0) return;

          const last = current.points[current.points.length - 1];
          const isTap =
            current.points.length <= 3 &&
            !!start &&
            Math.hypot(last.x - start.x, last.y - start.y) < 6;

          // A tap means "work on this sketch", not "draw a dot".
          if (isTap && onToggleControls) {
            onToggleControls();
            return;
          }
          onChange([...strokesRef.current, current]);
        },
        onPanResponderTerminate: () => {
          draftRef.current = null;
          startPointRef.current = null;
          setDraft(null);
        },
      }),
    [currentColor, onChange, onToggleControls, locked],
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
  const isEmpty = visible.length === 0;

  return (
    <View
      style={{
        width: width as any,
        height,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: isDark ? colors.surface.default : '#FFFFFF',
        borderWidth: isEmpty && !active ? 1 : 0,
        borderStyle: 'dashed',
        borderColor: isDark ? 'rgba(255,255,255,0.16)' : 'rgba(176,138,79,0.32)',
      }}
    >
      <View
        {...responder.panHandlers}
        accessibilityRole="image"
        accessibilityLabel={accessibilityLabel}
        style={{
          flex: 1,
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

      {isEmpty && !active && !locked ? (
        <View pointerEvents="none" style={styles.emptyHint}>
          <Ionicons name="pencil-outline" size={13} color={colors.text.tertiary} />
          <AppText style={{ fontSize: 11.5, color: colors.text.tertiary }}>Tap to sketch</AppText>
        </View>
      ) : null}

      {locked ? (
        <View style={styles.toolRow}>
          <TouchableOpacity
            onPress={() => onToggleLock?.(false)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Unlock sketch"
            style={styles.toolBtn}
          >
            <Ionicons name="lock-closed-outline" size={12} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      ) : active ? (
        <>
          <View style={styles.toolRow}>
            {onToggleLock ? (
              <TouchableOpacity
                onPress={() => onToggleLock?.(true)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Lock sketch"
                style={styles.toolBtn}
              >
                <Ionicons name="lock-open-outline" size={12} color="#FFFFFF" />
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              onPress={handleUndo}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Undo"
              style={styles.toolBtn}
            >
              <UndoIcon color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleClear}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Clear drawing"
              style={styles.toolBtn}
            >
              <EraseIcon color="#FFFFFF" />
            </TouchableOpacity>
            {onResize ? (
              <TouchableOpacity
                onPress={onResize}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Resize block or adjust spacing"
                style={styles.toolBtn}
              >
                <Ionicons name="options-outline" size={12} color="#FFFFFF" />
              </TouchableOpacity>
            ) : null}
            {onClose ? (
              <TouchableOpacity
                onPress={onClose}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Remove sketch"
                style={styles.toolBtn}
              >
                <Ionicons name="close" size={12} color="#FFFFFF" />
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.inkRow}>
            {availableInks.map((ink) => {
              const isSelected = ink.color.toLowerCase() === currentColor.toLowerCase();
              return (
                <TouchableOpacity
                  key={ink.id}
                  onPress={() => setCurrentColor(ink.color)}
                  hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                  accessibilityRole="button"
                  accessibilityLabel={`Color ${ink.id}`}
                  style={{
                    width: 13,
                    height: 13,
                    borderRadius: 999,
                    backgroundColor: ink.color,
                    borderWidth: isSelected ? 2 : 0,
                    borderColor: '#FFFFFF',
                  }}
                />
              );
            })}
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  emptyHint: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  toolRow: {
    position: 'absolute',
    top: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  toolBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(26, 36, 32, 0.65)',
  },
  inkRow: {
    position: 'absolute',
    left: 6,
    bottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(26, 36, 32, 0.55)',
  },
});
