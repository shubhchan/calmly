import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, BreathingPreset } from '../../types/navigation';
import { useAppTheme } from '../../theme/ThemeContext';
import { Card, CardContent, PrimaryButton, MeditationHeroIllustration, ScreenHeader, TactilePressable } from '../../components';
import { Ionicons } from '@expo/vector-icons';
import { soundService } from '../../services/soundService';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { PopIn } from '../../components/interactive/PopIn';
import { resolveTint } from '../../theme/tints';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface TechniqueOption {
  id: BreathingPreset;
  title: string;
  badge: string;
  cadence: string;
  description: string;
  inhale: number;
  hold: number;
  exhale: number;
}

const TECHNIQUES: TechniqueOption[] = [
  {
    id: '4-7-8',
    title: '4-7-8 Tranquil Reset',
    badge: 'Relaxation & Sleep',
    cadence: '4s Inhale · 7s Hold · 8s Exhale',
    description: 'Calms the nervous system with extended, soothing exhales.',
    inhale: 4,
    hold: 7,
    exhale: 8,
  },
  {
    id: 'box',
    title: 'Box Breathing (Square)',
    badge: 'Focus & Balance',
    cadence: '4s · 4s · 4s · 4s',
    description: 'Equalized autonomic rhythm to steady heart rate under pressure.',
    inhale: 4,
    hold: 4,
    exhale: 4,
  },
  {
    id: 'deep',
    title: 'Deep Vagal Resonance',
    badge: 'Heart Coherence',
    cadence: '5.5s Inhale · 5.5s Exhale',
    description: 'Balanced flow for deeper lung capacity and inner harmony.',
    inhale: 5,
    hold: 0,
    exhale: 5,
  },
];

export function BreathworkStudioScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDark } = useAppTheme();

  const [selectedTechnique, setSelectedTechnique] = useState<BreathingPreset>('4-7-8');
  const [selectedDuration, setSelectedDuration] = useState<number>(5); // minutes
  const [ambientSound, setAmbientSound] = useState<'rain' | 'ocean' | 'birds' | 'off'>('rain');

  const currentTechnique = TECHNIQUES.find((t) => t.id === selectedTechnique) || TECHNIQUES[0];

  const handleStartSession = () => {
    navigation.navigate('BreathingSession', {
      preset: selectedTechnique,
      duration: selectedDuration * 60,
    });
  };

  const handleToggleAmbient = async (soundId: 'rain' | 'ocean' | 'birds' | 'off') => {
    setAmbientSound(soundId);
    if (soundId === 'off') {
      await soundService.stop();
    } else {
      await soundService.play(soundId);
    }
  };

  const coralTint = resolveTint(!!isDark, 'coral');
  const sageTint = resolveTint(!!isDark, 'sage');

  return (
    <ScreenContainer scroll={false} backgroundColor={colors.background.default}>
      <ScreenHeader title="Breathwork Studio" subtitle="Parasympathetic Cadence" bordered />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Full-Page Hero Illustration Card */}
        <PopIn index={0}>
        <Card variant="elevated" style={styles.heroCard}>
          <CardContent style={styles.heroCardContent}>
            <View style={[styles.heroAuraGlow, { backgroundColor: colors.primary.subtle }]}>
              <MeditationHeroIllustration width={190} height={155} />
            </View>
            <View style={styles.heroBadgeRow}>
              <View style={[styles.heroBadge, { backgroundColor: colors.primary.subtle, borderColor: colors.primary.subtleBorder }]}>
                <Ionicons name="sparkles" size={12} color={colors.primary.default} />
                <Text style={[styles.heroBadgeText, { color: colors.primary.default }]}>Clinical Somatics</Text>
              </View>
              <Text style={[styles.heroEstText, { color: colors.text.tertiary }]}>{selectedDuration} min session</Text>
            </View>
          </CardContent>
        </Card>
        </PopIn>

        {/* Cadence Selection Header */}
        <PopIn index={1}>
        <View style={{ marginBottom: 4 }}>
          <Text style={[styles.headline, { color: colors.text.primary }]}>
            Restore Calm in 90 Seconds
          </Text>
          <Text style={[styles.subheadline, { color: colors.text.secondary }]}>
            Select your rhythm below to lower resting pulse and ease tension.
          </Text>
        </View>
        </PopIn>

        {/* Technique Selector Pills */}
        <PopIn index={2}>
        <Card variant="outlined" tone="coral" style={styles.tintedSectionCard}>
          <CardContent style={styles.tintedSectionContent}>
            <Text style={[styles.sectionTitle, { color: coralTint.text }]}>
              Select Cadence Technique
            </Text>
            <View style={styles.techniqueList}>
              {TECHNIQUES.map((tech) => {
                const isSelected = selectedTechnique === tech.id;
                return (
                  <TactilePressable
                    key={tech.id}
                    onPress={() => setSelectedTechnique(tech.id)}
                    scaleDownTo={0.98}
                    style={[
                      styles.techniqueCard,
                      {
                        backgroundColor: coralTint.plate,
                        borderColor: isSelected ? coralTint.accent : coralTint.border,
                      },
                    ]}
                  >
                    <View style={styles.techniqueHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.techniqueTitle, { color: coralTint.text }]}>
                          {tech.title}
                        </Text>
                        <Text style={[styles.techniqueCadence, { color: coralTint.accent }]}>
                          {tech.cadence}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.radioCircle,
                          { borderColor: isSelected ? coralTint.accent : coralTint.border },
                          isSelected && { backgroundColor: coralTint.accent },
                        ]}
                      >
                        {isSelected && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                      </View>
                    </View>
                    <Text style={[styles.techniqueDesc, { color: coralTint.text }]}>
                      {tech.description}
                    </Text>
                  </TactilePressable>
                );
              })}
            </View>
          </CardContent>
        </Card>
        </PopIn>

        {/* Live Cadence Blueprint Visualizer */}
        <Card variant="outlined" style={styles.blueprintCard}>
          <CardContent style={styles.blueprintContent}>
            <Text style={[styles.blueprintHeading, { color: colors.text.primary }]}>
              Rhythm Cadence Blueprint
            </Text>
            <View style={styles.cadenceStepsRow}>
              <View style={[styles.cadenceStep, { backgroundColor: colors.primary.subtle }]}>
                <Text style={[styles.cadenceTime, { color: colors.primary.default }]}>{currentTechnique.inhale}s</Text>
                <Text style={[styles.cadenceLabel, { color: colors.text.tertiary }]}>Inhale</Text>
              </View>
              {currentTechnique.hold > 0 && (
                <View style={[styles.cadenceStep, { backgroundColor: (colors.accents.peach) + '15' }]}>
                  <Text style={[styles.cadenceTime, { color: colors.accents.peach }]}>{currentTechnique.hold}s</Text>
                  <Text style={[styles.cadenceLabel, { color: colors.text.tertiary }]}>Hold</Text>
                </View>
              )}
              <View style={[styles.cadenceStep, { backgroundColor: (colors.accents.sky) + '15' }]}>
                <Text style={[styles.cadenceTime, { color: colors.accents.sky }]}>{currentTechnique.exhale}s</Text>
                <Text style={[styles.cadenceLabel, { color: colors.text.tertiary }]}>Exhale</Text>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Duration Selector */}
        <PopIn index={3}>
        <Card variant="outlined" tone="sage" style={styles.tintedSectionCard}>
          <CardContent style={styles.tintedSectionContent}>
            <Text style={[styles.sectionTitle, { color: sageTint.text }]}>
              Practice Duration
            </Text>
            <View style={styles.durationPillsRow}>
              {[
                { val: 3, label: '3 min', sub: 'Quick Relief' },
                { val: 5, label: '5 min', sub: 'Deep Rest' },
                { val: 10, label: '10 min', sub: 'Full Unwind' },
              ].map((dur) => {
                const isSelected = selectedDuration === dur.val;
                return (
                  <TactilePressable
                    key={dur.val}
                    onPress={() => setSelectedDuration(dur.val)}
                    scaleDownTo={0.94}
                    style={[
                      styles.durationPill,
                      {
                        backgroundColor: isSelected ? sageTint.accent : sageTint.plate,
                        borderColor: isSelected ? sageTint.accent : sageTint.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.durationVal,
                        { color: isSelected ? '#FFFFFF' : sageTint.text },
                      ]}
                    >
                      {dur.label}
                    </Text>
                    <Text
                      style={[
                        styles.durationSub,
                        { color: isSelected ? 'rgba(255,255,255,0.8)' : sageTint.muted },
                      ]}
                    >
                      {dur.sub}
                    </Text>
                  </TactilePressable>
                );
              })}
            </View>
          </CardContent>
        </Card>
        </PopIn>

        {/* Ambient Acoustics Selector */}
        <PopIn index={4}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Background Nature Acoustic
          </Text>
          <View style={styles.ambientPillRow}>
            {[
              { id: 'rain', label: 'Rainfall', icon: 'rainy-outline' },
              { id: 'ocean', label: 'Ocean Tide', icon: 'water-outline' },
              { id: 'birds', label: 'Forest Birds', icon: 'leaf-outline' },
              { id: 'off', label: 'Silent', icon: 'volume-mute-outline' },
            ].map((snd) => {
              const isSelected = ambientSound === snd.id;
              return (
                <TactilePressable
                  key={snd.id}
                  onPress={() => handleToggleAmbient(snd.id as any)}
                  scaleDownTo={0.94}
                  style={[
                    styles.ambientPill,
                    {
                      backgroundColor: isSelected ? colors.primary.subtle : colors.surface.default,
                      borderColor: isSelected ? colors.primary.default : colors.border.default,
                    },
                  ]}
                >
                  <Ionicons
                    name={snd.icon as any}
                    size={14}
                    color={isSelected ? colors.primary.default : colors.text.tertiary}
                  />
                  <Text
                    style={[
                      styles.ambientPillText,
                      { color: isSelected ? colors.primary.default : colors.text.secondary },
                    ]}
                  >
                    {snd.label}
                  </Text>
                </TactilePressable>
              );
            })}
          </View>
        </View>
        </PopIn>
      </ScrollView>

      {/* Floating Bottom Primary Action Bar */}
      <View style={[styles.bottomBar, { backgroundColor: colors.background.default, borderTopColor: colors.border.default }]}>
        <PrimaryButton
          title={`Start ${selectedDuration}-Minute Session`}
          variant="primary"
          size="lg"
          onPress={handleStartSession}
          leftIcon={<Ionicons name="play" size={20} color="#FFFFFF" />}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 110,
    gap: 20,
  },
  heroCard: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  heroCardContent: {
    padding: 20,
    alignItems: 'center',
  },
  heroAuraGlow: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 14,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1,
  },
  heroBadgeText: { fontSize: 12, fontWeight: '700' },
  heroEstText: { fontSize: 13, fontWeight: '600' },
  section: { gap: 10 },
  tintedSectionCard: { borderRadius: 20 },
  tintedSectionContent: { padding: 16, gap: 10 },
  headline: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
    lineHeight: 30,
  },
  subheadline: {
    fontSize: 14,
    lineHeight: 21,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  metricChip: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 2,
  },
  metricVal: { fontSize: 14, fontWeight: '800' },
  metricDesc: { fontSize: 11, fontWeight: '500' },
  sectionTitle: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  techniqueList: { gap: 10 },
  techniqueCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 8,
  },
  techniqueHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  techniqueTitle: { fontSize: 16, fontWeight: '700' },
  techniqueCadence: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  techniqueDesc: { fontSize: 13, lineHeight: 18 },
  blueprintCard: { borderRadius: 20 },
  blueprintContent: { padding: 16, gap: 12 },
  blueprintHeading: { fontSize: 14, fontWeight: '700' },
  cadenceStepsRow: { flexDirection: 'row', gap: 10 },
  cadenceStep: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 14,
    gap: 2,
  },
  cadenceTime: { fontSize: 18, fontWeight: '800' },
  cadenceLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  durationPillsRow: { flexDirection: 'row', gap: 10 },
  durationPill: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    gap: 2,
  },
  durationVal: { fontSize: 15, fontWeight: '800' },
  durationSub: { fontSize: 11, fontWeight: '500' },
  ambientPillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  ambientPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: 1,
  },
  ambientPillText: { fontSize: 12, fontWeight: '600' },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
});
