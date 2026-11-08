import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Svg, { Circle, Path, Ellipse, G } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { TactilePressable } from '../../../components/interactive/TactilePressable';
import { hapticFeedback } from '../../../utils/haptics';
import { useAppTheme } from '../../../theme/ThemeContext';
import { AppText } from '../../../components/ui/AppText';

interface HeartBubbleData {
  id: string;
  startX: number;
  startY: number;
  wobble: number;
  driftY: number;
  size: number;
}

function HeartBubble({ bubble, onDone }: { bubble: HeartBubbleData; onDone: () => void }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration: 1500, easing: Easing.out(Easing.quad) }, () => {
      runOnJS(onDone)();
    });
  }, []);

  const animStyle = useAnimatedStyle(() => {
    const p = progress.value;
    const translateY = interpolate(p, [0, 1], [0, -130 - bubble.driftY]);
    const translateX = interpolate(
      p,
      [0, 0.45, 0.85, 1],
      [0, bubble.wobble, -bubble.wobble * 0.7, bubble.wobble * 0.3]
    );
    const scale = interpolate(p, [0, 0.18, 0.85, 1], [0.2, 1.12, 1, 1.25]);
    const opacity = interpolate(p, [0, 0.1, 0.75, 1], [0, 1, 0.9, 0]);
    return {
      transform: [{ translateX }, { translateY }, { scale }],
      opacity,
    };
  });

  const bSize = bubble.size;

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.heartBubbleContainer, { left: bubble.startX, top: bubble.startY }, animStyle]}
    >
      <View
        style={[
          styles.bubbleOrb,
          {
            width: bSize,
            height: bSize,
            borderRadius: bSize / 2,
            backgroundColor: 'rgba(255, 230, 242, 0.55)',
            borderColor: 'rgba(255, 150, 190, 0.85)',
          },
        ]}
      >
        <Svg width={bSize} height={bSize} viewBox="0 0 36 36" style={StyleSheet.absoluteFill}>
          <Path
            d="M 10 9 C 14 6, 22 6, 26 9"
            stroke="#FFFFFF"
            strokeWidth="2.4"
            strokeLinecap="round"
            fill="none"
            opacity={0.88}
          />
          <Circle cx="27" cy="14" r="1.5" fill="#FFFFFF" opacity={0.75} />
        </Svg>
        <Ionicons name="heart" size={bSize * 0.48} color="#FF4D79" />
      </View>
    </Animated.View>
  );
}

export type CompanionId = 'lettuce' | 'panda' | 'cloud';

export interface ZenTemplate {
  id: string;
  name: string;
  cadence: string;
  title: string;
  description: string;
  phases: { name: 'Inhale' | 'Hold' | 'Exhale'; duration: number }[];
}

export const ZEN_TEMPLATES: ZenTemplate[] = [
  {
    id: 'pine',
    name: 'Pine Mist',
    cadence: '4 · 6',
    title: 'Pine Mist (Vagus Reset)',
    description: '4s inhale to expand, 6s exhale to soothe your heartbeat',
    phases: [
      { name: 'Inhale', duration: 4 },
      { name: 'Exhale', duration: 6 },
    ],
  },
  {
    id: 'stone',
    name: 'Stone Garden',
    cadence: '4 · 4 · 4 · 4',
    title: 'Stone Garden (Box Stillness)',
    description: '4s equal cadence: inhale, hold, exhale, hold for centered balance',
    phases: [
      { name: 'Inhale', duration: 4 },
      { name: 'Hold', duration: 4 },
      { name: 'Exhale', duration: 4 },
      { name: 'Hold', duration: 4 },
    ],
  },
  {
    id: 'lake',
    name: 'Night Lake',
    cadence: '4 · 7 · 8',
    title: 'Night Lake (Deep Rest)',
    description: '4s inhale, 7s serene hold, 8s long release for deep relaxation',
    phases: [
      { name: 'Inhale', duration: 4 },
      { name: 'Hold', duration: 7 },
      { name: 'Exhale', duration: 8 },
    ],
  },
  {
    id: 'dew',
    name: 'Morning Dew',
    cadence: '4 · 2 · 4',
    title: 'Morning Dew (Gentle Clarity)',
    description: '4s inhale, brief 2s pause, 4s exhale to awaken the mind',
    phases: [
      { name: 'Inhale', duration: 4 },
      { name: 'Hold', duration: 2 },
      { name: 'Exhale', duration: 4 },
    ],
  },
];

const COMPANIONS = [
  { id: 'lettuce' as CompanionId, name: 'Lettuce the Cat', emoji: '🐱' },
  { id: 'panda' as CompanionId, name: 'Bao the Panda', emoji: '🐼' },
  { id: 'cloud' as CompanionId, name: 'Mochi the Cloud', emoji: '☁️' },
];

export function BreathingCompanionGame({ onExit }: { onExit?: () => void }) {
  const { colors, isDark } = useAppTheme();
  const [templateId, setTemplateId] = useState('pine');
  const [companion, setCompanion] = useState<CompanionId>('lettuce');
  const [bubbles, setBubbles] = useState<HeartBubbleData[]>([]);

  const activeTemplate = ZEN_TEMPLATES.find((t) => t.id === templateId) || ZEN_TEMPLATES[0];

  const [phaseIndex, setPhaseIndex] = useState(0);
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState(activeTemplate.phases[0].duration);
  const [cycleCount, setCycleCount] = useState(1);

  const breathScale = useSharedValue(1);
  const petBounce = useSharedValue(1);

  const currentPhase = activeTemplate.phases[phaseIndex] || activeTemplate.phases[0];

  // Breath pacing driver
  useEffect(() => {
    setPhaseIndex(0);
    setPhaseSecondsLeft(activeTemplate.phases[0].duration);
    setCycleCount(1);
  }, [templateId]);

  useEffect(() => {
    // Animate scale based on current phase
    const durMs = currentPhase.duration * 1000;
    if (currentPhase.name === 'Inhale') {
      breathScale.value = withTiming(1.18, {
        duration: durMs,
        easing: Easing.inOut(Easing.quad),
      });
    } else if (currentPhase.name === 'Exhale') {
      breathScale.value = withTiming(1.0, {
        duration: durMs,
        easing: Easing.inOut(Easing.quad),
      });
    } else {
      // Hold phase: soft subtle float
      breathScale.value = withTiming(breathScale.value, { duration: durMs });
    }

    setPhaseSecondsLeft(currentPhase.duration);

    // Second tick interval
    const interval = setInterval(() => {
      setPhaseSecondsLeft((prev) => {
        if (prev <= 1) {
          // Transition to next phase
          setPhaseIndex((currIdx) => {
            const nextIdx = (currIdx + 1) % activeTemplate.phases.length;
            if (nextIdx === 0) {
              setCycleCount((c) => (c < 8 ? c + 1 : 1));
            }
            hapticFeedback.light();
            return nextIdx;
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phaseIndex, templateId]);

  // Petting interaction
  const handlePet = useCallback(
    (evt: any) => {
      hapticFeedback.medium();
      petBounce.value = withSequence(
        withSpring(1.12, { damping: 10, stiffness: 350 }),
        withSpring(1, { damping: 12, stiffness: 200 })
      );

      const touchX = evt.nativeEvent.locationX || 70;
      const touchY = evt.nativeEvent.locationY || 60;

      const newBubbles = Array.from({ length: 3 }, (_, i) => ({
        id: `heart-${Date.now()}-${i}`,
        startX: touchX - 16 + (Math.random() - 0.5) * 36,
        startY: touchY - 20,
        wobble: (Math.random() - 0.5) * 36,
        driftY: Math.random() * 40,
        size: 30 + Math.random() * 8,
      }));

      setBubbles((prev) => [...prev, ...newBubbles]);
    },
    []
  );

  const handleBubbleDone = useCallback((id: string) => {
    setBubbles((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const companionAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathScale.value * petBounce.value }],
  }));

  const haloOuterStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(breathScale.value, [1, 1.18], [0.96, 1.06]),
      },
    ],
    opacity: interpolate(breathScale.value, [1, 1.18], [0.65, 0.95]),
  }));

  const companionObj = COMPANIONS.find((c) => c.id === companion) || COMPANIONS[0];

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      {/* Zen Templates — Minimal quiet row without bulky pills or extra text */}
      <View style={styles.templateRow}>
        {ZEN_TEMPLATES.map((t) => {
          const isSelected = t.id === templateId;
          return (
            <TactilePressable
              key={t.id}
              onPress={() => {
                hapticFeedback.selection();
                setTemplateId(t.id);
              }}
              scaleDownTo={0.96}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              style={[
                styles.templateTab,
                {
                  backgroundColor: isSelected ? colors.primary.default : colors.surface.default,
                  borderColor: isSelected ? colors.primary.default : colors.border.default,
                },
              ]}
            >
              <AppText
                variant="caption"
                color={isSelected ? colors.primary.foreground : colors.text.secondary}
                style={{ fontWeight: isSelected ? '700' : '500' }}
              >
                { t.name }
              </AppText>
      </TactilePressable>
      );
        })}
    </View>

      {/* Animal Companion Selector — Clean minimal circular avatars, no text clutter */ }
  <View style={styles.animalRow}>
    {COMPANIONS.map((c) => {
      const isSelected = c.id === companion;
      return (
        <TactilePressable
          key={c.id}
          onPress={() => {
            hapticFeedback.selection();
            setCompanion(c.id);
          }}
          scaleDownTo={0.94}
          accessibilityRole="button"
          accessibilityLabel={c.name}
          style={[
            styles.animalCircle,
            {
              backgroundColor: isSelected ? colors.primary.subtle : colors.surface.default,
              borderColor: isSelected ? colors.primary.default : colors.border.default,
              borderWidth: isSelected ? 2 : 1,
            },
          ]}
        >
          <Text style={{ fontSize: 20 }}>{c.emoji}</Text>
        </TactilePressable>
      );
    })}
  </View>

  {/* Breathing Sanctuary Stage with Breathing Animal Companion */ }
  <View style={styles.stageWrap}>
    {/* Animated Concentric Breathing Halo */}
    <Animated.View style={[StyleSheet.absoluteFill, haloOuterStyle, styles.haloCenter]}>
      <Svg width={280} height={270} viewBox="0 0 280 270">
        {/* Outer mist aura */}
        <Circle
          cx="140"
          cy="135"
          r="126"
          fill={colors.primary.subtle}
          stroke={colors.primary.subtleBorder}
          strokeWidth="1"
          strokeDasharray="3,4"
          opacity={isDark ? 0.35 : 0.8}
        />
        {/* Intermediate expansion halo */}
        <Circle
          cx="140"
          cy="135"
          r="98"
          fill={colors.primary.subtle}
          stroke={colors.primary.subtleBorder}
          strokeWidth="1.5"
          opacity={isDark ? 0.5 : 0.9}
        />
        {/* Inner calming circle */}
        <Circle
          cx="140"
          cy="135"
          r="74"
          fill={colors.surface.default}
          stroke={colors.primary.default}
          strokeWidth="1.8"
        />
        {/* Gold dry reed ring */}
        <Circle
          cx="140"
          cy="135"
          r="76"
          fill="none"
          stroke={isDark ? '#D2B078' : '#B08A4F'}
          strokeWidth="1.4"
          strokeDasharray="2,4"
          opacity={0.8}
        />
      </Svg>
    </Animated.View>

    {/* Center Companion & Breathing Indicator */}
    <TactilePressable
      onPress={handlePet}
      scaleDownTo={0.97}
      hapticStyle="selection"
      accessibilityRole="button"
      accessibilityLabel={`Pet ${companionObj.name}`}
      style={styles.petTarget}
    >
      <Animated.View style={[styles.companionCenter, companionAnimStyle]}>
        {companion === 'lettuce' ? (
          /* Lettuce the Sleepy Tabby Cat (exact avatar from git/origin master) */
          <Svg width={180} height={150} viewBox="0 0 180 150">
            {/* Left Ear */}
            <Path d="M 46 62 L 54 28 L 78 52 Z" fill={isDark ? '#E5C9A6' : '#FFE5C4'} stroke="#C99868" strokeWidth={2.5} strokeLinejoin="round" />
            <Path d="M 52 56 L 56 36 L 72 50 Z" fill="#FFAAA6" opacity={0.85} />

            {/* Right Ear */}
            <Path d="M 134 62 L 126 28 L 102 52 Z" fill={isDark ? '#E5C9A6' : '#FFE5C4'} stroke="#C99868" strokeWidth={2.5} strokeLinejoin="round" />
            <Path d="M 128 56 L 124 36 L 108 50 Z" fill="#FFAAA6" opacity="0.85" />

            {/* Main Head / Face */}
            <Circle cx="90" cy="84" r="50" fill={isDark ? '#E5C9A6' : '#FFF3E0'} stroke="#C99868" strokeWidth={3} />

            {/* Cute Forehead Tabby Stripes */}
            <Path d="M 90 42 L 90 52" stroke="#C99868" strokeWidth={3} strokeLinecap="round" />
            <Path d="M 82 46 L 82 55" stroke="#C99868" strokeWidth={2.5} strokeLinecap="round" />
            <Path d="M 98 46 L 98 55" stroke="#C99868" strokeWidth={2.5} strokeLinecap="round" />

            {/* Soft Rosy Cheeks */}
            <Ellipse cx="58" cy="94" rx="8" ry="5" fill="#FFB7C5" opacity={0.85} />
            <Ellipse cx="122" cy="94" rx="8" ry="5" fill="#FFB7C5" opacity="0.85" />

            {/* Sweet Sleeping Eyes */}
            <Path d="M 64 81 Q 72 88 80 81" stroke="#4A3B32" strokeWidth={2.8} strokeLinecap="round" fill="none" />
            <Path d="M 100 81 Q 108 88 116 81" stroke="#4A3B32" strokeWidth={2.8} strokeLinecap="round" fill="none" />

            {/* Pink Button Nose */}
            <Path d="M 87 88 L 93 88 L 90 92 Z" fill="#FF8E9E" />

            {/* Cat Mouth (w shape) */}
            <Path d="M 85 95 Q 90 99 90 92 Q 90 99 95 95" stroke="#4A3B32" strokeWidth={2.2} strokeLinecap="round" fill="none" />

            {/* Whiskers */}
            <Path d="M 44 86 L 24 84" stroke="#8D7A6E" strokeWidth={1.8} strokeLinecap="round" />
            <Path d="M 44 92 L 26 95" stroke="#8D7A6E" strokeWidth={1.8} strokeLinecap="round" />
            <Path d="M 136 86 L 156 84" stroke="#8D7A6E" strokeWidth={1.8} strokeLinecap="round" />
            <Path d="M 136 92 L 154 95" stroke="#8D7A6E" strokeWidth={1.8} strokeLinecap="round" />

            {/* Curled Sleepy Paws */}
            <Ellipse cx="72" cy="120" rx="14" ry="10" fill={isDark ? '#F5DFC5' : '#FFFFFF'} stroke="#C99868" strokeWidth={2} />
            <Ellipse cx="108" cy="120" rx="14" ry="10" fill={isDark ? '#F5DFC5' : '#FFFFFF'} stroke="#C99868" strokeWidth={2} />
          </Svg>
        ) : companion === 'cloud' ? (
          /* Mochi the Cozy Cloud (exact avatar from git/origin master) */
          <Svg width={180} height={150} viewBox="0 0 180 150">
            {/* Cloud Body */}
            <G fill={isDark ? '#E2EDFA' : '#FFFFFF'} stroke={isDark ? '#9ABFE0' : '#D5E6F5'} strokeWidth="3">
              <Circle cx="90" cy="80" r="48" />
              <Circle cx="50" cy="92" r="34" />
              <Circle cx="130" cy="92" r="34" />
              <Circle cx="70" cy="60" r="36" />
              <Circle cx="110" cy="60" r="36" />
            </G>
            {/* Cheeks */}
            <Ellipse cx="62" cy="88" rx="7" ry="5" fill="#FFB7C5" opacity="0.8" />
            <Ellipse cx="118" cy="88" rx="7" ry="5" fill="#FFB7C5" opacity="0.8" />
            {/* Sleeping Closed Eyes */}
            <Path d="M 68 80 Q 74 86 80 80" stroke="#3D4A5A" strokeWidth="2.8" strokeLinecap="round" fill="none" />
            <Path d="M 100 80 Q 106 86 112 80" stroke="#3D4A5A" strokeWidth="2.8" strokeLinecap="round" fill="none" />
            {/* Tiny Smile */}
            <Path d="M 86 90 Q 90 94 94 90" stroke="#3D4A5A" strokeWidth="2.4" strokeLinecap="round" fill="none" />
          </Svg>
        ) : (
          /* Bao the Zen Panda (exact avatar from git/origin master) */
          <Svg width={180} height={150} viewBox="0 0 180 150">
            {/* Ears */}
            <Circle cx="46" cy="46" r="18" fill={isDark ? '#3D4653' : '#2B313A'} stroke={isDark ? '#6B7A8D' : '#1A1E24'} strokeWidth="1.5" />
            <Circle cx="134" cy="46" r="18" fill={isDark ? '#3D4653' : '#2B313A'} stroke={isDark ? '#6B7A8D' : '#1A1E24'} strokeWidth="1.5" />
            {/* Head */}
            <Circle cx="90" cy="82" r="50" fill={isDark ? '#F5F7FA' : '#FFFFFF'} stroke={isDark ? '#8094A8' : '#D0D9E2'} strokeWidth="3" />
            {/* Eye Patches */}
            <Ellipse cx="68" cy="78" rx="14" ry="11" fill={isDark ? '#3D4653' : '#2B313A'} stroke={isDark ? '#6B7A8D' : '#1A1E24'} strokeWidth="1" transform="rotate(-15, 68, 78)" />
            <Ellipse cx="112" cy="78" rx="14" ry="11" fill={isDark ? '#3D4653' : '#2B313A'} stroke={isDark ? '#6B7A8D' : '#1A1E24'} strokeWidth="1" transform="rotate(15, 112, 78)" />
            {/* Closed Eyes */}
            <Path d="M 62 77 Q 68 83 74 77" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" fill="none" />
            <Path d="M 106 77 Q 112 83 118 77" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" fill="none" />
            {/* Pink Cheeks */}
            <Ellipse cx="54" cy="94" rx="6" ry="4" fill="#FFB7C5" opacity="0.8" />
            <Ellipse cx="126" cy="94" rx="6" ry="4" fill="#FFB7C5" opacity="0.8" />
            {/* Nose & Smile */}
            <Circle cx="90" cy="88" r="4" fill={isDark ? '#2B313A' : '#2B313A'} />
            <Path d="M 86 94 Q 90 98 94 94" stroke="#2B313A" strokeWidth="2" strokeLinecap="round" fill="none" />
          </Svg>
        )}

        {/* Floating Heart Bubbles from Petting */}
        {bubbles.map((b) => (
          <HeartBubble key={b.id} bubble={b} onDone={() => handleBubbleDone(b.id)} />
        ))}
      </Animated.View>
    </TactilePressable>
  </View>

      {/* Serene Typography: Breathing Phase & Countdown */}
      <View style={styles.phaseWrap}>
        <AppText variant="h2" color={colors.text.primary} style={styles.phaseText}>
          {currentPhase.name}
        </AppText>
          <AppText variant="label" color={colors.primary.default} style={styles.phaseSeconds}>
            {phaseSecondsLeft}s
          </AppText>
      </View>

        {/* Subtle Minimal Cycle Dots */}
        <View style={styles.cycleDots}>
          {Array.from({ length: 8 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.cycleDot,
                {
                  backgroundColor: i < cycleCount ? colors.primary.default : colors.border.default,
                  transform: [{ scale: i < cycleCount ? 1.25 : 1 }],
                },
              ]}
            />
          ))}
        </View>

        {/* Bottom Finish Button */}
        <View style={styles.bottomArea}>
          <TactilePressable
            onPress={onExit}
            scaleDownTo={0.97}
            hapticStyle="medium"
            accessibilityRole="button"
            accessibilityLabel="Finish breathing pause"
            style={[styles.finishBtn, { backgroundColor: colors.primary.default }]}
          >
            <AppText variant="button" color={colors.primary.foreground}>
              Finish
            </AppText>
          </TactilePressable>
        </View>
      </ScrollView>
      );
}

      const styles = StyleSheet.create({
        container: {
      flexGrow: 1,
      paddingTop: 8,
      paddingBottom: 28,
      paddingHorizontal: 20,
      alignItems: 'center',
      justifyContent: 'space-between',
  },
        templateRow: {
        flexDirection: 'row',
      gap: 8,
      justifyContent: 'center',
      width: '100%',
      paddingVertical: 2,
      flexWrap: 'wrap',
  },
      templateTab: {
        paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: 1,
  },
      animalRow: {
        flexDirection: 'row',
      gap: 14,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 6,
  },
      animalCircle: {
        width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
  },
      stageWrap: {
        position: 'relative',
      width: 280,
      height: 270,
      marginVertical: 4,
      alignItems: 'center',
      justifyContent: 'center',
  },
      haloCenter: {
        alignItems: 'center',
      justifyContent: 'center',
  },
      petTarget: {
        alignItems: 'center',
      justifyContent: 'center',
  },
      companionCenter: {
        alignItems: 'center',
      justifyContent: 'center',
  },
      phaseWrap: {
        alignItems: 'center',
      marginTop: 2,
  },
      phaseText: {
        fontSize: 26,
      letterSpacing: -0.5,
      fontWeight: '600',
  },
      phaseSeconds: {
        fontSize: 14,
      fontWeight: '700',
      marginTop: 2,
  },
      cycleDots: {
        flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginVertical: 8,
  },
      cycleDot: {
        width: 6,
      height: 6,
      borderRadius: 3,
  },
      bottomArea: {
      width: '100%',
      marginTop: 8,
  },
      finishBtn: {
        width: '100%',
      height: 48,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
  },
      heartBubbleContainer: {
        position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99,
  },
      bubbleOrb: {
        alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
  },
});
