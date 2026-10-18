import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, CardContent, PrimaryButton, TactilePressable } from '../../components';
import { useAppTheme } from '../../theme/ThemeContext';
import { resolveTint } from '../../theme/tints';
import { fontFamilies } from '../../theme/typography';

interface WelcomeCardProps {
  onStart: () => void;
  onDismiss: () => void;
}

const FEATURES: { icon: keyof typeof Ionicons.glyphMap; label: string; desc: string }[] = [
  { icon: 'happy-outline', label: 'Check in with your mood', desc: 'A ten-second pause to notice how you feel' },
  { icon: 'book-outline', label: 'Journal your thoughts', desc: 'Reflections, gratitude, and good things' },
  { icon: 'musical-notes-outline', label: 'Unwind with calm sounds', desc: 'Rain, ocean, and night ambience' },
  { icon: 'leaf-outline', label: 'Grow gentle habits', desc: 'Small daily rituals that stick' },
];

export function WelcomeCard({ onStart, onDismiss }: WelcomeCardProps) {
  const { colors, isDark } = useAppTheme();
  const tint = resolveTint(!!isDark, 'sage');

  return (
    <Card variant="elevated" tone="sage" style={{ marginBottom: 20, borderRadius: 22 }}>
      <CardContent style={{ padding: 18, gap: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 14,
              backgroundColor: tint.plate,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="sparkles-outline" size={20} color={tint.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontFamily: fontFamilies.sans.bold, fontWeight: '800', color: tint.text, letterSpacing: -0.3 }}>
              Welcome to Calmly
            </Text>
            <Text style={{ fontSize: 13, color: tint.muted, marginTop: 2 }}>
              Your quiet corner for a calmer mind
            </Text>
          </View>
        </View>

        <View style={{ gap: 10 }}>
          {FEATURES.map((feature) => (
            <View key={feature.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 11,
                  backgroundColor: tint.plate,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name={feature.icon} size={16} color={tint.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: tint.text }}>{feature.label}</Text>
                <Text style={{ fontSize: 12, color: tint.muted, marginTop: 1 }}>{feature.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <PrimaryButton title="Start with a check-in" onPress={onStart} fullWidth />

        <TactilePressable onPress={onDismiss} scaleDownTo={0.97} style={{ alignItems: 'center', paddingVertical: 4 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text.tertiary }}>Maybe later</Text>
        </TactilePressable>
      </CardContent>
    </Card>
  );
}
