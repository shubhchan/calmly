import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { useAppTheme } from '../../theme/ThemeContext';
import { AppText, BodyScanIllustration, Button, ScreenHeader, TactilePressable } from '../../components';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface ZoneConfig {
  id: string;
  name: string;
  cue: string;
  somaticBenefit: string;
}

const BODY_ZONES: ZoneConfig[] = [
  {
    id: 'head',
    name: 'Head and jaw',
    cue: 'Unclench your teeth. Let your tongue drop from the roof of your mouth. Soften the muscles around your temples and eyes.',
    somaticBenefit: 'Eases tension in the face and jaw',
  },
  {
    id: 'shoulders',
    name: 'Neck and shoulders',
    cue: 'Inhale and draw your shoulders toward your ears. Exhale with a sigh and let them drop heavily.',
    somaticBenefit: 'Releases the shoulders',
  },
  {
    id: 'chest',
    name: 'Chest',
    cue: 'Place a warm hand on your sternum. Feel the ribcage rise and fall. Let the breath move lower.',
    somaticBenefit: 'Slows the breath',
  },
  {
    id: 'belly',
    name: 'Belly',
    cue: 'Let your belly become soft and round as you exhale. Stop holding it in.',
    somaticBenefit: 'Settles the gut',
  },
  {
    id: 'back',
    name: 'Spine',
    cue: 'Imagine warmth moving down each vertebra. Feel the chair holding your whole body.',
    somaticBenefit: 'Softens the lower back',
  },
  {
    id: 'limbs',
    name: 'Legs and feet',
    cue: 'Feel your feet resting on the ground. Notice their weight and warmth.',
    somaticBenefit: 'Grounds the body',
  },
];

/**
 * Body scan — pick a zone, read one cue, or start the full scan.
 */
export function BodyScanScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  const [selectedZone, setSelectedZone] = useState<string>('shoulders');
  const activeZone = BODY_ZONES.find((z) => z.id === selectedZone) || BODY_ZONES[1];

  const handleStartFullScan = () => {
    navigation.navigate('GroundingExercise', { type: 'body-scan' });
  };

  return (
    <ScreenContainer animate={false} scroll={false} backgroundColor={colors.background.default}>
      <ScreenHeader title="Body scan" />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ alignItems: 'center' }}>
          <View
            style={{
              width: '100%',
              paddingVertical: 16,
              borderRadius: 20,
              backgroundColor: colors.primary.subtle,
              alignItems: 'center',
            }}
          >
            <BodyScanIllustration width={180} height={140} />
          </View>
        </View>

        <View style={{ marginTop: 24 }}>
          <AppText variant="h3">Where is the tension?</AppText>
          <AppText variant="body" tone="secondary" style={{ marginTop: 8 }}>
            Choose a area, then follow one short cue. Move slowly.
          </AppText>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingVertical: 20 }}
        >
          {BODY_ZONES.map((zone) => {
            const isSelected = selectedZone === zone.id;
            return (
              <TactilePressable
                key={zone.id}
                onPress={() => setSelectedZone(zone.id)}
                scaleDownTo={0.95}
                hapticStyle="selection"
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 9,
                  borderRadius: 999,
                  backgroundColor: isSelected ? colors.primary.default : colors.surface.muted,
                }}
              >
                <AppText variant="caption" tone={isSelected ? 'onPrimary' : 'secondary'}>
                  {zone.name}
                </AppText>
              </TactilePressable>
            );
          })}
        </ScrollView>

        <View style={{ borderTopWidth: 1, borderTopColor: colors.border.default, paddingTop: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.surface.muted,
              }}
            >
              <Ionicons name="leaf-outline" size={18} color={colors.primary.default} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="bodyLarge">{activeZone.name}</AppText>
              <AppText variant="caption" tone="tertiary" style={{ marginTop: 2 }}>
                {activeZone.somaticBenefit}
              </AppText>
            </View>
          </View>
          <AppText variant="body" tone="secondary" style={{ marginTop: 16 }}>
            {activeZone.cue}
          </AppText>
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
          title="Start full body scan"
          variant="primary"
          size="lg"
          onPress={handleStartFullScan}
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
