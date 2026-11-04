import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../types/navigation';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { TactilePressable } from '../../components/interactive/TactilePressable';
import { useAppTheme } from '../../theme/ThemeContext';
import { BubblePopGame } from './games/BubblePopGame';
import { ZenSandGardenGame } from './games/ZenSandGardenGame';
import { BreathingCompanionGame } from './games/BreathingCompanionGame';
import { Ionicons } from '@expo/vector-icons';
import { soundService } from '../../services/soundService';

type GameTab = 'bubbles' | 'sand' | 'pet';

export function ZenPlaygroundScreen() {
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const route = useRoute<RouteProp<RootStackParamList, 'ZenPlayground'>>();
  const initial = (route?.params as any)?.initialGame || 'bubbles';
  const [activeTab, setActiveTab] = useState<GameTab>(initial);
  const [ambientPlaying, setAmbientPlaying] = useState(false);

  const toggleAmbient = async () => {
    if (ambientPlaying) {
      await soundService.stop();
      setAmbientPlaying(false);
    } else {
      await soundService.play('birds');
      setAmbientPlaying(true);
    }
  };

  return (
    <ScreenContainer scroll={false} animate={false} backgroundColor={colors.background.default}>
      <ScreenHeader
        title="Zen Playground"
        subtitle="Cute & tactile stress relief"
        right={
          <TactilePressable
            onPress={toggleAmbient}
            scaleDownTo={0.92}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={ambientPlaying ? 'Pause forest sounds' : 'Play calming forest sounds'}
            style={[
              styles.soundToggle,
              {
                backgroundColor: ambientPlaying ? colors.primary.subtle : colors.surface.default,
                borderColor: ambientPlaying ? colors.primary.default : colors.border.default,
              },
            ]}
          >
            <Ionicons
              name={ambientPlaying ? 'musical-notes' : 'musical-note-outline'}
              size={18}
              color={ambientPlaying ? colors.primary.default : colors.text.secondary}
            />
          </TactilePressable>
        }
      />

      {/* Segmented Game Selection Bar */}
      <View style={[styles.tabBar, { backgroundColor: colors.surface.default, borderColor: colors.border.default }]}>
        <TactilePressable
          onPress={() => setActiveTab('bubbles')}
          scaleDownTo={0.94}
          hapticStyle="selection"
          style={[
            styles.tabItem,
            activeTab === 'bubbles' && {
              backgroundColor: colors.primary.default,
              shadowColor: colors.primary.default,
              shadowOpacity: 0.25,
              shadowRadius: 6,
              elevation: 3,
            },
          ]}
        >
          <Text style={[styles.tabEmoji]}>🫧</Text>
          <Text
            style={[
              styles.tabTitle,
              { color: activeTab === 'bubbles' ? '#FFFFFF' : colors.text.secondary },
              activeTab === 'bubbles' && { fontWeight: '700' },
            ]}
          >
            Bubble Pop
          </Text>
        </TactilePressable>

        <TactilePressable
          onPress={() => setActiveTab('sand')}
          scaleDownTo={0.94}
          hapticStyle="selection"
          style={[
            styles.tabItem,
            activeTab === 'sand' && {
              backgroundColor: colors.primary.default,
              shadowColor: colors.primary.default,
              shadowOpacity: 0.25,
              shadowRadius: 6,
              elevation: 3,
            },
          ]}
        >
          <Text style={[styles.tabEmoji]}>🪨</Text>
          <Text
            style={[
              styles.tabTitle,
              { color: activeTab === 'sand' ? '#FFFFFF' : colors.text.secondary },
              activeTab === 'sand' && { fontWeight: '700' },
            ]}
          >
            Zen Sand
          </Text>
        </TactilePressable>

        <TactilePressable
          onPress={() => setActiveTab('pet')}
          scaleDownTo={0.94}
          hapticStyle="selection"
          style={[
            styles.tabItem,
            activeTab === 'pet' && {
              backgroundColor: colors.primary.default,
              shadowColor: colors.primary.default,
              shadowOpacity: 0.25,
              shadowRadius: 6,
              elevation: 3,
            },
          ]}
        >
          <Text style={[styles.tabEmoji]}>🐾</Text>
          <Text
            style={[
              styles.tabTitle,
              { color: activeTab === 'pet' ? '#FFFFFF' : colors.text.secondary },
              activeTab === 'pet' && { fontWeight: '700' },
            ]}
          >
            Cozy Pet
          </Text>
        </TactilePressable>
      </View>

      {/* Active Mini-Game View */}
      <View style={[styles.gameView, { paddingBottom: Math.max(insets.bottom + 8, 22) }]}>
        {activeTab === 'bubbles' && <BubblePopGame />}
        {activeTab === 'sand' && <ZenSandGardenGame />}
        {activeTab === 'pet' && <BreathingCompanionGame />}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  soundToggle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 18,
    marginVertical: 6,
    padding: 4,
    borderRadius: 22,
    borderWidth: 1,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 18,
    gap: 6,
  },
  tabEmoji: {
    fontSize: 16,
  },
  tabTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  gameView: {
    flex: 1,
    paddingBottom: 20,
  },
});

