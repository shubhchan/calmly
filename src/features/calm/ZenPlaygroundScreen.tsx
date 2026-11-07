import React, { useState } from 'react';
import { View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../types/navigation';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { AppText, Button, TactilePressable } from '../../components';
import { useAppTheme } from '../../theme/ThemeContext';
import { BubblePopGame } from './games/BubblePopGame';
import { ZenSandGardenGame } from './games/ZenSandGardenGame';
import { BreathingCompanionGame } from './games/BreathingCompanionGame';
import { Ionicons } from '@expo/vector-icons';
import { soundService } from '../../services/soundService';
import { hapticFeedback } from '../../utils/haptics';

type GameTab = 'bubbles' | 'sand' | 'pet';
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const GAME_TITLES: Record<GameTab, string> = {
  bubbles: 'Bubble pop',
  sand: 'Sand garden',
  pet: 'Breathe with me',
};

/**
 * Zen playground — direction A, "Hub".
 *
 * A quiet front page for three small things to do with your hands. The garden
 * leads; the other two sit in plain cards below it.
 */
export function ZenPlaygroundScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, 'ZenPlayground'>>();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();

  const initial = ((route?.params as any)?.initialGame ?? null) as GameTab | null;
  const [activeGame, setActiveGame] = useState<GameTab | null>(initial);
  const [ambientPlaying, setAmbientPlaying] = useState(false);

  const toggleAmbient = async () => {
    hapticFeedback.selection();
    if (ambientPlaying) {
      await soundService.stop();
      setAmbientPlaying(false);
    } else {
      await soundService.play('birds');
      setAmbientPlaying(true);
    }
  };

  const openGame = (game: GameTab) => {
    hapticFeedback.selection();
    setActiveGame(game);
  };

  if (activeGame) {
    return (
      <ScreenContainer scroll={false} animate={false} backgroundColor={colors.background.default}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 24,
            paddingTop: 8,
            height: 52,
          }}
        >
          <TactilePressable
            onPress={() => setActiveGame(null)}
            scaleDownTo={0.9}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Back to playground"
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: -8,
            }}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text.secondary} />
          </TactilePressable>
          <AppText variant="caption" tone="tertiary" style={{ paddingBottom: 2 }}>
            {GAME_TITLES[activeGame]}
          </AppText>
          <TactilePressable
            onPress={toggleAmbient}
            scaleDownTo={0.9}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={ambientPlaying ? 'Pause forest sounds' : 'Play forest sounds'}
            style={{ width: 40, height: 40, alignItems: 'flex-end', justifyContent: 'center' }}
          >
            <Ionicons
              name={ambientPlaying ? 'musical-notes' : 'musical-note-outline'}
              size={19}
              color={ambientPlaying ? colors.primary.default : colors.text.secondary}
            />
          </TactilePressable>
        </View>
        <View style={{ flex: 1, paddingBottom: Math.max(insets.bottom, 16) }}>
          {activeGame === 'bubbles' ? <BubblePopGame /> : null}
          {activeGame === 'sand' ? <ZenSandGardenGame /> : null}
          {activeGame === 'pet' ? <BreathingCompanionGame /> : null}
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      contentContainerStyle={{
        paddingHorizontal: 24,
        paddingTop: 8,
        paddingBottom: Math.max(insets.bottom, 16) + 24,
      }}
      backgroundColor={colors.background.default}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 52,
        }}
      >
        <TactilePressable
          onPress={() => navigation.goBack()}
          scaleDownTo={0.9}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: -8,
          }}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text.secondary} />
        </TactilePressable>
        <AppText variant="caption" tone="tertiary" style={{ paddingBottom: 2 }}>
          Calm
        </AppText>
        <View style={{ width: 40 }} />
      </View>

      <AppText variant="h1" style={{ marginTop: 8 }}>
        Playground
      </AppText>
      <AppText variant="caption" tone="tertiary" style={{ marginTop: 6, maxWidth: 280 }}>
        Small things to do with your hands when your mind is loud.
      </AppText>

      {/* Garden leads */}
      <TactilePressable
        onPress={() => openGame('sand')}
        scaleDownTo={0.99}
        accessibilityRole="button"
        accessibilityLabel="Open the sand garden"
        style={{
          marginTop: 20,
          borderRadius: 24,
          backgroundColor: colors.primary.default,
          padding: 20,
          overflow: 'hidden',
        }}
      >
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            right: -30,
            top: -30,
            width: 150,
            height: 150,
            borderRadius: 75,
            borderWidth: 1,
            borderColor: colors.primary.foreground,
            opacity: 0.18,
          }}
        />
        <AppText variant="overline" color={colors.primary.foreground} style={{ opacity: 0.7 }}>
          Start here
        </AppText>
        <AppText variant="h3" color={colors.primary.foreground} style={{ marginTop: 7 }}>
          Sand garden
        </AppText>
        <AppText
          variant="caption"
          color={colors.primary.foreground}
          style={{ marginTop: 5, maxWidth: 220, lineHeight: 18, opacity: 0.8 }}
        >
          Rake lines, place stones, and let it be imperfect.
        </AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 }}>
          <View
            style={{
              height: 30,
              paddingHorizontal: 12,
              borderRadius: 999,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.primary.foreground,
              opacity: 0.9,
            }}
          >
            <AppText variant="caption" color={colors.primary.default} style={{ fontWeight: '600' }}>
              3–10 min
            </AppText>
          </View>
          <AppText variant="caption" color={colors.primary.foreground} style={{ opacity: 0.55 }}>
            no score, no timer
          </AppText>
        </View>
      </TactilePressable>

      {/* Two small games */}
      <View style={{ flexDirection: 'row', gap: 11, marginTop: 12 }}>
        <GameCard
          title="Bubble pop"
          note="2 min · for tension"
          onPress={() => openGame('bubbles')}
          art={
            <View style={{ flex: 1 }}>
              <View
                style={{
                  position: 'absolute',
                  left: 30,
                  top: 16,
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  backgroundColor: colors.primary.default,
                  opacity: 0.85,
                }}
              />
              <View
                style={{
                  position: 'absolute',
                  left: 62,
                  top: 10,
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  backgroundColor: colors.primary.default,
                  opacity: 0.5,
                }}
              />
              <View
                style={{
                  position: 'absolute',
                  left: 78,
                  top: 34,
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: colors.primary.default,
                  opacity: 0.3,
                }}
              />
              <View
                style={{
                  position: 'absolute',
                  left: 16,
                  top: 40,
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: colors.status.warning.default,
                  opacity: 0.5,
                }}
              />
            </View>
          }
        />
        <GameCard
          title="Breathe with me"
          note="1 min · paced"
          onPress={() => openGame('pet')}
          art={
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <View
                style={{
                  position: 'absolute',
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  borderWidth: 1.5,
                  borderColor: colors.primary.default,
                  opacity: 0.35,
                }}
              />
              <View
                style={{
                  position: 'absolute',
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  borderWidth: 1.5,
                  borderColor: colors.primary.default,
                  opacity: 0.55,
                }}
              />
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: colors.primary.default,
                  opacity: 0.8,
                }}
              />
            </View>
          }
        />
      </View>

      <View style={{ marginTop: 'auto', paddingTop: 24 }}>
        <Button title="Open the garden" onPress={() => openGame('sand')} fullWidth />
      </View>
    </ScreenContainer>
  );
}

function GameCard({
  title,
  note,
  art,
  onPress,
}: {
  title: string;
  note: string;
  art: React.ReactNode;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <TactilePressable
      onPress={onPress}
      scaleDownTo={0.98}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={{
        flex: 1,
        backgroundColor: colors.surface.default,
        borderRadius: 20,
        padding: 15,
      }}
    >
      <View
        style={{
          height: 64,
          borderRadius: 12,
          backgroundColor: colors.primary.subtle,
          overflow: 'hidden',
        }}
      >
        {art}
      </View>
      <AppText variant="title" style={{ marginTop: 11 }}>
        {title}
      </AppText>
      <AppText variant="caption" tone="tertiary" style={{ marginTop: 1 }}>
        {note}
      </AppText>
    </TactilePressable>
  );
}
