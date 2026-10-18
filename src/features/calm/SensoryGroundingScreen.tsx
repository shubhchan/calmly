import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { useAppTheme } from '../../theme/ThemeContext';
import { Card, CardContent, PrimaryButton, SensoryGroundingIllustration, AppIcon, ScreenHeader } from '../../components';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { useTabBarOffset } from '../../utils/useTabBarOffset';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function SensoryGroundingScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useAppTheme();
  const tabBarOffset = useTabBarOffset();

  const handleStartExercise = () => {
    navigation.navigate('GroundingExercise', { type: '5-4-3-2-1' });
  };

  return (
    <ScreenContainer scroll={false} backgroundColor={colors.background.default}>
      <ScreenHeader title="5-4-3-2-1 Grounding" subtitle="Sensory Presence Anchor" bordered />

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: 110 + tabBarOffset }]} showsVerticalScrollIndicator={false}>
        {/* Full-Page Hero Illustration Card */}
        <Card variant="elevated" style={styles.heroCard}>
          <CardContent style={styles.heroCardContent}>
            <View style={[styles.heroAuraGlow, { backgroundColor: colors.primary.subtle }]}>
              <SensoryGroundingIllustration width={190} height={155} />
            </View>
            <View style={styles.heroBadgeRow}>
              <View style={[styles.heroBadge, { backgroundColor: colors.primary.subtle, borderColor: colors.primary.subtleBorder }]}>
                <Ionicons name="eye" size={12} color={colors.primary.default} />
                <Text style={[styles.heroBadgeText, { color: colors.primary.default }]}>Somatic Sensory Deck</Text>
              </View>
              <Text style={[styles.heroEstText, { color: colors.text.tertiary }]}>3–5 min exercise</Text>
            </View>
          </CardContent>
        </Card>

        {/* Header Cue */}
        <View style={{ marginBottom: 4 }}>
          <Text style={[styles.headline, { color: colors.text.primary }]}>
            Reconnect With Your Senses
          </Text>
          <Text style={[styles.subheadline, { color: colors.text.secondary }]}>
            Engage your physical surroundings to gently quiet racing thoughts.
          </Text>
        </View>

        {/* 5-Step Senses Blueprint */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            The 5 Sensory Gateways
          </Text>
          <View style={styles.stepsList}>
            {[
              { count: '5', label: 'Things you can see', desc: 'Look for subtle light reflections, a leaf, colors, textures in your room', icon: 'l-eye' },
              { count: '4', label: 'Things you can feel', desc: 'Notice the cloth on your lap, feet touching the floor, ambient air on hands', icon: 'l-hands' },
              { count: '3', label: 'Things you can hear', desc: 'Listen for distant traffic hum, birds outside, a ticking clock, your exhale', icon: 'l-sound' },
              { count: '2', label: 'Things you can smell', desc: 'Notice clean linen, coffee aroma, fresh rain, or a familiar scent', icon: 'l-calm' },
              { count: '1', label: 'Thing you can taste', desc: 'Take a cool sip of water, notice a lingering mint, or focus on gratitude', icon: 'l-heart' },
            ].map((step) => (
              <View
                key={step.count}
                style={[styles.stepCard, { backgroundColor: colors.surface.default, borderColor: colors.border.default }]}
              >
                <View style={[styles.stepNumBadge, { backgroundColor: colors.primary.default }]}>
                  <Text style={styles.stepNumText}>{step.count}</Text>
                </View>
                <View style={styles.stepInfo}>
                  <Text style={[styles.stepTitle, { color: colors.text.primary }]}>{step.label}</Text>
                  <Text style={[styles.stepDesc, { color: colors.text.tertiary }]}>{step.desc}</Text>
                </View>
                <AppIcon name={step.icon as any} size={24} loop />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Floating Bottom Action */}
      <View style={[styles.bottomBar, { bottom: tabBarOffset, backgroundColor: colors.background.default, borderTopColor: colors.border.default }]}>
        <PrimaryButton
          title="Start Guided 5-4-3-2-1 Guide"
          variant="primary"
          size="lg"
          onPress={handleStartExercise}
          leftIcon={<Ionicons name="compass" size={20} color="#FFFFFF" />}
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
  stepsList: { gap: 10 },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 14,
  },
  stepNumBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  stepInfo: { flex: 1, gap: 3 },
  stepTitle: { fontSize: 15, fontWeight: '700' },
  stepDesc: { fontSize: 12, lineHeight: 17 },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
});
