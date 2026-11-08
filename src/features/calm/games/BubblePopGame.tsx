import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import Svg, { Circle, Path, Defs, RadialGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { TactilePressable } from '../../../components/interactive/TactilePressable';
import { hapticFeedback } from '../../../utils/haptics';
import { useAppTheme } from '../../../theme/ThemeContext';
import { AppText } from '../../../components/ui/AppText';

const AFFIRMATIONS = [
  'Soft shoulders, unclenched jaw',
  'Inhale peace, exhale tension',
  'One breath, one moment at a time',
  'Nothing to achieve right now',
  'Your mind is settling like still water',
  'Let go of what you cannot hold',
  'Safe, grounded, and at ease',
  'A soft pause just for you',
];

interface BubbleData {
  id: string;
  isSpecial: boolean;
  size: number;
}

const TOTAL_BUBBLES = 20; // 4 cols x 5 rows

function generateBubbles(): BubbleData[] {
  return Array.from({ length: TOTAL_BUBBLES }, (_, i) => {
    // 1 special golden bubble in the upper-middle (index 6, like the mock)
    const isSpecial = i === 6;
    return {
      id: `bubble-${i}`,
      isSpecial,
      size: 58,
    };
  });
}

interface SingleBubbleProps {
  data: BubbleData;
  popped: boolean;
  onPop: (isSpecial: boolean) => void;
  isDark: boolean;
  accentDefault: string;
}

function SingleBubble({ data, popped, onPop, isDark, accentDefault }: SingleBubbleProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (!popped) {
      scale.value = withSpring(1, { damping: 14, stiffness: 220 });
      opacity.value = withTiming(1, { duration: 180 });
    }
  }, [popped]);

  const handlePress = () => {
    if (popped) return;
    if (data.isSpecial) {
      hapticFeedback.success();
    } else {
      hapticFeedback.light();
    }
    scale.value = withSequence(
      withTiming(1.22, { duration: 60 }),
      withTiming(0, { duration: 110 }, () => {
        runOnJS(onPop)(data.isSpecial);
      })
    );
    opacity.value = withTiming(0, { duration: 130 });
  };

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const s = data.size;

  if (popped) {
    // Popped State: Ethereal Still Water ripple rings
    return (
      <View style={[styles.bubbleSlot, { width: s + 4, height: s + 4 }]}>
        <Svg width={s + 4} height={s + 4} viewBox="0 0 68 68">
          <Circle
            cx="34"
            cy="34"
            r="23"
            stroke={isDark ? accentDefault : '#2C4F45'}
            strokeWidth="1.2"
            strokeDasharray="2,3"
            fill="none"
            opacity={0.3}
          />
          <Circle
            cx="34"
            cy="34"
            r="13"
            stroke={isDark ? accentDefault : '#2C4F45'}
            strokeWidth="1"
            fill="none"
            opacity={0.2}
          />
          <Circle cx="34" cy="34" r="3.5" fill={isDark ? accentDefault : '#2C4F45'} opacity={0.4} />
          {data.isSpecial ? (
            <Circle cx="44" cy="24" r="1.8" fill="#B08A4F" opacity={0.65} />
          ) : (
            <Circle cx="44" cy="24" r="1.5" fill="#8EBBA8" opacity={0.5} />
          )}
        </Svg>
      </View>
    );
  }

  // Intact Bubble State
  return (
    <View style={[styles.bubbleSlot, { width: s + 4, height: s + 4 }]}>
      <Animated.View style={animStyle}>
        <TactilePressable
          onPress={handlePress}
          scaleDownTo={0.92}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={data.isSpecial ? 'Golden bubble, tap to pop' : 'Bubble, tap to pop'}
        >
          {data.isSpecial ? (
            // Golden Reed Special Orb
            <Svg width={s} height={s} viewBox="0 0 68 68">
              <Defs>
                <RadialGradient id={`bgold-${data.id}`} cx="35%" cy="32%" r="65%">
                  <Stop offset="0%" stopColor={isDark ? '#FFF7E6' : '#FFFDF7'} stopOpacity="0.98" />
                  <Stop offset="42%" stopColor={isDark ? '#4A371F' : '#F7EEDC'} stopOpacity="0.9" />
                  <Stop offset="100%" stopColor={isDark ? '#261F1A' : '#E2CA9E'} stopOpacity="0.82" />
                </RadialGradient>
              </Defs>
              <Circle
                cx="34"
                cy="34"
                r="30"
                fill={`url(#bgold-${data.id})`}
                stroke={isDark ? '#D2B078' : '#C9A662'}
                strokeWidth="1.8"
              />
              <Path
                d="M 19 19 A 19 19 0 0 1 45 17"
                stroke="#FFFFFF"
                strokeWidth="2.8"
                strokeLinecap="round"
                fill="none"
                opacity={0.98}
              />
              <Circle cx="49" cy="23" r="2.4" fill="#FFFFFF" opacity="0.9" />
              {/* Reed sparkle center */}
              <Path
                d="M34 27v14M27 34h14"
                stroke={isDark ? '#D2B078' : '#B08A4F'}
                strokeWidth="1.8"
                strokeLinecap="round"
                opacity={0.85}
              />
            </Svg>
          ) : (
            // Misty Translucent Pine Bubble
            <Svg width={s} height={s} viewBox="0 0 68 68">
              <Defs>
                <RadialGradient id={`b1-${data.id}`} cx="35%" cy="32%" r="65%">
                  <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={isDark ? 0.45 : 0.95} />
                  <Stop
                    offset="42%"
                    stopColor={isDark ? '#233830' : '#E2EEE8'}
                    stopOpacity={isDark ? 0.75 : 0.85}
                  />
                  <Stop
                    offset="100%"
                    stopColor={isDark ? '#16241F' : '#B8D7C9'}
                    stopOpacity={isDark ? 0.85 : 0.75}
                  />
                </RadialGradient>
              </Defs>
              <Circle
                cx="34"
                cy="34"
                r="29"
                fill={`url(#b1-${data.id})`}
                stroke={isDark ? '#3D6154' : '#8EBBA8'}
                strokeWidth="1.5"
              />
              <Path
                d="M 20 20 A 18 18 0 0 1 44 18"
                stroke="#FFFFFF"
                strokeWidth="2.6"
                strokeLinecap="round"
                fill="none"
                opacity={0.95}
              />
              <Circle cx="48" cy="24" r="2.2" fill="#FFFFFF" opacity="0.85" />
            </Svg>
          )}
        </TactilePressable>
      </Animated.View>
    </View>
  );
}

export function BubblePopGame({ onExit }: { onExit?: () => void }) {
  const { colors, isDark } = useAppTheme();
  const [bubbles, setBubbles] = useState<BubbleData[]>(() => generateBubbles());
  const [poppedMap, setPoppedMap] = useState<Record<string, boolean>>({});
  const [affirmationIdx, setAffirmationIdx] = useState(0);

  const poppedCount = Object.keys(poppedMap).length;
  const isSpecialPopped = poppedMap['bubble-6'];

  const handlePop = useCallback((id: string, isSpecial: boolean) => {
    setPoppedMap((prev) => {
      const next = { ...prev, [id]: true };
      const count = Object.keys(next).length;
      if (isSpecial || count % 5 === 0) {
        setAffirmationIdx((old) => (old + 1) % AFFIRMATIONS.length);
      }
      return next;
    });
  }, []);

  const handleRefill = () => {
    hapticFeedback.medium();
    setPoppedMap({});
    setBubbles(generateBubbles());
    setAffirmationIdx((old) => (old + 1) % AFFIRMATIONS.length);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      {/* Serene Affirmation Banner Chip (from Doop mock FN8_zEG6Hu) */}
      <View style={styles.bannerRow}>
        <View
          style={[
            styles.chip,
            {
              backgroundColor: colors.primary.subtle,
              borderColor: colors.primary.subtleBorder,
            },
          ]}
        >
          <Ionicons name="sparkles" size={13} color={colors.primary.default} />
          <AppText variant="caption" color={colors.primary.default} style={{ fontWeight: '600' }}>
            {AFFIRMATIONS[affirmationIdx]}
          </AppText>
        </View>
      </View>

      {/* Bubble Garden Card (Doop 1:1) */}
      <View
        style={[
          styles.gardenCard,
          {
            backgroundColor: colors.surface.default,
            borderColor: colors.border.default,
          },
        ]}
      >
        {/* Subtle Water Ripple Curves */}
        <Svg
          style={[StyleSheet.absoluteFill, { opacity: isDark ? 0.15 : 0.35 }]}
          viewBox="0 0 350 430"
          preserveAspectRatio="none"
        >
          <Path d="M-20 80 Q 90 60, 200 80 T 370 70" stroke={colors.border.strong} strokeWidth="1.5" fill="none" />
          <Path d="M-20 220 Q 110 240, 220 210 T 370 230" stroke={colors.border.strong} strokeWidth="1.5" fill="none" />
          <Path d="M-20 350 Q 80 330, 190 350 T 370 340" stroke={colors.border.strong} strokeWidth="1.5" fill="none" />
        </Svg>

        {/* Counter & Guidance Header */}
        <View style={[styles.cardHeader, { borderBottomColor: colors.border.subtle }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <AppText variant="label" color={colors.primary.default} style={{ fontWeight: '700' }}>
              {poppedCount} of {TOTAL_BUBBLES} popped
            </AppText>
            <AppText variant="caption" tone="tertiary">
              · gentle breath
            </AppText>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: isSpecialPopped ? colors.border.strong : '#B08A4F',
              }}
            />
            <AppText
              variant="caption"
              color={isSpecialPopped ? colors.text.tertiary : isDark ? '#D2B078' : '#B08A4F'}
              style={{ fontWeight: '600' }}
            >
              {isSpecialPopped ? 'orb released' : '1 golden orb'}
            </AppText>
          </View>
        </View>

        {/* 4x5 Bubble Matrix */}
        <View style={styles.grid}>
          {bubbles.map((b) => (
            <SingleBubble
              key={b.id}
              data={b}
              popped={!!poppedMap[b.id]}
              onPop={(isSpecial) => handlePop(b.id, isSpecial)}
              isDark={isDark}
              accentDefault={colors.primary.default}
            />
          ))}
        </View>

        {/* Tactile hint below grid */}
        <AppText variant="caption" tone="tertiary" center style={{ marginTop: 10 }}>
          Tap to pop · each burst gives physical tactile release
        </AppText>
      </View>

      {/* Bottom Action Bar (Doop 1:1) */}
      <View style={styles.bottomArea}>
        <View style={styles.statusRow}>
          <View style={[styles.goldDot, { backgroundColor: '#B08A4F' }]} />
          <AppText variant="caption" tone="secondary">
            No rush, no penalty · release at your own pace
          </AppText>
        </View>

        <View style={styles.actionsRow}>
          <TactilePressable
            onPress={handleRefill}
            scaleDownTo={0.96}
            hapticStyle="light"
            accessibilityRole="button"
            accessibilityLabel="Refill bubbles"
            style={[
              styles.actionBtn,
              {
                backgroundColor: colors.primary.subtle,
                borderColor: colors.primary.subtleBorder,
                borderWidth: 1,
              },
            ]}
          >
            <Ionicons name="refresh" size={16} color={colors.primary.default} style={{ marginRight: 6 }} />
            <AppText variant="button" color={colors.primary.default}>
              Refill bubbles
            </AppText>
          </TactilePressable>

          <TactilePressable
            onPress={onExit}
            scaleDownTo={0.96}
            hapticStyle="medium"
            accessibilityRole="button"
            accessibilityLabel="Done for now"
            style={[
              styles.actionBtn,
              styles.primaryBtn,
              { backgroundColor: colors.primary.default },
            ]}
          >
            <AppText variant="button" color={colors.primary.foreground}>
              Done for now
            </AppText>
          </TactilePressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 24,
  },
  bannerRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },
  chip: {
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gardenCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#14241E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingTop: 10,
    rowGap: 8,
  },
  bubbleSlot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomArea: {
    marginTop: 18,
    width: '100%',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginBottom: 12,
  },
  goldDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtn: {
    flex: 1.2,
  },
});
