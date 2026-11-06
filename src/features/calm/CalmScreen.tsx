import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, BreathingPreset } from '../../types/navigation';
import { useAppTheme } from '../../theme/ThemeContext';
import {
  AppText,
  AppIcon,
  Card,
  CardContent,
  Chip,
  Button,
  TactilePressable,
  BreathworkIllustration,
  NatureSoundscapeIllustration,
  SensoryGroundingIllustration,
  BodyScanIllustration,
  PanicAnchorIllustration,
  AffirmationsRadianceIllustration,
  ThoughtReframingIllustration,
  SphereOfControlIllustration,
} from '../../components';
import { soundService } from '../../services/soundService';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { PopIn } from '../../components/interactive/PopIn';
import { resolveTint } from '../../theme/tints';
import { borderWidths, iconSizes, layout, radius, sizes, spacing } from '../../theme/tokens';
import Animated from 'react-native-reanimated';
import { sharedElementStyle, sharedTransitionTags } from '../../theme/sharedTransitions';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface QuickSound {
  id: 'rain' | 'ocean' | 'birds' | 'night';
  label: string;
  icon: string;
  atmosphere: string;
}

const SOUNDS: QuickSound[] = [
  { id: 'rain', label: 'Rainfall', icon: 'i-rainy-outline', atmosphere: 'Soft drizzle' },
  { id: 'ocean', label: 'Ocean Waves', icon: 'i-water-outline', atmosphere: 'Deep tides' },
  { id: 'birds', label: 'Forest Birds', icon: 'i-leaf-outline', atmosphere: 'Morning woods' },
  { id: 'night', label: 'Night Breeze', icon: 'i-moon-outline', atmosphere: 'Quiet stream' },
];

const SOUND_ROWS: [QuickSound, QuickSound][] = [
  [SOUNDS[0], SOUNDS[1]],
  [SOUNDS[2], SOUNDS[3]],
];

/** Static three-bar glyph shown while an ambient sound plays. */
function MiniEqualizer({ color }: { color: string }) {
  return (
    <View style={styles.equalizerRow}>
      <View style={[styles.eqBar, { backgroundColor: color, height: 9 }]} />
      <View style={[styles.eqBar, { backgroundColor: color, height: 13 }]} />
      <View style={[styles.eqBar, { backgroundColor: color, height: 7 }]} />
    </View>
  );
}

function AnimatedSoundTile({
  snd,
  isPlaying,
  colors,
  skyTint,
  onPress,
}: {
  snd: QuickSound;
  isPlaying: boolean;
  colors: any;
  skyTint: any;
  onPress: () => void;
}) {
  return (
    <View style={{ flex: 1 }}>
      <TactilePressable
        onPress={onPress}
        scaleDownTo={1}
        accessibilityRole="button"
        accessibilityLabel={`${snd.label}, ${isPlaying ? 'playing' : snd.atmosphere}`}
        style={[
          styles.soundTile,
          {
            backgroundColor: isPlaying ? colors.primary.subtle : skyTint.plate,
            borderColor: isPlaying ? colors.primary.default : skyTint.border,
          },
        ]}
      >
        <View style={styles.soundTileTop}>
          <View
            style={[
              styles.soundTileOrb,
              {
                backgroundColor: isPlaying ? colors.primary.default : colors.surface.default,
                borderColor: isPlaying ? colors.primary.default : skyTint.border,
              },
            ]}
          >
            <AppIcon
              name={isPlaying ? 'i-pause' : snd.icon}
              size={18}
              color={isPlaying ? colors.primary.foreground : skyTint.accent}
            />
          </View>

          {isPlaying && (
            <View style={styles.playingIndicatorRow}>
              <MiniEqualizer color={colors.primary.default} />
            </View>
          )}
        </View>

        <AppText
          variant="label"
          color={isPlaying ? colors.primary.default : skyTint.text}
          numberOfLines={1}
        >
          {snd.label}
        </AppText>
        <AppText
          variant="caption"
          color={isPlaying ? colors.primary.default : skyTint.muted}
          numberOfLines={1}
          style={styles.soundTileSub}
        >
          {isPlaying ? 'Tap to pause' : snd.atmosphere}
        </AppText>
      </TactilePressable>
    </View>
  );
}

interface QuickBreathwork {
  id: BreathingPreset;
  title: string;
  cadence: string;
  benefit: string;
  duration: number;
}

const BREATH_PRESETS: QuickBreathwork[] = [
  { id: 'box', title: 'Box Breathing', cadence: '4 · 4 · 4 · 4', benefit: 'Focus & steady pulse', duration: 180 },
  { id: '4-7-8', title: '4-7-8 Tranquil', cadence: '4 · 7 · 8', benefit: 'Deep calm & sleep aid', duration: 300 },
  { id: 'deep', title: 'Vagal Resonance', cadence: '5.5 · 5.5', benefit: 'Heart rate balance', duration: 300 },
];

export function CalmScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDark } = useAppTheme();
  const [activeSound, setActiveSound] = useState<string | null>(null);
  const [category, setCategory] = useState('Breathing');

  useEffect(() => {
    const unsub = soundService.addListener((state) => {
      setActiveSound(state.activeTrack);
    });
    return unsub;
  }, []);

  const handleToggleSound = async (soundId: 'rain' | 'ocean' | 'birds' | 'night') => {
    if (activeSound === soundId) {
      await soundService.stop();
    } else {
      await soundService.play(soundId);
    }
  };

  const handleStartBreathSession = (preset: BreathingPreset, duration: number) => {
    navigation.navigate('BreathingSession', { preset, duration });
  };

  const skyTint = resolveTint(!!isDark, 'sky');
  const coralTint = resolveTint(!!isDark, 'coral');
  const creamTint = resolveTint(!!isDark, 'cream');
  const sageTint = resolveTint(!!isDark, 'sage');
  const blushTint = resolveTint(!!isDark, 'blush');
  const mintTint = resolveTint(!!isDark, 'mint');

  // Ink for solid accent fills: white in light mode, deep surface in dark mode.
  const solidInk = isDark ? colors.background.default : '#FFFFFF';
  const PRACTICES = ['Breathing', 'Body Scan', 'Senses', 'Soundscapes'] as const;
  const startPractice = () => {
    if (category === 'Body Scan') navigation.navigate('BodyScan');
    else if (category === 'Senses') navigation.navigate('SensoryGrounding');
    else if (category === 'Soundscapes') navigation.navigate('Soundscapes');
    else navigation.navigate('BreathingSession', { preset: 'box', duration: 180 });
  };

  return (
    <ScreenContainer animate={false} scroll={false} backgroundColor={colors.background.default}>
      {/* Sanctuary Top Bar */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View>
            <AppText variant="h1">Calm</AppText>
            <AppText variant="bodySmall" tone="tertiary" style={styles.mainSubtitle}>
              Tactile mindful tools & somatic rest
            </AppText>
          </View>
          <Animated.View
            sharedTransitionTag={sharedTransitionTags.ambientStatusBadge}
            sharedTransitionStyle={sharedElementStyle}
          >
            <TactilePressable
              onPress={() => navigation.navigate('Soundscapes')}
              scaleDownTo={0.92}
              hitSlop={sizes.hitSlop}
              accessibilityRole="button"
              accessibilityLabel="Open soundscapes"
              style={[
                styles.soundStatusBadge,
                {
                  backgroundColor: activeSound ? colors.primary.subtle : colors.surface.default,
                  borderColor: activeSound ? colors.primary.default : colors.border.default,
                },
              ]}
            >
              <AppIcon
                name={activeSound ? 'i-volume-medium' : 'i-headset-outline'}
                size={18}
                color={activeSound ? colors.primary.default : colors.text.tertiary}
              />
              {activeSound && (
                <View style={styles.pulseDotWrapper}>
                  <View
                    style={[
                      styles.pulseDotInner,
                      { backgroundColor: colors.primary.default },
                    ]}
                  />
                </View>
              )}
            </TactilePressable>
          </Animated.View>
        </View>

        {/* Live Audio Mini-Player Bar */}
        {activeSound && (
          <Animated.View
            sharedTransitionTag={sharedTransitionTags.ambientPlayerBar}
            sharedTransitionStyle={sharedElementStyle}
            style={styles.miniPlayerWrapper}
          >
            <TactilePressable
              onPress={() => navigation.navigate('Soundscapes')}
              scaleDownTo={0.98}
              accessibilityRole="button"
              accessibilityLabel="Open soundscapes player"
              style={[
                styles.miniPlayerBar,
                {
                  backgroundColor: colors.primary.subtle,
                  borderColor: colors.primary.subtleBorder,
                },
              ]}
            >
              <View style={styles.miniPlayerInfo}>
                <AppIcon name="i-musical-notes" size={16} color={colors.primary.default} />
                <AppText
                  variant="labelSmall"
                  color={colors.primary.default}
                  numberOfLines={1}
                  style={styles.miniPlayerText}
                >
                  Playing: {activeSound.toUpperCase()} Ambient Soundscape
                </AppText>
              </View>
              <TactilePressable
                onPress={(e) => {
                  e.stopPropagation();
                  soundService.stop();
                }}
                scaleDownTo={0.88}
                hitSlop={sizes.hitSlop}
                accessibilityRole="button"
                accessibilityLabel="Stop ambient sound"
                style={styles.miniPlayerStop}
              >
                <AppIcon name="i-pause" size={14} color={colors.primary.default} />
              </TactilePressable>
            </TactilePressable>
          </Animated.View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Practice shortcut — one tap to the tool you need */}
        <View style={styles.quickStart}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.practiceRow}
          >
            {PRACTICES.map((p) => (
              <Chip key={p} label={p} selected={category === p} onPress={() => setCategory(p)} />
            ))}
          </ScrollView>
          <Button title={`Start ${category.toLowerCase()}`} onPress={startPractice} fullWidth />
        </View>

        {/* 0. Cute Tactile Zen Playground Card — mint pop card */}
        <PopIn index={0}>
        <Card
          variant="elevated"
          tone="mint"
          onPress={() => navigation.navigate('ZenPlayground')}
        >
          <CardContent style={styles.cardInner}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderCopyWide}>
                <AppText variant="h3" color={mintTint.text}>
                  Zen Playground
                </AppText>
                <AppText variant="caption" color={mintTint.muted} numberOfLines={2} style={styles.sectionSub}>
                  Cute tactile stress relievers: satisfying bubble wrap, sand garden & breathing companion
                </AppText>
                <View style={styles.inlineCta}>
                  <AppText variant="label" color={mintTint.accent}>
                    Play & De-Stress
                  </AppText>
                  <AppIcon name="i-arrow-forward" size={iconSizes.xs} color={mintTint.accent} />
                </View>
              </View>
              <View style={[styles.gameThumbBadge, { backgroundColor: mintTint.plate }]}>
                <Text style={{ fontSize: 34 }}>🫧</Text>
              </View>
            </View>
          </CardContent>
        </Card>
        </PopIn>

        {/* 1. Nature Soundscapes Interactive Player Hub — sky pop card */}
        <PopIn index={1}>
        <Card variant="elevated" tone="sky">
          <CardContent style={styles.cardInner}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderCopy}>
                <AppText variant="h3" color={skyTint.text}>
                  Ambient Sanctuary
                </AppText>
                <AppText variant="caption" color={skyTint.muted} style={styles.sectionSub}>
                  Tap any atmosphere for immediate calm
                </AppText>
              </View>
              <Animated.View
                sharedTransitionTag={sharedTransitionTags.calmHero('soundscapes')}
                sharedTransitionStyle={sharedElementStyle}
              >
                <TactilePressable
                  onPress={() => navigation.navigate('Soundscapes')}
                  scaleDownTo={0.96}
                  accessibilityRole="button"
                  accessibilityLabel="Open nature soundscapes player"
                >
                  <NatureSoundscapeIllustration width={96} height={76} />
                </TactilePressable>
              </Animated.View>
            </View>

            {/* Ambient Sound Grid (2x2 tactile cards with subtle animated click & pulse) */}
            <View style={styles.soundGrid}>
              {SOUND_ROWS.map((row, rIdx) => (
                <View key={rIdx} style={styles.soundGridRow}>
                  {row.map((snd) => (
                    <AnimatedSoundTile
                      key={snd.id}
                      snd={snd}
                      isPlaying={activeSound === snd.id}
                      colors={colors}
                      skyTint={skyTint}
                      onPress={() => handleToggleSound(snd.id)}
                    />
                  ))}
                </View>
              ))}
            </View>

            <TactilePressable
              onPress={() => navigation.navigate('Soundscapes')}
              scaleDownTo={0.99}
              accessibilityRole="button"
              accessibilityLabel="Open full soundscapes player"
              style={[styles.fullPageLink, { borderTopColor: skyTint.border }]}
            >
              <AppText variant="label" color={skyTint.accent}>
                Full Soundscapes Player & Sleep Timer
              </AppText>
              <AppIcon name="i-arrow-forward" size={iconSizes.xs} color={skyTint.accent} />
            </TactilePressable>
          </CardContent>
        </Card>
        </PopIn>

        {/* 2. Interactive Breathwork Studio Hub — coral pop card */}
        <PopIn index={1}>
        <Card
          variant="elevated"
          tone="coral"
          onPress={() => navigation.navigate('BreathworkStudio')}
        >
          <CardContent style={styles.cardInner}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderCopyWide}>
                <AppText variant="h3" color={coralTint.text}>
                  Paced Breathing
                </AppText>
                <AppText variant="caption" color={coralTint.muted} numberOfLines={2} style={styles.sectionSub}>
                  Clinical parasympathetic cadence, 4-7-8, box breathing & custom sessions
                </AppText>
                <View style={styles.inlineCta}>
                  <AppText variant="label" color={coralTint.accent}>
                    Open Breathwork Studio
                  </AppText>
                  <AppIcon name="i-arrow-forward" size={iconSizes.xs} color={coralTint.accent} />
                </View>
              </View>
              <Animated.View
                sharedTransitionTag={sharedTransitionTags.calmHero('breathwork')}
                sharedTransitionStyle={sharedElementStyle}
              >
                <BreathworkIllustration width={96} height={76} />
              </Animated.View>
            </View>
          </CardContent>
        </Card>
        </PopIn>

        {/* 3. 5-4-3-2-1 Sensory Grounding Card — cream pop card */}
        <PopIn index={2}>
        <Card
          variant="elevated"
          tone="cream"
          onPress={() => navigation.navigate('SensoryGrounding')}
        >
          <CardContent style={styles.cardInner}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderCopyWide}>
                <AppText variant="h3" color={creamTint.text}>
                  Sensory Grounding
                </AppText>
                <AppText variant="caption" color={creamTint.muted} numberOfLines={2} style={styles.sectionSub}>
                  Engage physical senses to interrupt cognitive spirals
                </AppText>
                <View style={styles.inlineCta}>
                  <AppText variant="label" color={creamTint.accent}>
                    Begin Grounding
                  </AppText>
                  <AppIcon name="i-arrow-forward" size={iconSizes.xs} color={creamTint.accent} />
                </View>
              </View>
              <Animated.View
                sharedTransitionTag={sharedTransitionTags.calmHero('sensory')}
                sharedTransitionStyle={sharedElementStyle}
              >
                <SensoryGroundingIllustration width={96} height={76} />
              </Animated.View>
            </View>
          </CardContent>
        </Card>
        </PopIn>

        {/* 4. Somatic Body Scan Card — sage pop card */}
        <PopIn index={3}>
        <Card
          variant="elevated"
          tone="sage"
          onPress={() => navigation.navigate('BodyScan')}
        >
          <CardContent style={styles.cardInner}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderCopyWide}>
                <AppText variant="h3" color={sageTint.text}>
                  Somatic Body Scan
                </AppText>
                <AppText variant="caption" color={sageTint.muted} numberOfLines={2} style={styles.sectionSub}>
                  Progressive tension release across 5 anatomy zones
                </AppText>
                <View style={styles.inlineCta}>
                  <AppText variant="label" color={sageTint.accent}>
                    Begin Body Scan
                  </AppText>
                  <AppIcon name="i-arrow-forward" size={iconSizes.xs} color={sageTint.accent} />
                </View>
              </View>
              <Animated.View
                sharedTransitionTag={sharedTransitionTags.calmHero('bodyScan')}
                sharedTransitionStyle={sharedElementStyle}
              >
                <BodyScanIllustration width={96} height={76} />
              </Animated.View>
            </View>
          </CardContent>
        </Card>
        </PopIn>

        {/* 5. Emergency SOS Acute Panic Anchor Card — blush pop card */}
        <PopIn index={4}>
        <Card
          variant="elevated"
          tone="blush"
          onPress={() => navigation.navigate('PanicAnchor')}
        >
          <CardContent style={styles.cardInner}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderCopyWide}>
                <AppText variant="h3" color={blushTint.text}>
                  Acute Panic Anchor
                </AppText>
                <AppText variant="caption" color={blushTint.muted} numberOfLines={2} style={styles.sectionSub}>
                  Physiological sigh & cold water reflex for rapid de-escalation
                </AppText>
                <View style={styles.inlineCta}>
                  <AppText variant="label" color={blushTint.accent}>
                    Open SOS Relief
                  </AppText>
                  <AppIcon name="i-arrow-forward" size={iconSizes.xs} color={blushTint.accent} />
                </View>
              </View>
              <Animated.View
                sharedTransitionTag={sharedTransitionTags.calmHero('panic')}
                sharedTransitionStyle={sharedElementStyle}
              >
                <PanicAnchorIllustration width={96} height={76} />
              </Animated.View>
            </View>
          </CardContent>
        </Card>
        </PopIn>

        {/* 6. Mindful Affirmations Card */}
        <PopIn index={5}>
        <Card
          variant="elevated"
          tone="coral"
          onPress={() => navigation.navigate('Affirmations')}
        >
          <CardContent style={styles.cardInner}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderCopyWide}>
                <AppText variant="h3" color={coralTint.text}>
                  Mindful Affirmations
                </AppText>
                <AppText variant="caption" color={coralTint.muted} numberOfLines={2} style={styles.sectionSub}>
                  Radiant self-worth and grounded positive self-dialogue
                </AppText>
                <View style={styles.inlineCta}>
                  <AppText variant="label" color={coralTint.accent}>
                    Open Affirmations
                  </AppText>
                  <AppIcon name="i-arrow-forward" size={iconSizes.xs} color={coralTint.accent} />
                </View>
              </View>
              <AffirmationsRadianceIllustration width={96} height={76} />
            </View>
          </CardContent>
        </Card>
        </PopIn>

        {/* 7. Thought Reframing Card */}
        <PopIn index={6}>
        <Card
          variant="elevated"
          tone="sage"
          onPress={() => navigation.navigate('ThoughtReframing')}
        >
          <CardContent style={styles.cardInner}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderCopyWide}>
                <AppText variant="h3" color={sageTint.text}>
                  Thought Reframing
                </AppText>
                <AppText variant="caption" color={sageTint.muted} numberOfLines={2} style={styles.sectionSub}>
                  Transform storm clouds and distortions into balanced perspective
                </AppText>
                <View style={styles.inlineCta}>
                  <AppText variant="label" color={sageTint.accent}>
                    Begin Reframing
                  </AppText>
                  <AppIcon name="i-arrow-forward" size={iconSizes.xs} color={sageTint.accent} />
                </View>
              </View>
              <ThoughtReframingIllustration width={96} height={76} />
            </View>
          </CardContent>
        </Card>
        </PopIn>

        {/* 8. Sphere of Control Card */}
        <PopIn index={7}>
        <Card
          variant="elevated"
          tone="sky"
          onPress={() => navigation.navigate('WhatCanIControl')}
        >
          <CardContent style={styles.cardInner}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderCopyWide}>
                <AppText variant="h3" color={skyTint.text}>
                  Sphere of Control
                </AppText>
                <AppText variant="caption" color={skyTint.muted} numberOfLines={2} style={styles.sectionSub}>
                  Focus on what you influence; peacefully surrender what you cannot
                </AppText>
                <View style={styles.inlineCta}>
                  <AppText variant="label" color={skyTint.accent}>
                    Explore Sphere
                  </AppText>
                  <AppIcon name="i-arrow-forward" size={iconSizes.xs} color={skyTint.accent} />
                </View>
              </View>
              <SphereOfControlIllustration width={96} height={76} />
            </View>
          </CardContent>
        </Card>
        </PopIn>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    paddingBottom: spacing[2],
  },
  miniPlayerWrapper: {
    marginTop: spacing[3],
    overflow: 'hidden',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mainSubtitle: {
    marginTop: spacing[1],
  },
  soundStatusBadge: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    borderWidth: borderWidths.thin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseDotWrapper: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 8,
    height: 8,
  },
  pulseDotInner: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
  },
  miniPlayerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.lg,
    borderWidth: borderWidths.thin,
  },
  miniPlayerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    flex: 1,
  },
  miniPlayerText: {
    flexShrink: 1,
  },
  miniPlayerStop: {
    padding: spacing[1],
  },
  scrollContent: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    paddingBottom: layout.screenBottomClearance,
    gap: spacing[4],
  },
  quickStart: {
    gap: spacing[3],
  },
  practiceRow: {
    gap: spacing[2],
    paddingRight: spacing[5],
  },
  cardInner: {
    padding: spacing[5],
    gap: spacing[3],
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeaderCopy: {
    flex: 1,
    paddingRight: spacing[2],
  },
  cardHeaderCopyWide: {
    flex: 1,
    paddingRight: spacing[3],
  },
  sectionSub: {
    marginTop: spacing[1],
  },
  inlineCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginTop: spacing[3],
  },
  soundGrid: {
    gap: spacing[3],
  },
  soundGridRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  soundTile: {
    flex: 1,
    padding: spacing[3],
    borderRadius: radius.lg,
    borderWidth: borderWidths.thin,
    minHeight: 104,
    justifyContent: 'space-between',
  },
  soundTileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  playingIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  equalizerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2.5,
    height: 14,
  },
  eqBar: {
    width: 2.5,
    borderRadius: 1.5,
  },
  soundTileOrb: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    borderWidth: borderWidths.thin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soundTileSub: {
    marginTop: spacing[1],
  },
  fullPageLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing[3],
    borderTopWidth: borderWidths.thin,
    marginTop: spacing[1],
  },
  presetList: {
    gap: spacing[2],
  },
  presetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    borderRadius: radius.lg,
    borderWidth: borderWidths.thin,
    gap: spacing[3],
  },
  presetCopy: {
    flex: 1,
    gap: spacing[1],
  },
  presetStartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
  },
  gameThumbBadge: {
    width: 68,
    height: 68,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
