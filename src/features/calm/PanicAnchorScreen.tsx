import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../../theme/ThemeContext';
import { AppText, Button, PanicAnchorIllustration, ScreenHeader, TactilePressable } from '../../components';
import { Ionicons } from '@expo/vector-icons';
import { soundService } from '../../services/soundService';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Panic anchor — three body-first steps, in order.
 *
 * The page stays quiet: one illustration, one explanation, three short
 * instructions, one way to add rain, one way out.
 */
export function PanicAnchorScreen() {
  const navigation = useNavigation();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();

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
    <ScreenContainer animate={false} scroll={false} backgroundColor={colors.background.default}>
      <ScreenHeader title="Panic anchor" subtitle="In the moment" />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ alignItems: 'center' }}>
          <View
            style={{
              width: '100%',
              paddingVertical: 18,
              borderRadius: 20,
              backgroundColor: colors.primary.subtle,
              alignItems: 'center',
            }}
          >
            <PanicAnchorIllustration width={180} height={140} />
          </View>
        </View>

        <View style={{ marginTop: 24 }}>
          <AppText variant="h3">This will pass</AppText>
          <AppText variant="body" tone="secondary" style={{ marginTop: 8 }}>
            A panic surge feels enormous, but it is temporary and not dangerous. Your body is
            already working to clear it.
          </AppText>
        </View>

        <View style={{ marginTop: 32 }}>
          <Step number={1} title="Two inhales, one long exhale">
            Breathe in through your nose, add a second short inhale, then exhale slowly through
            your mouth.
          </Step>
          <TactilePressable
            onPress={handleSighPress}
            scaleDownTo={0.98}
            hapticStyle="medium"
            accessibilityRole="button"
            accessibilityLabel="Record a completed sigh"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              paddingVertical: 13,
              paddingHorizontal: 14,
              borderRadius: 16,
              backgroundColor: colors.primary.subtle,
              marginTop: 12,
            }}
          >
            <Ionicons name="leaf-outline" size={16} color={colors.primary.default} />
            <AppText variant="label" tone="link">
              {sighCount === 0
                ? 'Tap after each sigh · target 3'
                : sighCount < 3
                  ? `${sighCount} of 3 sighs`
                  : 'Three sighs done'}
            </AppText>
          </TactilePressable>

          <Step number={2} title="Cool your face">
            Splash cold water on your cheeks and forehead, or hold something cold against your
            neck. This slows your heart within seconds.
          </Step>

          <Step number={3} title="Hand on heart">
            Rest one palm on your chest. Feel its weight. Say silently, “I am safe in this room.”
          </Step>
        </View>

        <View
          style={{
            marginTop: 32,
            paddingTop: 20,
            borderTopWidth: 1,
            borderTopColor: colors.border.default,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <AppText variant="bodySmall" tone="secondary" style={{ flex: 1 }}>
            Add gentle rain
          </AppText>
          <TactilePressable
            onPress={handleToggleRain}
            scaleDownTo={0.96}
            accessibilityRole="button"
            accessibilityLabel={isPlayingRain ? 'Pause rain' : 'Play rain'}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 7,
              paddingHorizontal: 15,
              paddingVertical: 10,
              borderRadius: 999,
              backgroundColor: isPlayingRain ? colors.primary.default : colors.surface.muted,
            }}
          >
            <Ionicons
              name={isPlayingRain ? 'pause' : 'play'}
              size={14}
              color={isPlayingRain ? colors.primary.foreground : colors.text.secondary}
            />
            <AppText variant="caption" tone={isPlayingRain ? 'onPrimary' : 'secondary'}>
              {isPlayingRain ? 'Pause' : 'Play'}
            </AppText>
          </TactilePressable>
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
          title="Back to calm"
          variant="secondary"
          size="lg"
          onPress={() => navigation.goBack()}
          leftIcon={(color) => <Ionicons name="arrow-back-outline" size={18} color={color} />}
        />
      </View>
    </ScreenContainer>
  );
}

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  const { colors } = useAppTheme();
  return (
    <View
      style={{
        paddingVertical: 18,
        borderTopWidth: 1,
        borderTopColor: colors.border.default,
        flexDirection: 'row',
        gap: 12,
      }}
    >
      <View
        style={{
          width: 26,
          height: 26,
          borderRadius: 13,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.surface.muted,
        }}
      >
        <AppText variant="caption" tone="secondary">
          {number}
        </AppText>
      </View>
      <View style={{ flex: 1 }}>
        <AppText variant="bodyLarge">{title}</AppText>
        <AppText variant="bodySmall" tone="secondary" style={{ marginTop: 4 }}>
          {children}
        </AppText>
      </View>
    </View>
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
