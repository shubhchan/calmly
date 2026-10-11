import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemeColors } from '../../theme/ThemeContext';
import { Card, CardContent, PrimaryButton, PanicAnchorIllustration } from '../../components';
import { Ionicons } from '@expo/vector-icons';
import { soundService } from '../../services/soundService';

export function PanicAnchorScreen() {
  const navigation = useNavigation();
  const colors = useThemeColors();

  const [sighCount, setSighCount] = useState<number>(0);
  const [isPlayingRain, setIsPlayingRain] = useState<boolean>(false);

  const handleSighPress = () => {
    setSighCount((prev) => (prev >= 3 ? 1 : prev + 1));
  };

  const handleToggleRain = async () => {
    if (isPlayingRain) {
      await soundService.stop();
      setIsPlayingRain(false);
    } else {
      await soundService.play('rain');
      setIsPlayingRain(true);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      {/* Top Bar */}
      <View style={[styles.navBar, { borderBottomColor: colors.borderLight }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backButton, { backgroundColor: colors.bgCard, borderColor: colors.borderLight }]}
          hitSlop={10}
        >
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.navTitleCol}>
          <Text style={[styles.navTitle, { color: colors.textPrimary }]}>Acute Panic Anchor</Text>
          <Text style={[styles.navSubtitle, { color: colors.accentRose || '#EB697F' }]}>Biological SOS Aid</Text>
        </View>
        <View
          style={[
            styles.badgeOrb,
            { backgroundColor: (colors.accentRose || '#EB697F') + '18', borderColor: (colors.accentRose || '#EB697F') + '50' },
          ]}
        >
          <Ionicons name="shield-checkmark" size={16} color={colors.accentRose || '#EB697F'} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Card with SVG Illustration */}
        <Card variant="elevated" style={[styles.heroCard, { borderColor: (colors.accentRose || '#EB697F') + '50' }]}>
          <CardContent style={styles.heroCardContent}>
            <View style={[styles.heroAuraGlow, { backgroundColor: (colors.accentRose || '#EB697F') + '12' }]}>
              <PanicAnchorIllustration width={190} height={155} />
            </View>
            <View style={styles.heroBadgeRow}>
              <View
                style={[
                  styles.heroBadge,
                  { backgroundColor: (colors.accentRose || '#EB697F') + '15', borderColor: (colors.accentRose || '#EB697F') + '40' },
                ]}
              >
                <Ionicons name="heart" size={12} color={colors.accentRose || '#EB697F'} />
                <Text style={[styles.heroBadgeText, { color: colors.accentRose || '#EB697F' }]}>You Are Safe</Text>
              </View>
              <Text style={[styles.heroEstText, { color: colors.textTertiary }]}>Surge will pass shortly</Text>
            </View>
          </CardContent>
        </Card>

        {/* Value Proposition */}
        <View style={styles.section}>
          <Text style={[styles.headline, { color: colors.textPrimary }]}>
            This physiological surge will pass in minutes
          </Text>
          <Text style={[styles.subheadline, { color: colors.textSecondary }]}>
            Panic is a temporary surge of adrenaline that feels terrifying but is biologically harmless. You cannot stay in panic indefinitely—your body is already working to metabolize it.
          </Text>
        </View>

        {/* Step 1: Interactive Physiological Sigh */}
        <Card variant="elevated" style={styles.stepCard}>
          <CardContent style={styles.stepContent}>
            <View style={styles.stepHeaderRow}>
              <View style={[styles.stepNumOrb, { backgroundColor: colors.accentPrimary }]}>
                <Text style={styles.stepNumText}>1</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>
                  Double Inhale Physiological Sigh
                </Text>
                <Text style={[styles.stepSubtitle, { color: colors.accentPrimary }]}>
                  Fastest way to reinflate collapsed alveoli & dump CO₂
                </Text>
              </View>
            </View>
            <Text style={[styles.stepBody, { color: colors.textSecondary }]}>
              Take two consecutive deep inhales through your nose back-to-back without exhaling, then one long, audible, slow exhale through open mouth.
            </Text>
            <Pressable
              onPress={handleSighPress}
              style={[styles.sighButton, { backgroundColor: colors.accentBg, borderColor: colors.accentBorder }]}
            >
              <Ionicons name="sparkles" size={18} color={colors.accentPrimary} />
              <Text style={[styles.sighButtonText, { color: colors.accentPrimary }]}>
                {sighCount === 0
                  ? 'Tap to complete 1st sigh (Target: 3)'
                  : sighCount < 3
                  ? `Completed ${sighCount} of 3 sighs — Tap for next`
                  : '✓ 3 Sighs completed! Heart rate dropping.'}
              </Text>
            </Pressable>
          </CardContent>
        </Card>

        {/* Step 2: Mammalian Dive Reflex */}
        <Card variant="outlined" style={styles.stepCard}>
          <CardContent style={styles.stepContent}>
            <View style={styles.stepHeaderRow}>
              <View style={[styles.stepNumOrb, { backgroundColor: colors.accentSky || '#6B9BCD' }]}>
                <Text style={styles.stepNumText}>2</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>
                  Cold Water Shock Reflex
                </Text>
                <Text style={[styles.stepSubtitle, { color: colors.accentSky || '#6B9BCD' }]}>
                  Activates the mammalian dive reflex
                </Text>
              </View>
            </View>
            <Text style={[styles.stepBody, { color: colors.textSecondary }]}>
              Splash ice-cold water onto your eyelids, cheeks, and forehead, or hold a cold beverage can to your neck. This reflex biochemically forces heart rate downward in 10 seconds.
            </Text>
          </CardContent>
        </Card>

        {/* Step 3: Somatic Hand-on-Heart Anchor */}
        <Card variant="outlined" style={styles.stepCard}>
          <CardContent style={styles.stepContent}>
            <View style={styles.stepHeaderRow}>
              <View style={[styles.stepNumOrb, { backgroundColor: colors.accentPeach || '#EB876D' }]}>
                <Text style={styles.stepNumText}>3</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>
                  Tactile Hand-on-Heart
                </Text>
                <Text style={[styles.stepSubtitle, { color: colors.accentPeach || '#EB876D' }]}>
                  Releases soothing oxytocin
                </Text>
              </View>
            </View>
            <Text style={[styles.stepBody, { color: colors.textSecondary }]}>
              Place one firm, warm palm directly over the center of your chest. Feel the solid weight of your hand. Whisper silently: “I am safe in this room. My body knows how to handle this.”
            </Text>
          </CardContent>
        </Card>

        {/* Instant Nature Soundscape Anchor */}
        <View style={styles.soundRow}>
          <Text style={[styles.soundPromptText, { color: colors.textSecondary }]}>
            Need soothing acoustics right now?
          </Text>
          <TouchableOpacity
            onPress={handleToggleRain}
            style={[
              styles.soundToggleBtn,
              {
                backgroundColor: isPlayingRain ? colors.accentPrimary : colors.bgCard,
                borderColor: isPlayingRain ? colors.accentPrimary : colors.borderLight,
              },
            ]}
          >
            <Ionicons
              name={isPlayingRain ? 'pause' : 'volume-medium'}
              size={16}
              color={isPlayingRain ? '#FFFFFF' : colors.accentPrimary}
            />
            <Text style={[styles.soundToggleBtnText, { color: isPlayingRain ? '#FFFFFF' : colors.textPrimary }]}>
              {isPlayingRain ? 'Pause Rain' : 'Play Gentle Rain'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Floating Bottom Action */}
      <View style={[styles.bottomBar, { backgroundColor: colors.bgPrimary, borderTopColor: colors.borderLight }]}>
        <PrimaryButton
          title="Return to Calm Sanctuary"
          variant="secondary"
          size="lg"
          onPress={() => navigation.goBack()}
          leftIcon={<Ionicons name="checkmark-circle-outline" size={20} color={colors.accentPrimary} />}
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
  navSubtitle: { fontSize: 12, fontWeight: '700', marginTop: 1 },
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
    gap: 18,
  },
  heroCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
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
  section: { gap: 8 },
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
  stepCard: { borderRadius: 20 },
  stepContent: { padding: 16, gap: 10 },
  stepHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepNumOrb: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  stepTitle: { fontSize: 16, fontWeight: '700' },
  stepSubtitle: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  stepBody: { fontSize: 13, lineHeight: 19 },
  sighButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 4,
  },
  sighButtonText: { fontSize: 13, fontWeight: '700' },
  soundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    marginTop: 4,
  },
  soundPromptText: { fontSize: 13, fontWeight: '500' },
  soundToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: 1,
  },
  soundToggleBtnText: { fontSize: 12, fontWeight: '700' },
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
