import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { useThemeColors } from '../../theme/ThemeContext';
import { Card, CardContent, PrimaryButton, BodyScanIllustration, AppIcon } from '../../components';
import { Ionicons } from '@expo/vector-icons';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface ZoneConfig {
  id: string;
  name: string;
  cue: string;
  somaticBenefit: string;
  icon: string;
}

const BODY_ZONES: ZoneConfig[] = [
  {
    id: 'head',
    name: 'Crown, Forehead & Jaw',
    cue: 'Unclench your teeth. Let your tongue drop gently from the roof of your mouth. Soften the tiny muscles around your temples and eyelids.',
    somaticBenefit: 'Eases cranial tension headaches and suboccipital tightness',
    icon: 'i-sun',
  },
  {
    id: 'shoulders',
    name: 'Neck & Shoulders',
    cue: 'Inhale and gently draw shoulders toward ears, then exhale with a deep sigh and let them drop down heavily. Notice the release.',
    somaticBenefit: 'Releases chronic upper-trapezius postural guarding',
    icon: 'l-expand',
  },
  {
    id: 'chest',
    name: 'Chest & Diaphragm',
    cue: 'Place a warm hand over your sternum. Feel the gentle rise and fall of your ribcage. Allow the breath to expand downward into belly.',
    somaticBenefit: 'Expands thoracic breathing capacity and soothes cardiac flutter',
    icon: 'l-heart',
  },
  {
    id: 'belly',
    name: 'Solar Plexus & Abdomen',
    cue: 'Release unconscious gut-tightening. Allow your belly to become soft, round, and receptive as you exhale.',
    somaticBenefit: 'Activates enteric nervous system and digestive equilibrium',
    icon: 'l-calm',
  },
  {
    id: 'back',
    name: 'Spine & Lower Back',
    cue: 'Visualize warm honey flowing down each vertebra from upper spine to tailbone. Feel the chair supporting your entire body.',
    somaticBenefit: 'Alleviates lumbar stiffness and chronic postural compression',
    icon: 'l-pulse',
  },
  {
    id: 'limbs',
    name: 'Legs, Ankles & Feet',
    cue: 'Feel gravity anchoring your feet securely to the earth. Notice the warmth and heavy, relaxed stillness in your legs.',
    somaticBenefit: 'Provides tactile groundedness and relieves restless leg tension',
    icon: 'l-walk',
  },
];

export function BodyScanScreen() {
  const navigation = useNavigation<NavigationProp>();
  const colors = useThemeColors();

  const [selectedZone, setSelectedZone] = useState<string>('shoulders');
  const activeZone = BODY_ZONES.find((z) => z.id === selectedZone) || BODY_ZONES[1];

  const handleStartFullScan = () => {
    navigation.navigate('GroundingExercise', { type: 'body-scan' });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      {/* Top Bar */}
      <View style={[styles.navBar, { borderBottomColor: colors.borderLight }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [
            styles.backButton,
            {
              backgroundColor: colors.bgCard,
              borderColor: colors.borderLight,
              transform: [{ scale: pressed ? 0.92 : 1 }],
              opacity: pressed ? 0.8 : 1,
            },
          ]}
          hitSlop={10}
        >
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.navTitleCol}>
          <Text style={[styles.navTitle, { color: colors.textPrimary }]}>Somatic Body Scan</Text>
          <Text style={[styles.navSubtitle, { color: colors.textTertiary }]}>Muscle Tension Reliever</Text>
        </View>
        <View style={[styles.badgeOrb, { backgroundColor: colors.accentBg, borderColor: colors.accentBorder }]}>
          <Ionicons name="body-outline" size={16} color={colors.accentPrimary} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Card with SVG Illustration */}
        <Card variant="elevated" style={styles.heroCard}>
          <CardContent style={styles.heroCardContent}>
            <View style={[styles.heroAuraGlow, { backgroundColor: colors.accentBg }]}>
              <BodyScanIllustration width={190} height={155} />
            </View>
            <View style={styles.heroBadgeRow}>
              <View style={[styles.heroBadge, { backgroundColor: colors.accentBg, borderColor: colors.accentBorder }]}>
                <Ionicons name="fitness-outline" size={12} color={colors.accentPrimary} />
                <Text style={[styles.heroBadgeText, { color: colors.accentPrimary }]}>Somatic Biofeedback</Text>
              </View>
              <Text style={[styles.heroEstText, { color: colors.textTertiary }]}>8 min guided scan</Text>
            </View>
          </CardContent>
        </Card>

        {/* Header Cue */}
        <View style={{ marginBottom: 4 }}>
          <Text style={[styles.headline, { color: colors.textPrimary }]}>
            Release Stored Tension
          </Text>
          <Text style={[styles.subheadline, { color: colors.textSecondary }]}>
            Gently focus your attention to soothe each muscle group.
          </Text>
        </View>

        {/* Anatomy Zones Carousel */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Target Anatomy Zone
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.zonesScroll}>
            {BODY_ZONES.map((zone) => {
              const isSelected = selectedZone === zone.id;
              return (
                <Pressable
                  key={zone.id}
                  onPress={() => setSelectedZone(zone.id)}
                  style={({ pressed }) => [
                    styles.zoneChip,
                    {
                      backgroundColor: isSelected ? colors.accentPrimary : colors.bgCard,
                      borderColor: isSelected ? colors.accentPrimary : colors.borderLight,
                      transform: [{ scale: pressed ? 0.94 : 1 }],
                      opacity: pressed ? 0.88 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.zoneChipText,
                      { color: isSelected ? '#FFFFFF' : colors.textPrimary },
                      isSelected && { fontWeight: '700' },
                    ]}
                  >
                    {zone.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Active Zone Guidance Box */}
        <Card variant="outlined" style={styles.activeZoneCard}>
          <CardContent style={styles.activeZoneContent}>
            <View style={styles.activeZoneHeader}>
              <View style={[styles.activeZoneOrb, { backgroundColor: colors.accentBg }]}>
                <Ionicons name="leaf" size={20} color={colors.accentPrimary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.activeZoneTitle, { color: colors.textPrimary }]}>
                  {activeZone.name}
                </Text>
                <Text style={[styles.activeZoneBenefit, { color: colors.accentPrimary }]}>
                  {activeZone.somaticBenefit}
                </Text>
              </View>
            </View>
            <View style={[styles.cueBox, { backgroundColor: colors.bgSecondary ?? '#F4EFE6' }]}>
              <Text style={[styles.cueLabel, { color: colors.textTertiary }]}>Somatic Release Cue:</Text>
              <Text style={[styles.cueText, { color: colors.textPrimary }]}>
                {activeZone.cue}
              </Text>
            </View>
          </CardContent>
        </Card>
      </ScrollView>

      {/* Floating Bottom Primary Action Bar */}
      <View style={[styles.bottomBar, { backgroundColor: colors.bgPrimary, borderTopColor: colors.borderLight }]}>
        <PrimaryButton
          title="Start Full 8-Minute Body Scan"
          variant="primary"
          size="lg"
          onPress={handleStartFullScan}
          leftIcon={<Ionicons name="play" size={20} color="#FFFFFF" />}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitleCol: { alignItems: 'center' },
  navTitle: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  navSubtitle: { fontSize: 12, fontWeight: '500', marginTop: 1 },
  badgeOrb: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  zonesScroll: { gap: 8, paddingRight: 4 },
  zoneChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  zoneChipText: { fontSize: 13, fontWeight: '600' },
  activeZoneCard: { borderRadius: 20 },
  activeZoneContent: { padding: 16, gap: 14 },
  activeZoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activeZoneOrb: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeZoneTitle: { fontSize: 16, fontWeight: '700' },
  activeZoneBenefit: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  cueBox: {
    padding: 14,
    borderRadius: 14,
    gap: 4,
  },
  cueLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  cueText: { fontSize: 14, lineHeight: 21 },
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
