import React, { useState } from 'react';
import { View, Text, Pressable, Switch, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, AccentColor } from '../../types/navigation';
import { useAppTheme, useTheme } from '../../theme/ThemeContext';
import { Card, CardContent } from '../../components/Card';
import { PrimaryButton } from '../../components/PrimaryButton';
import { AppIcon } from '../../components/AppIcon';
import type { AppIconName } from '../../components/AppIcon';
import { Ionicons } from '@expo/vector-icons';
import { useFontStore } from '../../theme/fontStore';
import { useMotionPrefs } from '../../theme/motion';
import { PageHeader } from '../../components/ui/PageHeader';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { PopIn } from '../../components/interactive/PopIn';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ACCENT_COLORS_PREVIEW: Record<AccentColor, string> = {
  sage: '#5A955A',
  lavender: '#877FC5',
  sky: '#6B9BCD',
  peach: '#EB876D',
  rose: '#EB697F',
  ocean: '#4EA5A5',
};

const accentOptions: { value: AccentColor; label: string; icon: AppIconName }[] = [
  { value: 'sage', label: 'Sage', icon: 'i-leaf' },
  { value: 'lavender', label: 'Lavender', icon: 'i-flower' },
  { value: 'sky', label: 'Sky', icon: 'i-cloud' },
  { value: 'peach', label: 'Peach', icon: 'l-star' },
  { value: 'rose', label: 'Rose', icon: 'l-heart' },
  { value: 'ocean', label: 'Ocean', icon: 'i-water' },
];

const themeOptions: { value: 'light' | 'dark' | 'system'; label: string; icon: AppIconName }[] = [
  { value: 'light', label: 'Light', icon: 'i-sun' },
  { value: 'dark', label: 'Dark', icon: 'i-moon' },
  { value: 'system', label: 'System', icon: 'i-phone' },
];

export function SettingsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const themeContext = useTheme();
  const { colors } = useAppTheme();

  const theme = themeContext.theme ?? 'system';
  const accent = themeContext.accent ?? 'sage';
  const setTheme = themeContext.setTheme ?? (() => {});
  const setAccent = themeContext.setAccent ?? (() => {});

  const activeFont = useFontStore((s) => s.active);
  const reduceAnimations = useMotionPrefs((s) => s.reduceMotion);
  const setReduceAnimations = useMotionPrefs((s) => s.setReduceMotion);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [highContrast, setHighContrast] = useState(false);

  return (
    <ScreenContainer contentContainerStyle={styles.content} backgroundColor={colors.background.default}>
      <PageHeader title="Settings" subtitle="Personalize your mindful sanctuary" style={{ marginBottom: 4 }} />

      {/* Typography */}
      <PopIn index={0}>
        <Card variant="elevated" style={styles.card}>
          <CardContent>
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.sectionIconWrap, { backgroundColor: colors.accents.lavender + '18' }]}>
                <Ionicons name="text-outline" size={20} color={colors.accents.lavender} />
              </View>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Typography</Text>
            </View>

            <Pressable
              onPress={() => navigation.navigate('FontBrowser')}
              style={({ pressed }) => [
                styles.menuRow,
                { borderBottomWidth: 0 },
                pressed && { opacity: 0.7 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`App font, currently ${activeFont.label}. Browse Google Fonts.`}
            >
              <View style={styles.menuTextWrap}>
                <Text style={[styles.menuTitle, { color: colors.text.primary }]}>App Font</Text>
                <Text style={[styles.menuSubtitle, { color: colors.text.tertiary }]}>
                  1500+ Google Fonts, applied everywhere — instantly
                </Text>
              </View>
              <Text style={[styles.fontPreviewGlyph, { color: colors.primary.default }]}>Aa</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.text.tertiary} />
            </Pressable>
          </CardContent>
        </Card>
      </PopIn>

      {/* Appearance */}
      <PopIn index={1}>
      <Card variant="elevated" style={styles.card}>
        <CardContent>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIconWrap, { backgroundColor: colors.primary.default + '18' }]}>
              <Ionicons name="color-palette-outline" size={20} color={colors.primary.default} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Appearance</Text>
          </View>

          <Text style={[styles.groupLabel, { color: colors.text.secondary }]}>Theme Mode</Text>
          <View style={styles.themeGrid}>
            {(themeOptions ?? []).map((option) => {
              const isSelected = theme === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => setTheme(option.value)}
                  style={[
                    styles.themeButton,
                    {
                      backgroundColor: colors.surface.default,
                      borderColor: isSelected ? colors.primary.default : colors.border.default,
                    },
                    isSelected && { backgroundColor: colors.primary.default + '14', borderWidth: 2 },
                  ]}
                >
                  <AppIcon name={option.icon} size={24} />
                  <Text
                    style={[
                      styles.themeLabel,
                      { color: isSelected ? colors.primary.default : colors.text.primary },
                      isSelected && { fontWeight: '700' },
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.groupLabel, { color: colors.text.secondary, marginTop: 18 }]}>Accent Harmony</Text>
          <View style={styles.accentGrid}>
            {(accentOptions ?? []).map((option) => {
              const isSelected = accent === option.value;
              const swatchColor = ACCENT_COLORS_PREVIEW[option.value];
              return (
                <Pressable
                  key={option.value}
                  onPress={() => setAccent(option.value)}
                  style={[
                    styles.accentChip,
                    {
                      backgroundColor: colors.surface.default,
                      borderColor: isSelected ? colors.primary.default : colors.border.default,
                    },
                    isSelected && { backgroundColor: colors.primary.default + '14', borderWidth: 2 },
                  ]}
                >
                  <View style={[styles.accentDot, { backgroundColor: swatchColor }]} />
                  <Text
                    style={[
                      styles.accentLabel,
                      { color: isSelected ? colors.primary.default : colors.text.primary },
                      isSelected && { fontWeight: '700' },
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </CardContent>
      </Card>
      </PopIn>

      {/* Navigation Sub-screens */}
      <PopIn index={2}>
      <Card variant="elevated" style={styles.card}>
        <CardContent>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIconWrap, { backgroundColor: colors.accents.sky + '18' }]}>
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.accents.sky} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Security & Alerts</Text>
          </View>

          <View style={styles.menuList}>
            <Pressable
              onPress={() => navigation.navigate('AppLockSettings')}
              style={({ pressed }) => [
                styles.menuRow,
                { borderBottomColor: colors.border.default },
                pressed && { opacity: 0.7 },
              ]}
            >
              <View style={styles.menuTextWrap}>
                <Text style={[styles.menuTitle, { color: colors.text.primary }]}>App Lock & Security</Text>
                <Text style={[styles.menuSubtitle, { color: colors.text.tertiary }]}>Biometrics, PIN protection, and auto-lock</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.text.tertiary} />
            </Pressable>

            <Pressable
              onPress={() => navigation.navigate('Notifications')}
              style={({ pressed }) => [
                styles.menuRow,
                { borderBottomColor: colors.border.default },
                pressed && { opacity: 0.7 },
              ]}
            >
              <View style={styles.menuTextWrap}>
                <Text style={[styles.menuTitle, { color: colors.text.primary }]}>Mindful Reminders</Text>
                <Text style={[styles.menuSubtitle, { color: colors.text.tertiary }]}>Morning, journal, and evening notifications</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.text.tertiary} />
            </Pressable>

            <Pressable
              onPress={() => navigation.navigate('DataManagement')}
              style={({ pressed }) => [
                styles.menuRow,
                { borderBottomWidth: 0 },
                pressed && { opacity: 0.7 },
              ]}
            >
              <View style={styles.menuTextWrap}>
                <Text style={[styles.menuTitle, { color: colors.text.primary }]}>Data Management & Backup</Text>
                <Text style={[styles.menuSubtitle, { color: colors.text.tertiary }]}>Export JSON, import, or cloud-free backup</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.text.tertiary} />
            </Pressable>
          </View>
        </CardContent>
      </Card>
      </PopIn>

      {/* Accessibility & Experience */}
      <PopIn index={3}>
      <Card variant="elevated" style={styles.card}>
        <CardContent>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIconWrap, { backgroundColor: colors.accents.lavender + '18' }]}>
              <Ionicons name="accessibility-outline" size={20} color={colors.accents.lavender} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Accessibility</Text>
          </View>

          <View style={styles.switchList}>
            <View style={[styles.switchRow, { borderBottomColor: colors.border.default }]}>
              <View style={styles.menuTextWrap}>
                <Text style={[styles.menuTitle, { color: colors.text.primary }]}>Reduce Animations</Text>
                <Text style={[styles.menuSubtitle, { color: colors.text.tertiary }]}>Minimize motion and transitions</Text>
              </View>
              <Switch
                value={reduceAnimations}
                onValueChange={setReduceAnimations}
                trackColor={{ false: colors.border.default, true: colors.primary.default }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={[styles.switchRow, { borderBottomColor: colors.border.default }]}>
              <View style={styles.menuTextWrap}>
                <Text style={[styles.menuTitle, { color: colors.text.primary }]}>Haptic Feedback</Text>
                <Text style={[styles.menuSubtitle, { color: colors.text.tertiary }]}>Tactile vibrations on check-ins</Text>
              </View>
              <Switch
                value={hapticsEnabled}
                onValueChange={setHapticsEnabled}
                trackColor={{ false: colors.border.default, true: colors.primary.default }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={[styles.switchRow, { borderBottomWidth: 0 }]}>
              <View style={styles.menuTextWrap}>
                <Text style={[styles.menuTitle, { color: colors.text.primary }]}>High Contrast Text</Text>
                <Text style={[styles.menuSubtitle, { color: colors.text.tertiary }]}>Enhance readability of interface copy</Text>
              </View>
              <Switch
                value={highContrast}
                onValueChange={setHighContrast}
                trackColor={{ false: colors.border.default, true: colors.primary.default }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </CardContent>
      </Card>
      </PopIn>

      {/* About Calmly */}
      <PopIn index={4}>
      <Card variant="outlined" style={styles.card}>
        <CardContent style={styles.aboutContent}>
          <View style={[styles.logoBadge, { backgroundColor: colors.primary.default + '20' }]}>
            <AppIcon name="i-leaf" size={28} color={colors.primary.default} />
          </View>
          <Text style={[styles.aboutTitle, { color: colors.text.primary }]}>Calmly</Text>
          <Text style={[styles.aboutVersion, { color: colors.text.secondary }]}>Version 1.0.0 (Offline-First)</Text>
          <Text style={[styles.aboutDescription, { color: colors.text.tertiary }]}>
            A private, encrypted, and mindful mental health sanctuary. All reflections and data remain 100% on your device.
          </Text>
          <PrimaryButton
            title="Replay Welcome Tour"
            variant="ghost"
            size="sm"
            onPress={() => navigation.navigate('Onboarding')}
            style={{ marginTop: 12 }}
            textStyle={{ color: colors.primary.default, fontSize: 13 }}
            fullWidth={false}
          />
          <Pressable
            onPress={() => navigation.navigate('DesignSystem')}
            style={({ pressed }) => [
              styles.menuRow,
              { borderBottomWidth: 0, marginTop: 16 },
              pressed && { opacity: 0.7 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Open the design system reference"
          >
            <View style={styles.menuTextWrap}>
              <Text style={[styles.menuTitle, { color: colors.text.primary }]}>Design System</Text>
              <Text style={[styles.menuSubtitle, { color: colors.text.tertiary }]}>
                Tokens, themes and every UI component, live
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.text.tertiary} />
          </Pressable>
        </CardContent>
      </Card>
      </PopIn>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 110, gap: 16 },
  card: { marginBottom: 0 },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  sectionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', letterSpacing: -0.2 },
  groupLabel: { fontSize: 13, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  themeGrid: { flexDirection: 'row', gap: 10 },
  themeButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  themeLabel: { fontSize: 13, fontWeight: '600' },
  accentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  accentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  accentDot: { width: 12, height: 12, borderRadius: 6 },
  accentLabel: { fontSize: 13, fontWeight: '600' },
  menuList: { gap: 0 },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  menuTextWrap: { flex: 1, paddingRight: 12 },
  fontPreviewGlyph: { fontSize: 20, marginRight: 8 },
  menuTitle: { fontSize: 15, fontWeight: '600' },
  menuSubtitle: { fontSize: 12, marginTop: 2, lineHeight: 17 },
  switchList: { gap: 0 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  aboutContent: { alignItems: 'center', paddingVertical: 16, gap: 6 },
  logoBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  aboutTitle: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
  aboutVersion: { fontSize: 13, fontWeight: '500' },
  aboutDescription: { fontSize: 13, textAlign: 'center', lineHeight: 18, marginTop: 4, paddingHorizontal: 12 },
});