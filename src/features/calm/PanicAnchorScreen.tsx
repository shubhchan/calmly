import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../../theme/ThemeContext';
import { Card, CardContent, PrimaryButton, PanicAnchorIllustration, ScreenHeader, TactilePressable } from '../../components';
import { Ionicons } from '@expo/vector-icons';
import { soundService } from '../../services/soundService';
import { fontFamilies } from '../../theme/typography';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { useTabBarOffset } from '../../utils/useTabBarOffset';

export function PanicAnchorScreen() {
  const navigation = useNavigation();
  const { colors } = useAppTheme();
  const tabBarOffset = useTabBarOffset();

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
    <ScreenContainer scroll={false} backgroundColor={colors.background.default}>
      <ScreenHeader title="Acute Panic Anchor" subtitle="Biological SOS Aid" bordered />

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: 110 + tabBarOffset }]} showsVerticalScrollIndicator={false}>
        {/* Hero Card with SVG Illustration */}
        <Card variant="elevated" style={[styles.heroCard, { borderColor: (colors.accents.rose) + '50' }]}>
          <CardContent style={styles.heroCardContent}>
            <View style={[styles.heroAuraGlow, { backgroundColor: (colors.accents.rose) + '12' }]}>
              <PanicAnchorIllustration width={190} height={155} />
            </View>
            <View style={styles.heroBadgeRow}>
              <View
                style={[
                  styles.heroBadge,
                  { backgroundColor: (colors.accents.rose) + '15', borderColor: (colors.accents.rose) + '40' },
                ]}
              >
                <Ionicons name="heart" size={12} color={colors.accents.rose} />
                <Text style={[styles.heroBadgeText, { color: colors.accents.rose }]}>You Are Safe</Text>
              </View>
              <Text style={[styles.heroEstText, { color: colors.text.tertiary }]}>Surge will pass shortly</Text>
            </View>
          </CardContent>
        </Card>

        {/* Value Proposition */}
        <View style={styles.section}>
          <Text style={[styles.headline, { color: colors.text.primary }]}>
            This physiological surge will pass in minutes
          </Text>
          <Text style={[styles.subheadline, { color: colors.text.secondary }]}>
            Panic is a temporary surge of adrenaline that feels terrifying but is biologically harmless. You cannot stay in panic indefinitely—your body is already working to metabolize it.
          </Text>
        </View>

        {/* Step 1: Interactive Physiological Sigh */}
        <Card variant="elevated" style={styles.stepCard}>
          <CardContent style={styles.stepContent}>
            <View style={styles.stepHeaderRow}>
              <View style={[styles.stepNumOrb, { backgroundColor: colors.primary.default }]}>
                <Text style={styles.stepNumText}>1</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.stepTitle, { color: colors.text.primary }]}>
                  Double Inhale Physiological Sigh
                </Text>
                <Text style={[styles.stepSubtitle, { color: colors.primary.default }]}>
                  Fastest way to reinflate collapsed alveoli & dump CO₂
                </Text>
              </View>
            </View>
            <Text style={[styles.stepBody, { color: colors.text.secondary }]}>
              Take two consecutive deep inhales through your nose back-to-back without exhaling, then one long, audible, slow exhale through open mouth.
            </Text>
            <TactilePressable
              onPress={handleSighPress}
              scaleDownTo={0.97}
              hapticStyle="medium"
              style={[
                styles.sighButton,
                {
                  backgroundColor: colors.primary.subtle,
                  borderColor: colors.primary.subtleBorder,
                },
              ]}
            >
              <Ionicons name="sparkles" size={18} color={colors.primary.default} />
              <Text style={[styles.sighButtonText, { color: colors.primary.default }]}>
                {sighCount === 0
                  ? 'Tap to complete 1st sigh (Target: 3)'
                  : sighCount < 3
                  ? `Completed ${sighCount} of 3 sighs — Tap for next`
                  : '✓ 3 Sighs completed! Heart rate dropping.'}
              </Text>
            </TactilePressable>
          </CardContent>
        </Card>

        {/* Step 2: Mammalian Dive Reflex */}
        <Card variant="outlined" style={styles.stepCard}>
          <CardContent style={styles.stepContent}>
            <View style={styles.stepHeaderRow}>
              <View style={[styles.stepNumOrb, { backgroundColor: colors.accents.sky }]}>
                <Text style={styles.stepNumText}>2</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.stepTitle, { color: colors.text.primary }]}>
                  Cold Water Shock Reflex
                </Text>
                <Text style={[styles.stepSubtitle, { color: colors.accents.sky }]}>
                  Activates the mammalian dive reflex
                </Text>
              </View>
            </View>
            <Text style={[styles.stepBody, { color: colors.text.secondary }]}>
              Splash ice-cold water onto your eyelids, cheeks, and forehead, or hold a cold beverage can to your neck. This reflex biochemically forces heart rate downward in 10 seconds.
            </Text>
          </CardContent>
        </Card>

        {/* Step 3: Somatic Hand-on-Heart Anchor */}
        <Card variant="outlined" style={styles.stepCard}>
          <CardContent style={styles.stepContent}>
            <View style={styles.stepHeaderRow}>
              <View style={[styles.stepNumOrb, { backgroundColor: colors.accents.peach }]}>
                <Text style={styles.stepNumText}>3</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.stepTitle, { color: colors.text.primary }]}>
                  Tactile Hand-on-Heart
                </Text>
                <Text style={[styles.stepSubtitle, { color: colors.accents.peach }]}>
                  Releases soothing oxytocin
                </Text>
              </View>
            </View>
            <Text style={[styles.stepBody, { color: colors.text.secondary }]}>
              Place one firm, warm palm directly over the center of your chest. Feel the solid weight of your hand. Whisper silently: “I am safe in this room. My body knows how to handle this.”
            </Text>
          </CardContent>
        </Card>

        {/* Instant Nature Soundscape Anchor */}
        <View style={styles.soundRow}>
          <Text style={[styles.soundPromptText, { color: colors.text.secondary }]}>
            Need soothing acoustics right now?
          </Text>
          <TactilePressable
            onPress={handleToggleRain}
            scaleDownTo={0.94}
            style={[
              styles.soundToggleBtn,
              {
                backgroundColor: isPlayingRain ? colors.primary.default : colors.surface.default,
                borderColor: isPlayingRain ? colors.primary.default : colors.border.default,
              },
            ]}
          >
            <Ionicons
              name={isPlayingRain ? 'pause' : 'volume-medium'}
              size={16}
              color={isPlayingRain ? '#FFFFFF' : colors.primary.default}
            />
            <Text style={[styles.soundToggleBtnText, { color: isPlayingRain ? '#FFFFFF' : colors.text.primary }]}>
              {isPlayingRain ? 'Pause Rain' : 'Play Gentle Rain'}
            </Text>
          </TactilePressable>
        </View>
      </ScrollView>

      {/* Floating Bottom Action */}
      <View style={[styles.bottomBar, { bottom: tabBarOffset, backgroundColor: colors.background.default, borderTopColor: colors.border.default }]}>
        <PrimaryButton
          title="Return to Calm Sanctuary"
          variant="secondary"
          size="lg"
          onPress={() => navigation.goBack()}
          leftIcon={<Ionicons name="checkmark-circle-outline" size={20} color={colors.primary.default} />}
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
  heroBadgeText: { fontFamily: fontFamilies.sans.bold, fontSize: 12, fontWeight: '700' },
  heroEstText: { fontFamily: fontFamilies.sans.semiBold, fontSize: 13, fontWeight: '600' },
  section: { gap: 8 },
  headline: {
    fontFamily: fontFamilies.serif.bold,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
    lineHeight: 30,
  },
  subheadline: {
    fontFamily: fontFamilies.sans.regular,
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
  stepNumText: { fontFamily: fontFamilies.sans.bold, color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  stepTitle: { fontFamily: fontFamilies.serif.semiBold, fontSize: 16, fontWeight: '700' },
  stepSubtitle: { fontFamily: fontFamilies.sans.semiBold, fontSize: 12, fontWeight: '600', marginTop: 2 },
  stepBody: { fontFamily: fontFamilies.sans.regular, fontSize: 13, lineHeight: 19 },
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
  sighButtonText: { fontFamily: fontFamilies.sans.bold, fontSize: 13, fontWeight: '700' },
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
  soundPromptText: { fontFamily: fontFamilies.sans.medium, fontSize: 13, fontWeight: '500' },
  soundToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: 1,
  },
  soundToggleBtnText: { fontFamily: fontFamilies.sans.bold, fontSize: 12, fontWeight: '700' },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
});
