import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Path, Ellipse, G } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withSpring,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { TactilePressable } from '../../../components/interactive/TactilePressable';
import { hapticFeedback } from '../../../utils/haptics';
import { useAppTheme } from '../../../theme/ThemeContext';

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
    const translateX = interpolate(p, [0, 0.45, 0.85, 1], [0, bubble.wobble, -bubble.wobble * 0.7, bubble.wobble * 0.3]);
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
      style={[
        styles.heartBubbleContainer,
        { left: bubble.startX, top: bubble.startY },
        animStyle,
      ]}
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
          {/* Specular curved highlight */}
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

type CompanionId = 'lettuce' | 'cloud' | 'panda';

export function BreathingCompanionGame() {
  const { colors, isDark } = useAppTheme();
  const [companion, setCompanion] = useState<CompanionId>('lettuce');
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Exhale'>('Inhale');
  const [bubbles, setBubbles] = useState<HeartBubbleData[]>([]);
  const [petCount, setPetCount] = useState(0);

  const breathProgress = useSharedValue(0);
  const petBounce = useSharedValue(1);

  // 4s Inhale / 4s Exhale smooth breathing cycle
  useEffect(() => {
    breathProgress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 4000, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );

    const interval = setInterval(() => {
      setBreathPhase((prev) => (prev === 'Inhale' ? 'Exhale' : 'Inhale'));
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handlePet = () => {
    hapticFeedback.light();
    petBounce.value = withSequence(
      withSpring(1.09, { damping: 10, stiffness: 320 }),
      withSpring(1, { damping: 12, stiffness: 240 })
    );

    setPetCount((prev) => prev + 1);

    const newBubble: HeartBubbleData = {
      id: `hb-${Date.now()}-${Math.random()}`,
      startX: 110 + (-40 + Math.random() * 80),
      startY: 120 + (-30 + Math.random() * 40),
      wobble: -28 + Math.random() * 56,
      driftY: Math.random() * 50,
      size: 32 + Math.floor(Math.random() * 12),
    };

    setBubbles((prev) => [...prev.slice(-10), newBubble]);
  };

  const removeBubble = useCallback((id: string) => {
    setBubbles((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const companionAnimStyle = useAnimatedStyle(() => {
    const scale = interpolate(breathProgress.value, [0, 1], [0.93, 1.1]);
    return {
      transform: [{ scale: scale * petBounce.value }],
    };
  });

  const auraAnimStyle = useAnimatedStyle(() => {
    const auraScale = interpolate(breathProgress.value, [0, 1], [0.88, 1.18]);
    const auraOpacity = interpolate(breathProgress.value, [0, 1], [0.22, 0.60]);
    return {
      transform: [{ scale: auraScale }],
      opacity: auraOpacity,
    };
  });

  const companionName =
    companion === 'lettuce'
      ? 'Lettuce the Cat'
      : companion === 'cloud'
      ? 'Mochi the Cloud'
      : 'Bao the Panda';

  return (
    <View style={styles.container}>
      {/* Top Switcher (Lettuce Cat vs Mochi vs Panda) & Pet Counter */}
      <View style={styles.topBar}>
        <View style={[styles.companionPicker, { backgroundColor: colors.surface.default, borderColor: colors.border.default }]}>
          <TactilePressable
            onPress={() => setCompanion('lettuce')}
            scaleDownTo={0.92}
            hapticStyle="selection"
            style={[
              styles.pickerBtn,
              companion === 'lettuce' && { backgroundColor: colors.primary.subtle, borderColor: colors.primary.default },
            ]}
          >
            <Text
              style={[
                styles.pickerText,
                { color: companion === 'lettuce' ? colors.primary.default : colors.text.secondary },
                companion === 'lettuce' && { fontWeight: '700' },
              ]}
            >
              🐱 Lettuce
            </Text>
          </TactilePressable>

          <TactilePressable
            onPress={() => setCompanion('cloud')}
            scaleDownTo={0.92}
            hapticStyle="selection"
            style={[
              styles.pickerBtn,
              companion === 'cloud' && { backgroundColor: colors.primary.subtle, borderColor: colors.primary.default },
            ]}
          >
            <Text
              style={[
                styles.pickerText,
                { color: companion === 'cloud' ? colors.primary.default : colors.text.secondary },
                companion === 'cloud' && { fontWeight: '700' },
              ]}
            >
              ☁️ Mochi
            </Text>
          </TactilePressable>

          <TactilePressable
            onPress={() => setCompanion('panda')}
            scaleDownTo={0.92}
            hapticStyle="selection"
            style={[
              styles.pickerBtn,
              companion === 'panda' && { backgroundColor: colors.primary.subtle, borderColor: colors.primary.default },
            ]}
          >
            <Text
              style={[
                styles.pickerText,
                { color: companion === 'panda' ? colors.primary.default : colors.text.secondary },
                companion === 'panda' && { fontWeight: '700' },
              ]}
            >
              🐼 Bao
            </Text>
          </TactilePressable>
        </View>

        <View style={[styles.loveBadge, { backgroundColor: colors.surface.default, borderColor: colors.border.default }]}>
          <Ionicons name="heart" size={16} color="#E85D75" />
          <Text style={[styles.loveText, { color: colors.text.primary }]}>
            Loved: <Text style={{ fontWeight: '800', color: '#E85D75' }}>{petCount}</Text>
          </Text>
        </View>
      </View>

      {/* Breathing Instruction Ribbon */}
      <View style={styles.breathCard}>
        <Text style={[styles.phaseTitle, { color: colors.primary.default }]}>
          {breathPhase === 'Inhale' ? 'Breathe in slowly...' : 'Gently release...'}
        </Text>
        <Text style={[styles.phaseSub, { color: colors.text.secondary }]}>
          {breathPhase === 'Inhale'
            ? `Inhale as ${companion === 'lettuce' ? 'Lettuce' : companion === 'cloud' ? 'Mochi' : 'Bao'} rises with calm`
            : 'Feel your shoulders soften and rest'}
        </Text>
      </View>

      {/* Interactive Mascot Area */}
      <View style={styles.mascotStage}>
        {/* Breathing Aura Rings */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.breathingAura,
            auraAnimStyle,
            { backgroundColor: isDark ? 'rgba(90, 149, 90, 0.18)' : 'rgba(194, 231, 217, 0.45)' },
          ]}
        />

        {/* Floating Heart Bubbles */}
        {bubbles.map((b) => (
          <HeartBubble key={b.id} bubble={b} onDone={() => removeBubble(b.id)} />
        ))}

        {/* The Animated Pet Mascot */}
        <TactilePressable
          onPress={handlePet}
          scaleDownTo={0.96}
          hapticStyle="light"
          accessibilityRole="button"
          accessibilityLabel={`Pet ${companionName}`}
        >
          <Animated.View style={[styles.characterContainer, companionAnimStyle]}>
            {companion === 'lettuce' ? (
              /* Lettuce the Sleepy Tabby Cat */
              <Svg width="180" height="150" viewBox="0 0 180 150">
                {/* Left Ear */}
                <Path d="M 46 62 L 54 28 L 78 52 Z" fill={isDark ? '#E5C9A6' : '#FFE5C4'} stroke="#C99868" strokeWidth="2.5" strokeLinejoin="round" />
                <Path d="M 52 56 L 56 36 L 72 50 Z" fill="#FFAAA6" opacity="0.85" />

                {/* Right Ear */}
                <Path d="M 134 62 L 126 28 L 102 52 Z" fill={isDark ? '#E5C9A6' : '#FFE5C4'} stroke="#C99868" strokeWidth="2.5" strokeLinejoin="round" />
                <Path d="M 128 56 L 124 36 L 108 50 Z" fill="#FFAAA6" opacity="0.85" />

                {/* Main Head / Face */}
                <Circle cx="90" cy="84" r="50" fill={isDark ? '#E5C9A6' : '#FFF3E0'} stroke="#C99868" strokeWidth="3" />

                {/* Cute Forehead Tabby Stripes */}
                <Path d="M 90 42 L 90 52" stroke="#C99868" strokeWidth="3" strokeLinecap="round" />
                <Path d="M 82 46 L 82 55" stroke="#C99868" strokeWidth="2.5" strokeLinecap="round" />
                <Path d="M 98 46 L 98 55" stroke="#C99868" strokeWidth="2.5" strokeLinecap="round" />

                {/* Soft Rosy Cheeks */}
                <Ellipse cx="58" cy="94" rx="8" ry="5" fill="#FFB7C5" opacity="0.85" />
                <Ellipse cx="122" cy="94" rx="8" ry="5" fill="#FFB7C5" opacity="0.85" />

                {/* Sweet Sleeping Eyes */}
                <Path d="M 64 81 Q 72 88 80 81" stroke="#4A3B32" strokeWidth="2.8" strokeLinecap="round" fill="none" />
                <Path d="M 100 81 Q 108 88 116 81" stroke="#4A3B32" strokeWidth="2.8" strokeLinecap="round" fill="none" />

                {/* Pink Button Nose */}
                <Path d="M 87 88 L 93 88 L 90 92 Z" fill="#FF8E9E" />

                {/* Cat Mouth (w shape) */}
                <Path d="M 85 95 Q 90 99 90 92 Q 90 99 95 95" stroke="#4A3B32" strokeWidth="2.2" strokeLinecap="round" fill="none" />

                {/* Whiskers */}
                <Path d="M 44 86 L 24 84" stroke="#8D7A6E" strokeWidth="1.8" strokeLinecap="round" />
                <Path d="M 44 92 L 26 95" stroke="#8D7A6E" strokeWidth="1.8" strokeLinecap="round" />
                <Path d="M 136 86 L 156 84" stroke="#8D7A6E" strokeWidth="1.8" strokeLinecap="round" />
                <Path d="M 136 92 L 154 95" stroke="#8D7A6E" strokeWidth="1.8" strokeLinecap="round" />

                {/* Curled Sleepy Paws */}
                <Ellipse cx="72" cy="120" rx="14" ry="10" fill={isDark ? '#F5DFC5' : '#FFFFFF'} stroke="#C99868" strokeWidth="2" />
                <Ellipse cx="108" cy="120" rx="14" ry="10" fill={isDark ? '#F5DFC5' : '#FFFFFF'} stroke="#C99868" strokeWidth="2" />
              </Svg>
            ) : companion === 'cloud' ? (
              /* Mochi the Cozy Cloud */
              <Svg width="180" height="150" viewBox="0 0 180 150">
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
              /* Bao the Zen Panda */
              <Svg width="180" height="150" viewBox="0 0 180 150">
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
          </Animated.View>
        </TactilePressable>
      </View>

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
          <Ionicons name="heart" size={18} color="#E85D75" />
        </View>
        <View style={styles.bottomTextGroup}>
          <Text style={[styles.bottomInfoTitle, { color: colors.text.primary }]}>
            Cozy Breathing Companion
          </Text>
          <Text style={[styles.bottomInfoSub, { color: colors.text.secondary }]}>
            Tap or stroke {companionName} to release floating heart bubbles · Sync your breaths with their gentle pulse
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
    paddingVertical: 10,
  },
  bottomInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
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
  topBar: {
    flexDirection: 'row',
    width: '100%',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  companionPicker: {
    flexDirection: 'row',
    borderRadius: 20,
    borderWidth: 1,
    padding: 3,
  },
  pickerBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  pickerText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  loveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
  },
  loveText: {
    fontSize: 12,
    fontWeight: '600',
  },
  breathCard: {
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  phaseTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  phaseSub: {
    fontSize: 14,
    textAlign: 'center',
  },
  mascotStage: {
    width: 250,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  breathingAura: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
  },
  characterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartBubbleContainer: {
    position: 'absolute',
    zIndex: 10,
  },
  bubbleOrb: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    shadowColor: '#FF6B8B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  hintText: {
    fontSize: 12,
    marginTop: 14,
    textAlign: 'center',
  },
});
