import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, BreathingPreset } from '../../types/navigation';
import { useAppTheme } from '../../theme/ThemeContext';
import {
  AppText,
  AppIcon,
  Badge,
  Card,
  CardContent,
  TactilePressable,
  BreathworkIllustration,
  NatureSoundscapeIllustration,
  SensoryGroundingIllustration,
  BodyScanIllustration,
  PanicAnchorIllustration,
} from '../../components';
import { soundService } from '../../services/soundService';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { PopIn } from '../../components/interactive/PopIn';
import { resolveTint } from '../../theme/tints';
import { borderWidths, iconSizes, layout, radius, sizes, spacing } from '../../theme/tokens';

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

  // Ink for solid accent fills: white in light mode, deep surface in dark mode.
  const solidInk = isDark ? colors.background.default : '#FFFFFF';

  return (
    <ScreenContainer scroll={false} backgroundColor={colors.background.default}>
      {/* Sanctuary Top Bar */}
      <View style={[styles.header, { borderBottomColor: colors.border.default }]}>
        <View style={styles.headerTitleRow}>
          <View>
            <AppText variant="h1">Calm</AppText>
            <AppText variant="bodySmall" tone="tertiary" style={styles.mainSubtitle}>
              Tactile mindful tools & somatic rest
            </AppText>
          </View>
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
            {activeSound && <View style={[styles.pulseDot, { backgroundColor: colors.primary.default }]} />}
          </TactilePressable>
        </View>

        {/* Live Audio Mini-Player Bar (When Sound is Active) */}
        {activeSound && (
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
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Nature Soundscapes Interactive Player Hub — sky pop card */}
        <PopIn index={0}>
        <Card variant="elevated" tone="sky">
          <CardContent style={styles.cardInner}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderCopy}>
                <Badge label="Nature Soundscapes" tone="info" style={styles.badge} />
                <AppText variant="h3" color={skyTint.text}>
                  Ambient Sanctuary
                </AppText>
                <AppText variant="caption" color={skyTint.muted} style={styles.sectionSub}>
                  Tap any atmosphere for immediate calm
                </AppText>
              </View>
              <NatureSoundscapeIllustration width={96} height={76} />
            </View>

            {/* Ambient Sound Grid (2x2 tactile cards) */}
            <View style={styles.soundGrid}>
              {SOUND_ROWS.map((row, rIdx) => (
                <View key={rIdx} style={styles.soundGridRow}>
                  {row.map((snd) => {
                    const isPlaying = activeSound === snd.id;
                    return (
                      <TactilePressable
                        key={snd.id}
                        onPress={() => handleToggleSound(snd.id)}
                        scaleDownTo={0.97}
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
                          {isPlaying && <Badge label="Playing" tone="primary" size="sm" />}
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
                    );
                  })}
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
        <Card variant="elevated" tone="coral">
          <CardContent style={styles.cardInner}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderCopy}>
                <Badge label="Breathwork Studio" tone="warning" style={styles.badge} />
                <AppText variant="h3" color={coralTint.text}>
                  Paced Breathing
                </AppText>
                <AppText variant="caption" color={coralTint.muted} style={styles.sectionSub}>
                  Restore nervous system rhythm
                </AppText>
              </View>
              <BreathworkIllustration width={96} height={76} />
            </View>

            {/* Direct Breathwork Presets */}
            <View style={styles.presetList}>
              {BREATH_PRESETS.map((preset) => (
                <View
                  key={preset.id}
                  style={[
                    styles.presetRow,
                    {
                      backgroundColor: coralTint.plate,
                      borderColor: coralTint.border,
                    },
                  ]}
                >
                  <View style={styles.presetCopy}>
                    <AppText variant="label" color={coralTint.text}>
                      {preset.title}
                    </AppText>
                    <AppText variant="labelSmall" color={coralTint.accent}>
                      {preset.cadence}
                    </AppText>
                    <AppText variant="caption" color={coralTint.muted}>
                      {preset.benefit}
                    </AppText>
                  </View>
                  <TactilePressable
                    onPress={() => handleStartBreathSession(preset.id, preset.duration)}
                    scaleDownTo={0.94}
                    hapticStyle="medium"
                    accessibilityRole="button"
                    accessibilityLabel={`Start ${preset.title}`}
                    style={[styles.presetStartButton, { backgroundColor: coralTint.accent }]}
                  >
                    <AppIcon name="i-play" size={14} color={solidInk} />
                    <AppText variant="label" color={solidInk}>
                      Start
                    </AppText>
                  </TactilePressable>
                </View>
              ))}
            </View>

            <TactilePressable
              onPress={() => navigation.navigate('BreathworkStudio')}
              scaleDownTo={0.99}
              accessibilityRole="button"
              accessibilityLabel="Explore breathwork studio"
              style={[styles.fullPageLink, { borderTopColor: coralTint.border }]}
            >
              <AppText variant="label" color={coralTint.accent}>
                Explore Custom Durations & Audio in Studio
              </AppText>
              <AppIcon name="i-arrow-forward" size={iconSizes.xs} color={coralTint.accent} />
            </TactilePressable>
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
                <Badge label="5 Senses Reset" tone="warning" style={styles.badge} />
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
              <SensoryGroundingIllustration width={96} height={76} />
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
                <Badge label="Muscle Release" tone="primary" style={styles.badge} />
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
              <BodyScanIllustration width={96} height={76} />
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
                <Badge label="Emergency SOS" tone="error" style={styles.badge} />
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
              <PanicAnchorIllustration width={96} height={76} />
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
    paddingBottom: spacing[3],
    borderBottomWidth: borderWidths.thin,
    gap: spacing[3],
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
  pulseDot: {
    position: 'absolute',
    top: 9,
    right: 9,
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
  badge: {
    marginBottom: spacing[2],
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
});
