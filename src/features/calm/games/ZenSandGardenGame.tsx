import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, ViewStyle, LayoutChangeEvent } from 'react-native';
import Svg, { Path, Circle, Ellipse, G } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { TactilePressable } from '../../../components/interactive/TactilePressable';
import { hapticFeedback } from '../../../utils/haptics';
import { useAppTheme } from '../../../theme/ThemeContext';

interface SandStroke {
  id: string;
  points: { x: number; y: number }[];
}

interface ZenItem {
  id: string;
  type: 'stone' | 'petal';
  x: number;
  y: number;
  size: number;
  rotation: number;
}

type ToolMode = 'rake' | 'stone' | 'petal';

/** Apply an alpha to a #RRGGBB hex for accent-tinted sand artwork. */
function withAlpha(hex: string, alpha: number): string {
  const raw = hex.replace('#', '');
  const full = raw.length === 3
    ? raw.split('').map((c) => c + c).join('')
    : raw;
  if (full.length !== 6) return hex;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function generateRakeD(points: { x: number; y: number }[], offset: number = 0): string {
  if (!points || points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y + offset} L ${points[0].x + 0.1} ${points[0].y + offset}`;

  let d = `M ${(points[0].x).toFixed(1)} ${(points[0].y + offset).toFixed(1)}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${(points[i].x).toFixed(1)} ${(points[i].y + offset).toFixed(1)}`;
  }
  return d;
}

export function ZenSandGardenGame({ onExit }: { onExit?: () => void }) {
  const { colors, isDark } = useAppTheme();
  const [tool, setTool] = useState<ToolMode>('rake');
  const toolRef = useRef<ToolMode>('rake');
  useEffect(() => {
    toolRef.current = tool;
  }, [tool]);

  const [strokes, setStrokes] = useState<SandStroke[]>([]);
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([]);
  const currentPointsRef = useRef<{ x: number; y: number }[]>([]);

  const [items, setItems] = useState<ZenItem[]>([]);

  const [canvasDim, setCanvasDim] = useState({ width: 330, height: 380 });
  /** The tide washes away the template composition too, so the sweep leaves
   *  bare sand. Returning to the garden re-forms it. */
  const [decorCleared, setDecorCleared] = useState(false);
  const tideWaveAnim = useSharedValue(-400);

  /** Sand-garden tones follow the current accent: the applied accent color
   *  drives groove lines, shadows, stones and petals alike. */
  const tint = colors.primary.default;
  const accentAlpha = useCallback((alpha: number) => withAlpha(tint, alpha), [tint]);
  const sandColor = isDark ? '#201B14' : '#EFEAE0';
  const grooveDark = isDark ? accentAlpha(0.4) : accentAlpha(0.3);
  const grooveLight = isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(255, 255, 255, 0.5)';
  const stoneBody = tint;
  const stoneEdge = 'rgba(0, 0, 0, 0.25)';
  const stoneShadow = isDark ? accentAlpha(0.35) : accentAlpha(0.2);

  /** The template's exact composition (Doop frame spqYVK99ad, 390×620):
   *  five top rake waves, a concentric raked-ring cluster, three stones of
   *  different sizes with cast-shadow ellipses, a pebble and five bottom
   *  waves — rendered in one uniformly scaled group so aspect is preserved,
   *  with every stroke, shadow and stone following the current accent. */
  const overlay = useMemo(() => {
    const { width, height } = canvasDim;
    if (width <= 0 || height <= 0) return null;
    const s = width / 390;
    // Bottom-anchor the scaled template so its lower edge sits on the canvas
    // bottom edge; x-scale derives from width, keeping proportions exact.
    const ty = height - 620 * s;
    const groove = grooveDark;
    const shadow = stoneShadow;
    const body = stoneBody;

    const topWave = (k: number) =>
      `M-20 ${90 + k * 40}c90 -16 180 16 300 4s120 -8 140 -2`;
    const bottomWave = (k: number) =>
      `M-20 ${430 + k * 40}c80 10 150 -14 250 -6s120 14 180 6`;

    return (
      <G transform={`translate(0, ${ty.toFixed(1)}) scale(${s.toFixed(3)})`}>
        {[0, 1, 2, 3, 4].map((k) => (
          <Path key={`tw-${k}`} d={topWave(k)} stroke={groove} strokeWidth="2" fill="none" strokeLinecap="round" />
        ))}
        {[0, 1, 2, 3, 4].map((k) => (
          <Path key={`bw-${k}`} d={bottomWave(k)} stroke={groove} strokeWidth="2" fill="none" strokeLinecap="round" />
        ))}
        {[52, 68, 84].map((r, i) => (
          <Circle key={`ring-${i}`} cx="150" cy="330" r={r} stroke={groove} strokeWidth="2" fill="none" />
        ))}
        {/* Big stone — full ellipse body like the template, not a half-dome */}
        <Ellipse cx="262" cy="318" rx="46" ry="15" fill={shadow} opacity="0.55" />
        <Ellipse cx="253" cy="316" rx="25" ry="26" fill={body} />
        <Ellipse
          cx="250"
          cy="308"
          rx="12"
          ry="14"
          fill={isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.22)'}
          opacity="0.5"
        />
        {/* Pebble */}
        <Ellipse cx="316" cy="352" rx="17" ry="9" fill={accentAlpha(0.35)} />
        {/* Medium stone */}
        <Ellipse cx="122" cy="466" rx="34" ry="12" fill={shadow} opacity="0.5" />
        <Ellipse cx="114" cy="452" rx="17" ry="14" fill={body} opacity="0.85" />
        <Ellipse
          cx="110"
          cy="447"
          rx="8"
          ry="7"
          fill={isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.12)'}
          opacity="0.5"
        />
        {/* Tiny stone in the ring center */}
        <Ellipse cx="150" cy="336" rx="16" ry="7" fill={shadow} opacity="0.8" />
        <Ellipse cx="149" cy="330" rx="10" ry="8" fill={body} opacity="0.55" />
        <Ellipse
          cx="146"
          cy="327"
          rx="4.5"
          ry="4"
          fill={isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.12)'}
          opacity="0.5"
        />
      </G>
    );
  }, [canvasDim, grooveDark, stoneBody, stoneShadow, accentAlpha, isDark]);

  const onTouchStart = useCallback((x: number, y: number) => {
    const currentTool = toolRef.current;
    if (currentTool === 'stone') {
      hapticFeedback.medium();
      setItems((prev) => [
        ...prev,
        {
          id: `stone-${Date.now()}`,
          type: 'stone',
          x,
          y,
          size: 26 + Math.floor(Math.random() * 12),
          rotation: Math.floor(Math.random() * 360),
        },
      ]);
      return;
    }

    if (currentTool === 'petal') {
      hapticFeedback.light();
      setItems((prev) => [
        ...prev,
        {
          id: `petal-${Date.now()}`,
          type: 'petal',
          x,
          y,
          size: 22,
          rotation: Math.floor(Math.random() * 360),
        },
      ]);
      return;
    }

    // Rake tool
    hapticFeedback.light();
    currentPointsRef.current = [{ x, y }];
    setCurrentPoints([{ x, y }]);
  }, []);

  const onTouchMove = useCallback((x: number, y: number) => {
    if (toolRef.current !== 'rake') return;
    const pts = currentPointsRef.current;
    if (pts.length > 0) {
      const last = pts[pts.length - 1];
      const dist = Math.hypot(x - last.x, y - last.y);
      if (dist < 4) return; // throttle tiny movements
    }
    const next = [...pts, { x, y }];
    currentPointsRef.current = next;
    setCurrentPoints(next);
  }, []);

  const onTouchEnd = useCallback(() => {
    if (toolRef.current !== 'rake') return;
    const finishedPts = currentPointsRef.current;
    if (finishedPts.length > 1) {
      setStrokes((prev) => [...prev, { id: `stroke-${Date.now()}`, points: finishedPts }]);
    }
    currentPointsRef.current = [];
    setCurrentPoints([]);
  }, []);

  // Gesture handling via React Native Gesture Handler (Native 60fps)
  const panGesture = Gesture.Pan()
    .minDistance(0)
    .onBegin((e) => {
      'worklet';
      runOnJS(onTouchStart)(e.x, e.y);
    })
    .onUpdate((e) => {
      'worklet';
      runOnJS(onTouchMove)(e.x, e.y);
    })
    .onEnd(() => {
      'worklet';
      runOnJS(onTouchEnd)();
    })
    .onFinalize(() => {
      'worklet';
      runOnJS(onTouchEnd)();
    });

  const handleClearTide = () => {
    hapticFeedback.medium();
    tideWaveAnim.value = -canvasDim.width;
    tideWaveAnim.value = withTiming(canvasDim.width + 120, { duration: 800, easing: Easing.inOut(Easing.quad) });

    setTimeout(() => {
      setStrokes([]);
      setItems([]);
      setCurrentPoints([]);
      currentPointsRef.current = [];
      setDecorCleared(true);
    }, 400);
  };

  const tideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tideWaveAnim.value }],
  }));

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setCanvasDim({ width, height });
    }
  };

  return (
    <View style={styles.container}>
      {/* Full-bleed sand canvas */}
      <GestureDetector gesture={panGesture}>
        <View
          onLayout={onLayout}
          style={[
            styles.canvasFrame,
            {
              backgroundColor: sandColor,
              borderColor: isDark ? '#3D342B' : '#E4D5BE',
            },
          ]}
        >
          <Svg width={canvasDim.width} height={canvasDim.height} style={StyleSheet.absoluteFill}>
            {/* Template composition (accent-tinted): waves, ring cluster, stones */
            /* The tide washes this too — hidden once the garden is cleared */ }
            {decorCleared ? null : overlay}

            {/* Committed Strokes: Triple Rake lines (3 parallel tracks for authentic zen rake look) */}
            {strokes.map((s) => {
              const dMid = generateRakeD(s.points, 0);
              const dTop = generateRakeD(s.points, -8);
              const dBot = generateRakeD(s.points, 8);
              return (
                <G key={s.id}>
                  {/* Outer shadow grooves */}
                  <Path d={dMid} stroke={grooveDark} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  <Path d={dTop} stroke={grooveDark} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.8} />
                  <Path d={dBot} stroke={grooveDark} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.8} />
                  {/* Subtle ridge highlights */}
                  <Path d={dMid} stroke={grooveLight} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  <Path d={dTop} stroke={grooveLight} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  <Path d={dBot} stroke={grooveLight} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </G>
              );
            })}

            {/* Active Drawing Stroke */}
            {currentPoints.length > 1 ? (
              <G>
                <Path d={generateRakeD(currentPoints, 0)} stroke={grooveDark} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <Path d={generateRakeD(currentPoints, -8)} stroke={grooveDark} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.8} />
                <Path d={generateRakeD(currentPoints, 8)} stroke={grooveDark} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.8} />
                <Path d={generateRakeD(currentPoints, 0)} stroke={grooveLight} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </G>
            ) : null}

            {/* Placed Elements — template shapes: ellipse-backed stones,
             *  petals leave only a soft pressed shadow, no ripple rings */}
            {items.map((item) => {
              if (item.type === 'stone') {
                return (
                  <G key={item.id} transform={`rotate(${item.rotation}, ${item.x}, ${item.y})`}>
                    {/* Cast shadow, offset like the template's ellipse shadows */}
                    <Ellipse
                      cx={item.x + item.size * 0.34}
                      cy={item.y + item.size * 0.16}
                      rx={item.size * 0.62}
                      ry={item.size * 0.24}
                      fill={stoneShadow}
                    />
                    {/* Stone body: flat ellipse, as in the template */}
                    <Ellipse
                      cx={item.x}
                      cy={item.y}
                      rx={item.size * 0.5}
                      ry={item.size * 0.34}
                      fill={stoneBody}
                      stroke={stoneEdge}
                      strokeWidth="1.5"
                    />
                    {/* Top-light catch ellipse */}
                    <Ellipse
                      cx={item.x - item.size * 0.06}
                      cy={item.y - item.size * 0.08}
                      rx={item.size * 0.3}
                      ry={item.size * 0.18}
                      fill="rgba(255,255,255,0.16)"
                    />
                  </G>
                );
              }
              // Petal: a pressed mark that reads like the template's soft shadows
              return (
                <G key={item.id} transform={`rotate(${item.rotation}, ${item.x}, ${item.y})`}>
                  <Ellipse
                    cx={item.x + 2}
                    cy={item.y + 1.5}
                    rx={10}
                    ry={4.2}
                    fill={stoneShadow}
                  />
                  <Ellipse
                    cx={item.x}
                    cy={item.y}
                    rx={8.5}
                    ry={3.4}
                    fill={accentAlpha(0.45)}
                  />
                </G>
              );
            })}
          </Svg>

          {/* Ocean Tide Sweep Overly */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.tideWave,
              tideStyle,
              { width: canvasDim.width, height: canvasDim.height },
            ]}
          />
        </View>
      </GestureDetector>

      {/* Floating hint pill — sits above the canvas, out of the gesture area */}
      <View pointerEvents="none" style={styles.hintPillWrap}>
        <View
          style={[
            styles.hintPill,
            { backgroundColor: isDark ? 'rgba(35,30,24,0.86)' : 'rgba(255,255,255,0.86)' },
          ]}
        >
          <Text
            style={[
              styles.hintPillText,
              { color: isDark ? '#C8BFA9' : colors.text.secondary },
            ]}
          >
            Drag anywhere to rake
          </Text>
        </View>
      </View>

      {/* Floating vertical tool dock (right edge) */}
      <View
        style={[
          styles.toolDock,
          { backgroundColor: isDark ? 'rgba(35,30,24,0.86)' : 'rgba(255,255,255,0.86)' },
        ]}
      >
        <TactilePressable
          onPress={() => setTool('rake')}
          scaleDownTo={0.9}
          hapticStyle="selection"
          accessibilityRole="button"
          accessibilityState={{ selected: tool === 'rake' }}
          accessibilityLabel="Rake tool"
          style={[
            styles.dockBtn,
            tool === 'rake' && { backgroundColor: colors.primary.default },
          ]}
        >
          <Ionicons
            name="git-commit-outline"
            size={19}
            color={tool === 'rake' ? colors.primary.foreground : colors.text.secondary}
          />
        </TactilePressable>

        <TactilePressable
          onPress={() => setTool('stone')}
          scaleDownTo={0.9}
          hapticStyle="selection"
          accessibilityRole="button"
          accessibilityState={{ selected: tool === 'stone' }}
          accessibilityLabel="Place a stone"
          style={[
            styles.dockBtn,
            tool === 'stone' && { backgroundColor: colors.primary.default },
          ]}
        >
          <Ionicons
            name="disc-outline"
            size={19}
            color={tool === 'stone' ? colors.primary.foreground : colors.text.secondary}
          />
        </TactilePressable>

        <TactilePressable
          onPress={() => setTool('petal')}
          scaleDownTo={0.9}
          hapticStyle="selection"
          accessibilityRole="button"
          accessibilityState={{ selected: tool === 'petal' }}
          accessibilityLabel="Place a petal"
          style={[
            styles.dockBtn,
            tool === 'petal' && { backgroundColor: colors.primary.default },
          ]}
        >
          <Ionicons
            name="flower-outline"
            size={19}
            color={tool === 'petal' ? colors.primary.foreground : colors.text.secondary}
          />
        </TactilePressable>

        <TactilePressable
          onPress={handleClearTide}
          scaleDownTo={0.9}
          hapticStyle="medium"
          accessibilityRole="button"
          accessibilityLabel="Clear the garden with a tide"
          style={styles.dockBtn}
        >
          <Ionicons name="water-outline" size={19} color={colors.accents.sky} />
        </TactilePressable>
      </View>

      {/* Bottom assurance + exit, from the template */}
      <View style={styles.bottomBar}>
        <View style={styles.finishNoteRow}>
          <View
            style={[styles.finishDot, { backgroundColor: colors.primary.default }]}
          />
          <Text style={[styles.finishNote, { color: colors.text.tertiary }]}>
            Nothing to finish here
          </Text>
        </View>
        {onExit ? (
          <TactilePressable
            onPress={onExit}
            scaleDownTo={0.97}
            accessibilityRole="button"
            accessibilityLabel="Leave the garden as it is"
            style={[styles.leaveBtn, { backgroundColor: colors.primary.default }]}
          >
            <Text style={[styles.leaveBtnText, { color: colors.primary.foreground }]}>
              Leave it as it is
            </Text>
          </TactilePressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    paddingVertical: 6,
  },
  canvasFrame: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
  },
  hintPillWrap: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'none',
  } as ViewStyle,
  hintPill: {
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 15,
  },
  hintPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  toolDock: {
    position: 'absolute',
    right: 16,
    top: 118,
    width: 48,
    paddingTop: 10,
    paddingBottom: 10,
    gap: 12,
    alignItems: 'center',
    borderRadius: 26,
    shadowColor: '#5A503C',
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  dockBtn: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 6,
  },
  finishNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 14,
  },
  finishDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  finishNote: {
    fontSize: 11.5,
    fontWeight: '500',
  },
  leaveBtn: {
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaveBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  tideWave: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(168, 216, 232, 0.45)',
    borderRightWidth: 8,
    borderRightColor: '#FFFFFF',
  },
});
