import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import Svg, { Circle, Path, Defs, RadialGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { TactilePressable } from '../../../components/interactive/TactilePressable';
import { hapticFeedback } from '../../../utils/haptics';
import { useAppTheme } from '../../../theme/ThemeContext';
import { fontFamilies } from '../../../theme/typography';

const AFFIRMATIONS = [
  'Inhale peace, exhale tension',
  'You are doing wonderfully',
  'Soft shoulders, unclenched jaw',
  'One breath at a time',
  'You are safe and sound',
  'Let go of what you cannot control',
  'Peace begins from within',
  'Give yourself grace today',
  'Your mind is clearing',
  'A moment just for you',
];

const BUBBLE_PALETTES = [
  { fill: '#C2E7D9', border: '#7AC5A9', highlight: '#E5FAF1' }, // Mint
  { fill: '#D0D8F9', border: '#9AA7E8', highlight: '#EEF2FF' }, // Lavender
  { fill: '#FDE2C8', border: '#F8B682', highlight: '#FFF3E8' }, // Peach
  { fill: '#C8E8F8', border: '#7DC2E8', highlight: '#E7F6FE' }, // Sky
  { fill: '#F8C8DC', border: '#E886AE', highlight: '#FCE7F0' }, // Rose
  { fill: '#FFF1B8', border: '#E8CD68', highlight: '#FFF9DC', special: true }, // Golden
];

interface BubbleData {
  id: string;
  paletteIdx: number;
  isSpecial: boolean;
  size: number;
}

const GRID_COLS = 4;
const GRID_ROWS = 5;
const TOTAL_BUBBLES = GRID_COLS * GRID_ROWS;

function generateBubbles(): BubbleData[] {
  return Array.from({ length: TOTAL_BUBBLES }, (_, i) => {
    const isSpecial = i % 5 === 2;
    return {
      id: `bubble-${Date.now()}-${i}`,
      paletteIdx: isSpecial ? 5 : i % 5,
      isSpecial,
      size: 48 + (i % 3) * 4,
    };
  });
}

function SingleBubble({
  data,
  popped,
  onPop,
}: {
  data: BubbleData;
  popped: boolean;
  onPop: (isSpecial: boolean) => void;
}) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const palette = BUBBLE_PALETTES[data.paletteIdx] || BUBBLE_PALETTES[0];

  useEffect(() => {
    if (!popped) {
      scale.value = withSpring(1, { damping: 12, stiffness: 200 });
      opacity.value = withTiming(1, { duration: 200 });
    }
  }, [popped]);

  const handlePress = () => {
    if (popped) return;
    hapticFeedback.medium();
    scale.value = withSequence(
      withTiming(1.22, { duration: 70 }),
      withTiming(0, { duration: 120 }, () => {
        runOnJS(onPop)(data.isSpecial);
      })
    );
    opacity.value = withTiming(0, { duration: 160 });
  };

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (popped) {
    return (
      <View style={[styles.bubbleSlot, { width: data.size + 8, height: data.size + 8 }]}>
        <View style={[styles.emptyRink, { width: data.size * 0.7, height: data.size * 0.7 }]} />
      </View>
    );
  }

  return (
    <Animated.View style={[styles.bubbleSlot, animStyle, { width: data.size + 8, height: data.size + 8 }]}>
      <TactilePressable
        onPress={handlePress}
        scaleDownTo={0.92}
        hapticStyle="none"
        accessibilityRole="button"
        accessibilityLabel="Pop bubble"
        style={[
          styles.bubbleDisc,
          {
            width: data.size,
            height: data.size,
            borderRadius: data.size / 2,
            backgroundColor: palette.fill,
            borderColor: palette.border,
            shadowColor: palette.border,
          },
        ]}
      >
        <Svg width={data.size} height={data.size} viewBox="0 0 60 60" style={StyleSheet.absoluteFill}>
          <Circle cx="30" cy="30" r="28" fill={palette.fill} stroke={palette.border} strokeWidth="2" opacity={0.9} />
          {/* Specular shine */}
          <Path
            d="M 18 14 C 24 10, 36 10, 42 14"
            stroke={palette.highlight}
            strokeWidth="3.2"
            strokeLinecap="round"
            fill="none"
            opacity={0.85}
          />
          <Circle cx="44" cy="22" r="2.5" fill="#FFFFFF" opacity={0.7} />
        </Svg>
        {data.isSpecial && (
          <Ionicons name="sparkles" size={16} color="#B8860B" style={styles.sparkleIcon} />
        )}
      </TactilePressable>
    </Animated.View>
  );
}

export function BubblePopGame() {
  const { colors, isDark } = useAppTheme();
  const [bubbles, setBubbles] = useState<BubbleData[]>(() => generateBubbles());
  const [poppedMap, setPoppedMap] = useState<Record<string, boolean>>({});
  const [popCount, setPopCount] = useState(0);
  const [affirmation, setAffirmation] = useState<string | null>(null);

  const affirmationAnim = useSharedValue(0);

  const showAffirmation = useCallback((text: string) => {
    setAffirmation(text);
    affirmationAnim.value = 0;
    affirmationAnim.value = withSequence(
      withSpring(1, { damping: 14, stiffness: 220 }),
      withTiming(1, { duration: 2400 }),
      withTiming(0, { duration: 300 })
    );
  }, []);

  const handlePop = useCallback(
    (id: string, isSpecial: boolean) => {
      setPoppedMap((prev) => ({ ...prev, [id]: true }));
      setPopCount((prev) => {
        const next = prev + 1;
        if (isSpecial || next % 8 === 0) {
          const quote = AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)];
          showAffirmation(quote);
        }
        return next;
      });
    },
    [showAffirmation]
  );

  const handleRegenerate = () => {
    hapticFeedback.light();
    setPoppedMap({});
    setBubbles(generateBubbles());
    showAffirmation('Fresh calm bubbles drifted in ');
  };

  const affirmationStyle = useAnimatedStyle(() => ({
    opacity: affirmationAnim.value,
    transform: [{ translateY: (1 - affirmationAnim.value) * 12 }],
  }));

  const activeCount = bubbles.length - Object.keys(poppedMap).length;

  return (
    <View style={styles.container}>
      {/* Top Game Controls & Stat Pills */}
      <View style={styles.topBar}>
        <View style={[styles.pill, { backgroundColor: colors.surface.default, borderColor: colors.border.default }]}>
          <Ionicons name="sparkles-outline" size={16} color={colors.primary.default} />
          <Text style={[styles.pillText, { color: colors.text.primary }]}>
            Popped: <Text style={{ fontWeight: '800', color: colors.primary.default }}>{popCount}</Text>
          </Text>
        </View>

        <TactilePressable
          onPress={handleRegenerate}
          scaleDownTo={0.94}
          hapticStyle="light"
          accessibilityRole="button"
          accessibilityLabel="Refill bubbles"
          style={[styles.refillButton, { backgroundColor: colors.primary.default }]}
        >
          <Ionicons name="refresh" size={16} color="#FFFFFF" />
          <Text style={styles.refillText}>Refill Breeze</Text>
        </TactilePressable>
      </View>

      {/* Floating Gentle Affirmation Banner */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.affirmationBanner,
          affirmationStyle,
          {
            backgroundColor: isDark ? 'rgba(46, 61, 82, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            borderColor: colors.border.default,
          },
        ]}
      >
        <Text style={[styles.affirmationText, { color: colors.text.primary }]}>
          {affirmation || 'Pop to release thoughts'}
        </Text>
      </Animated.View>

      {/* Tactile Bubble Grid */}
      <View style={styles.grid}>
        {bubbles.map((b) => (
          <SingleBubble
            key={b.id}
            data={b}
            popped={!!poppedMap[b.id]}
            onPop={(isSpecial) => handlePop(b.id, isSpecial)}
          />
        ))}
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
          <Ionicons name="sparkles" size={18} color={colors.primary.default} />
        </View>
        <View style={styles.bottomTextGroup}>
          <Text style={[styles.bottomInfoTitle, { color: colors.text.primary }]}>
            Mindful Bubble Pop
          </Text>
          <Text style={[styles.bottomInfoSub, { color: colors.text.secondary }]}>
            Tap jelly bubbles to release tension · Golden bubbles hold soothing mindful mantras
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
    marginBottom: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  refillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  refillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  affirmationBanner: {
    height: 38,
    paddingHorizontal: 18,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  affirmationText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 8,
    marginVertical: 4,
  },
  bubbleSlot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleDisc: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 4,
  },
  sparkleIcon: {
    position: 'absolute',
    top: 6,
    right: 8,
  },
  emptyRink: {
    borderRadius: 9999,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(160, 160, 160, 0.15)',
  },
  hintText: {
    fontSize: 12,
    marginTop: 10,
    textAlign: 'center',
  },
});

