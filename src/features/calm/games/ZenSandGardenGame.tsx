import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, LayoutChangeEvent } from 'react-native';
import Svg, { Path, Circle, G } from 'react-native-svg';
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

function generateRakeD(points: { x: number; y: number }[], offset: number = 0): string {
  if (!points || points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y + offset} L ${points[0].x + 0.1} ${points[0].y + offset}`;

  let d = `M ${(points[0].x).toFixed(1)} ${(points[0].y + offset).toFixed(1)}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${(points[i].x).toFixed(1)} ${(points[i].y + offset).toFixed(1)}`;
  }
  return d;
}

export function ZenSandGardenGame() {
  const { colors, isDark } = useAppTheme();
  const [tool, setTool] = useState<ToolMode>('rake');
  const toolRef = useRef<ToolMode>('rake');
  useEffect(() => {
    toolRef.current = tool;
  }, [tool]);

  const [strokes, setStrokes] = useState<SandStroke[]>([]);
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([]);
  const currentPointsRef = useRef<{ x: number; y: number }[]>([]);

  const [items, setItems] = useState<ZenItem[]>([
    { id: 'stone-init-1', type: 'stone', x: 90, y: 110, size: 36, rotation: 12 },
    { id: 'stone-init-2', type: 'stone', x: 230, y: 220, size: 28, rotation: -24 },
  ]);

  const [canvasDim, setCanvasDim] = useState({ width: 330, height: 380 });
  const tideWaveAnim = useSharedValue(-400);

  const sandColor = isDark ? '#231E18' : '#F6EEDF';
  const grooveDark = isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(180, 150, 115, 0.5)';
  const grooveLight = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.65)';

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
      {/* Tool Dock */}
      <View style={[styles.toolDock, { backgroundColor: colors.surface.default, borderColor: colors.border.default }]}>
        <TactilePressable
          onPress={() => setTool('rake')}
          scaleDownTo={0.92}
          hapticStyle="selection"
          style={[
            styles.toolBtn,
            tool === 'rake' && { backgroundColor: colors.primary.subtle, borderColor: colors.primary.default },
          ]}
        >
          <Ionicons
            name="git-commit-outline"
            size={18}
            color={tool === 'rake' ? colors.primary.default : colors.text.secondary}
          />
          <Text style={[styles.toolLabel, { color: tool === 'rake' ? colors.primary.default : colors.text.secondary }]}>
            Rake
          </Text>
        </TactilePressable>

        <TactilePressable
          onPress={() => setTool('stone')}
          scaleDownTo={0.92}
          hapticStyle="selection"
          style={[
            styles.toolBtn,
            tool === 'stone' && { backgroundColor: colors.primary.subtle, borderColor: colors.primary.default },
          ]}
        >
          <Ionicons
            name="disc-outline"
            size={18}
            color={tool === 'stone' ? colors.primary.default : colors.text.secondary}
          />
          <Text style={[styles.toolLabel, { color: tool === 'stone' ? colors.primary.default : colors.text.secondary }]}>
            Stone
          </Text>
        </TactilePressable>

        <TactilePressable
          onPress={() => setTool('petal')}
          scaleDownTo={0.92}
          hapticStyle="selection"
          style={[
            styles.toolBtn,
            tool === 'petal' && { backgroundColor: colors.primary.subtle, borderColor: colors.primary.default },
          ]}
        >
          <Ionicons
            name="flower-outline"
            size={18}
            color={tool === 'petal' ? colors.primary.default : colors.text.secondary}
          />
          <Text style={[styles.toolLabel, { color: tool === 'petal' ? colors.primary.default : colors.text.secondary }]}>
            Petal
          </Text>
        </TactilePressable>

        <TactilePressable
          onPress={handleClearTide}
          scaleDownTo={0.92}
          hapticStyle="medium"
          style={[styles.toolBtn, styles.clearBtn, { borderColor: colors.border.default }]}
        >
          <Ionicons name="water-outline" size={18} color={colors.accents.sky} />
          <Text style={[styles.toolLabel, { color: colors.accents.sky }]}>Tide</Text>
        </TactilePressable>
      </View>

      {/* Interactive Sand Garden Canvas */}
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

            {/* Ripple rings around placed stones */}
            {items.map((item) => (
              <G key={`ripple-${item.id}`}>
                <Circle cx={item.x} cy={item.y} r={item.size * 1.3} stroke={grooveDark} strokeWidth="2" fill="none" opacity={0.35} />
                <Circle cx={item.x} cy={item.y} r={item.size * 2.0} stroke={grooveDark} strokeWidth="1.5" fill="none" opacity={0.2} />
              </G>
            ))}

            {/* Placed Elements (Stones & Petals) */}
            {items.map((item) => {
              if (item.type === 'stone') {
                return (
                  <G key={item.id} transform={`rotate(${item.rotation}, ${item.x}, ${item.y})`}>
                    <Circle cx={item.x + 3} cy={item.y + 4} r={item.size / 2} fill="rgba(0,0,0,0.22)" />
                    <Circle
                      cx={item.x}
                      cy={item.y}
                      r={item.size / 2}
                      fill={isDark ? '#4A4E54' : '#6A6D75'}
                      stroke={isDark ? '#2E3238' : '#4C5056'}
                      strokeWidth="1.5"
                    />
                    <Circle cx={item.x - item.size * 0.14} cy={item.y - item.size * 0.14} r={item.size * 0.16} fill="rgba(255,255,255,0.35)" />
                  </G>
                );
              }
              return (
                <G key={item.id} transform={`rotate(${item.rotation}, ${item.x}, ${item.y})`}>
                  <Circle cx={item.x + 1} cy={item.y + 2} r="9" fill="rgba(0,0,0,0.12)" />
                  <Circle cx={item.x} cy={item.y} r="8" fill="#F8BBD0" stroke="#F06292" strokeWidth="1" />
                  <Circle cx={item.x} cy={item.y} r="3" fill="#FFF59D" />
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

      {/* Bottom Guidance Card */}
      <View
        style={[
          styles.bottomInfoCard,
          {
            backgroundColor: colors.surface.default,
            borderColor: colors.border.default,
          },
        ]}
      >
        <View style={[styles.bottomIconBadge, { backgroundColor: colors.primary.subtle }]}>
          <Ionicons name="color-palette-outline" size={18} color={colors.primary.default} />
        </View>
        <View style={styles.bottomTextGroup}>
          <Text style={[styles.bottomInfoTitle, { color: colors.text.primary }]}>
            Zen Sand Garden
          </Text>
          <Text style={[styles.bottomInfoSub, { color: colors.text.secondary }]}>
            Drag finger to rake ripples · Tap with Stone or Petal to place serene accents
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    width: '100%',
  },
  bottomInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  bottomIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomTextGroup: {
    flex: 1,
  },
  bottomInfoTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  bottomInfoSub: {
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: '500',
  },
  toolDock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 12,
  },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  clearBtn: {
    borderLeftWidth: 1,
  },
  toolLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  canvasFrame: {
    width: '92%',
    height: 310,
    borderRadius: 28,
    borderWidth: 2,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  tideWave: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(168, 216, 232, 0.45)',
    borderRightWidth: 8,
    borderRightColor: '#FFFFFF',
  },
  hintText: {
    fontSize: 12,
    marginTop: 12,
    textAlign: 'center',
  },
});
