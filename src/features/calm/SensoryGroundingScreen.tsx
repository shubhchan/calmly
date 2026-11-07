import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { useAppTheme } from '../../theme/ThemeContext';
import { AppText, Button, SensoryGroundingIllustration, ScreenHeader } from '../../components';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const SENSES = [
  { count: '5', label: 'Things you can see', desc: 'Light, a leaf, a color.' },
  { count: '4', label: 'Things you can feel', desc: 'Cloth, the floor, cool air.' },
  { count: '3', label: 'Things you can hear', desc: 'Traffic, birds, your breath.' },
  { count: '2', label: 'Things you can smell', desc: 'Linen, coffee, rain.' },
  { count: '1', label: 'Thing you can taste', desc: 'Water, mint, nothing at all.' },
];

/** Sensory grounding — the 5-4-3-2-1 sequence, read once. */
export function SensoryGroundingScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  const handleStartExercise = () => {
    navigation.navigate('GroundingExercise', { type: '5-4-3-2-1' });
  };

  return (
    <ScreenContainer animate={false} scroll={false} backgroundColor={colors.background.default}>
      <ScreenHeader title="Grounding" subtitle="Five senses" />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            width: '100%',
            paddingVertical: 18,
            borderRadius: 20,
            backgroundColor: colors.primary.subtle,
            alignItems: 'center',
          }}
        >
          <SensoryGroundingIllustration width={180} height={140} />
        </View>

        <View style={{ marginTop: 24 }}>
          <AppText variant="h3">Come back to the room</AppText>
          <AppText variant="body" tone="secondary" style={{ marginTop: 8 }}>
            Name what your senses already know. Go slowly and leave room between each step.
          </AppText>
        </View>

        <View style={{ marginTop: 28 }}>
          {SENSES.map((step, index) => (
            <View
              key={step.count}
              style={{
                flexDirection: 'row',
                gap: 14,
                paddingVertical: 16,
                borderTopWidth: index === 0 ? 0 : 1,
                borderTopColor: colors.border.default,
              }}
            >
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.surface.muted,
                }}
              >
                <AppText variant="label" tone="secondary">
                  {step.count}
                </AppText>
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="bodyLarge">{step.label}</AppText>
                <AppText variant="caption" tone="tertiary" style={{ marginTop: 2 }}>
                  {step.desc}
                </AppText>
              </View>
            </View>
          ))}
        </View>
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
          title="Start the guided sequence"
          variant="primary"
          size="lg"
          onPress={handleStartExercise}
          leftIcon={(color) => <Ionicons name="compass-outline" size={18} color={color} />}
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
