import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, BreathingPreset } from '../../types/navigation';
import { useAppTheme } from '../../theme/ThemeContext';
import { AppText, Button, ScreenHeader, TactilePressable } from '../../components';
import { Ionicons } from '@expo/vector-icons';
import { soundService } from '../../services/soundService';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { PopIn } from '../../components/interactive/PopIn';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
    title: '4-7-8',
    badge: 'Relaxation and sleep',
    cadence: '4s in · 7s hold · 8s out',
    description: 'A long exhale to calm the nervous system.',
    inhale: 4,
    hold: 7,
    exhale: 8,
  },
  {
    id: 'box',
    title: 'Box breathing',
    badge: 'Focus and balance',
    cadence: '4s · 4s · 4s · 4s',
    description: 'Four equal sides to steady a racing mind.',
    inhale: 4,
    hold: 4,
    exhale: 4,
  },
  {
    id: 'deep',
    title: 'Deep resonance',
    badge: 'Heart coherence',
    cadence: '5.5s in · 5.5s out',
    description: 'An even flow that deepens the breath.',
    inhale: 5,
    hold: 0,
    exhale: 5,
  },
];

const DURATIONS = [
  { val: 3, label: '3 min', sub: 'Quick reset' },
  { val: 5, label: '5 min', sub: 'Deep rest' },
  { val: 10, label: '10 min', sub: 'Full unwind' },
];

const AMBIENCE = [
  { id: 'rain', label: 'Rain', icon: 'rainy-outline' },
  { id: 'ocean', label: 'Ocean', icon: 'water-outline' },
  { id: 'birds', label: 'Birds', icon: 'leaf-outline' },
  { id: 'off', label: 'Silent', icon: 'volume-mute-outline' },
];

/**
 * Breathwork studio — choose a rhythm, a length and a sound.
 *
 * The choices are read as one page: radio rows, then a cadence strip, then
 * quiet pills. The start action waits at the bottom.
 */
export function BreathworkStudioScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  const [selectedTechnique, setSelectedTechnique] = useState<BreathingPreset>('4-7-8');
  const [selectedDuration, setSelectedDuration] = useState<number>(5);
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

  return (
    <ScreenContainer animate={false} scroll={false} backgroundColor={colors.background.default}>
      <ScreenHeader title="Breathwork" />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 110 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <AppText variant="body" tone="secondary" style={{ maxWidth: 310 }}>
          A slower rhythm, held for a few minutes. Choose one and let the timer keep time for you.
        </AppText>

        <PopIn index={1}>
          <View style={{ marginTop: 32 }}>
            <AppText variant="overline" tone="tertiary">
              Rhythm
            </AppText>
            <View style={{ marginTop: 2 }}>
              {TECHNIQUES.map((tech, index) => {
                const isSelected = selectedTechnique === tech.id;
                return (
                  <View key={tech.id}>
                    <TactilePressable
                      onPress={() => setSelectedTechnique(tech.id)}
                      scaleDownTo={0.99}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isSelected }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        paddingVertical: 15,
                        borderTopWidth: index === 0 ? 0 : 1,
                        borderTopColor: colors.border.default,
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <AppText variant="bodyLarge" tone={isSelected ? 'primary' : 'secondary'}>
                          {tech.title}
                        </AppText>
                        <AppText variant="caption" tone="tertiary" style={{ marginTop: 2 }}>
                          {tech.badge} · {tech.cadence}
                        </AppText>
                      </View>
                      <Ionicons
                        name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                        size={21}
                        color={isSelected ? colors.primary.default : colors.text.tertiary}
                      />
                    </TactilePressable>
                  </View>
                );
              })}
            </View>
            <AppText variant="bodySmall" tone="secondary" style={{ marginTop: 8 }}>
              {currentTechnique.description}
            </AppText>
          </View>
        </PopIn>

        <PopIn index={2}>
          <View
            style={{
              marginTop: 32,
              flexDirection: 'row',
              gap: 8,
              padding: 8,
              borderRadius: 20,
              backgroundColor: colors.surface.selected,
            }}
          >
            <View style={[styles.cadenceStep, { backgroundColor: colors.surface.default }]}>
                <AppText variant="title" center>
                  {currentTechnique.inhale}
                </AppText>
                <AppText variant="caption" tone="tertiary" center>
                  in
                </AppText>
              </View>
            {currentTechnique.hold > 0 ? (
              <View style={[styles.cadenceStep, { backgroundColor: colors.surface.default }]}>
                <AppText variant="title" center>
                  {currentTechnique.hold}
                </AppText>
                <AppText variant="caption" tone="tertiary" center>
                  hold
                </AppText>
              </View>
            ) : null}
            <View style={[styles.cadenceStep, { backgroundColor: colors.surface.default }]}>
              <AppText variant="title" center>
                {currentTechnique.exhale}
              </AppText>
              <AppText variant="caption" tone="tertiary" center>
                out
              </AppText>
            </View>
          </View>
        </PopIn>

        <PopIn index={3}>
          <View style={{ marginTop: 32 }}>
            <AppText variant="overline" tone="tertiary">
              Length
            </AppText>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              {DURATIONS.map((dur) => {
                const isSelected = selectedDuration === dur.val;
                return (
                  <TactilePressable
                    key={dur.val}
                    onPress={() => setSelectedDuration(dur.val)}
                    scaleDownTo={0.95}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                    style={{
                      flex: 1,
                      paddingVertical: 14,
                      alignItems: 'center',
                      borderRadius: 16,
                      backgroundColor: isSelected ? colors.primary.default : colors.surface.muted,
                    }}
                  >
                    <AppText variant="label" tone={isSelected ? 'onPrimary' : 'primary'}>
                      {dur.label}
                    </AppText>
                    <AppText
                      variant="caption"
                      tone={isSelected ? 'onPrimary' : 'tertiary'}
                      style={{ marginTop: 2, opacity: isSelected ? 0.8 : 1 }}
                    >
                      {dur.sub}
                    </AppText>
                  </TactilePressable>
                );
              })}
            </View>
          </View>
        </PopIn>

        <PopIn index={4}>
          <View style={{ marginTop: 32 }}>
            <AppText variant="overline" tone="tertiary">
              Sound
            </AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
              {AMBIENCE.map((snd) => {
                const isSelected = ambientSound === snd.id;
                return (
                  <TactilePressable
                    key={snd.id}
                    onPress={() => handleToggleAmbient(snd.id as any)}
                    scaleDownTo={0.95}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      paddingHorizontal: 13,
                      paddingVertical: 9,
                      borderRadius: 999,
                      backgroundColor: isSelected ? colors.primary.subtle : colors.surface.muted,
                    }}
                  >
                    <Ionicons
                      name={snd.icon as any}
                      size={14}
                      color={isSelected ? colors.primary.default : colors.text.tertiary}
                    />
                    <AppText variant="caption" tone={isSelected ? 'link' : 'secondary'}>
                      {snd.label}
                    </AppText>
                  </TactilePressable>
                );
              })}
            </View>
          </View>
        </PopIn>
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          {
            paddingBottom: Math.max(insets.bottom + 12, 24),
            backgroundColor: colors.background.default,
            borderTopColor: colors.border.default,
          },
        ]}
      >
        <Button
          title={`Start ${selectedDuration}-minute session`}
          variant="primary"
          size="lg"
          onPress={handleStartSession}
          leftIcon={(color) => <Ionicons name="play" size={18} color={color} />}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 110,
  },
  cadenceStep: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 14,
    gap: 2,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
