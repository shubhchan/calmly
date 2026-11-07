import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Button, TactilePressable } from '../../components';
import { useAppTheme } from '../../theme/ThemeContext';
import { soundService } from '../../services/soundService';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { RootStackParamList } from '../../types/navigation';
import { hapticFeedback } from '../../utils/haptics';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface TrackConfig {
  id: 'rain' | 'ocean' | 'birds' | 'night';
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}

const TRACKS: TrackConfig[] = [
  { id: 'rain', title: 'Rain on leaves', subtitle: 'Steady, close, warm', icon: 'rainy-outline' },
  { id: 'ocean', title: 'Ocean waves', subtitle: 'Slow tide, long breath', icon: 'water-outline' },
  { id: 'birds', title: 'Forest breeze', subtitle: 'Leaves and distant birds', icon: 'leaf-outline' },
  { id: 'night', title: 'Deep night', subtitle: 'Low hum for sleep', icon: 'moon-outline' },
];

const TIMERS = ['Off', '15m', '30m', '60m', '90m'];

const BAR_HEIGHTS = [7, 14, 24, 32, 22, 38, 26, 44, 30, 20, 34, 26, 16, 28, 38, 22, 12, 18];

/**
 * Soundscapes — direction A, "Mixer".
 *
 * One dark now-playing card, then a short list of single sounds, one volume
 * line, and a sleep timer. Nothing plays until you choose it.
 */
export function SoundscapesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useAppTheme();

  const [activeSound, setActiveSound] = useState<string | null>(null);
  const [selectedTimer, setSelectedTimer] = useState('Off');
  const [volume, setVolume] = useState(0.8);

  useEffect(() => {
    const unsubscribe = soundService.addListener((state) => setActiveSound(state.activeTrack));
    return unsubscribe;
  }, []);

  const toggleSound = async (id: TrackConfig['id']) => {
    hapticFeedback.selection();
    if (activeSound === id) {
      await soundService.stop();
    } else {
      await soundService.play(id);
    }
  };

  const changeTimer = (timer: string) => {
    hapticFeedback.selection();
    setSelectedTimer(timer);
    soundService.setTimer(timer === 'Off' ? 0 : parseInt(timer, 10));
  };

  const changeVolume = async (next: number) => {
    setVolume(next);
    await soundService.setVolume(next);
  };

  const activeTrack = TRACKS.find((track) => track.id === activeSound) ?? null;

  return (
    <ScreenContainer
      contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 40 }}
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
          Soundscapes
        </AppText>
        <TactilePressable
          onPress={() => changeTimer(selectedTimer === 'Off' ? '30m' : 'Off')}
          scaleDownTo={0.9}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={selectedTimer === 'Off' ? 'Start a 30 minute timer' : 'Turn off timer'}
          style={{ width: 36, alignItems: 'flex-end' }}
        >
          <Ionicons
            name={selectedTimer === 'Off' ? 'timer-outline' : 'timer'}
            size={19}
            color={selectedTimer === 'Off' ? colors.text.secondary : colors.primary.default}
          />
        </TactilePressable>
      </View>

      {/* Now playing */}
      <View
        style={{
          marginTop: 16,
          backgroundColor: colors.primary.default,
          borderRadius: 24,
          padding: 22,
        }}
      >
        <AppText variant="overline" color={colors.primary.foreground} style={{ opacity: 0.7 }}>
          {activeTrack ? 'Now playing' : 'Quiet right now'}
        </AppText>
        <AppText
          variant="h2"
          color={colors.primary.foreground}
          style={{ marginTop: 8, maxWidth: 240 }}
        >
          {activeTrack ? activeTrack.title : 'Choose a sound'}
        </AppText>
        <AppText
          variant="caption"
          color={colors.primary.foreground}
          style={{ marginTop: 6, opacity: 0.7 }}
        >
          {activeTrack
            ? selectedTimer === 'Off'
              ? 'Looping · no timer'
              : `Looping · ${selectedTimer} left`
            : `${TRACKS.length} sounds, one at a time`}
        </AppText>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 18,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 46 }}>
            {BAR_HEIGHTS.map((height, index) => (
              <View
                key={index}
                style={{
                  width: 3,
                  height,
                  borderRadius: 2,
                  backgroundColor: colors.primary.foreground,
                  opacity: activeTrack ? (index > 12 ? 0.35 : 0.8) : 0.18,
                }}
              />
            ))}
          </View>
          <TactilePressable
            onPress={() => {
              if (activeTrack) {
                hapticFeedback.light();
                soundService.stop();
              } else {
                toggleSound('rain');
              }
            }}
            scaleDownTo={0.92}
            accessibilityRole="button"
            accessibilityLabel={activeTrack ? 'Pause sound' : 'Play rain'}
            style={{
              width: 58,
              height: 58,
              borderRadius: 29,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.primary.foreground,
            }}
          >
            <Ionicons
              name={activeTrack ? 'pause' : 'play'}
              size={20}
              color={colors.primary.default}
            />
          </TactilePressable>
        </View>
      </View>

      {/* Sounds */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginTop: 24,
          marginBottom: 4,
        }}
      >
        <AppText variant="bodySmall" tone="secondary" style={{ fontWeight: '600' }}>
          Sounds
        </AppText>
        <AppText variant="caption" tone="tertiary">
          one at a time
        </AppText>
      </View>

      <View
        style={{
          backgroundColor: colors.surface.default,
          borderRadius: 18,
          paddingHorizontal: 16,
          paddingVertical: 4,
        }}
      >
        {TRACKS.map((track, index) => {
          const isPlaying = activeSound === track.id;
          return (
            <TactilePressable
              key={track.id}
              onPress={() => toggleSound(track.id)}
              scaleDownTo={0.99}
              accessibilityRole="button"
              accessibilityState={{ selected: isPlaying }}
              accessibilityLabel={`${isPlaying ? 'Pause' : 'Play'} ${track.title}`}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 13,
                paddingVertical: 12,
                borderBottomWidth: index === TRACKS.length - 1 ? 0 : 1,
                borderBottomColor: colors.border.subtle,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isPlaying ? colors.primary.subtle : colors.surface.muted,
                }}
              >
                <Ionicons
                  name={track.icon}
                  size={17}
                  color={isPlaying ? colors.primary.default : colors.text.secondary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="title" numberOfLines={1}>
                  {track.title}
                </AppText>
                <AppText variant="caption" tone="tertiary" style={{ marginTop: 1 }}>
                  {track.subtitle}
                </AppText>
              </View>
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={16}
                color={isPlaying ? colors.primary.default : colors.text.tertiary}
              />
            </TactilePressable>
          );
        })}
      </View>

      {/* Volume */}
      <View style={{ marginTop: 26 }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 12,
          }}
        >
          <AppText variant="bodySmall" tone="secondary" style={{ fontWeight: '600' }}>
            Volume
          </AppText>
          <AppText variant="caption" tone="tertiary">
            {Math.round(volume * 100)}%
          </AppText>
        </View>
        <VolumeSlider value={volume} onChange={changeVolume} />
      </View>

      {/* Sleep timer */}
      <View style={{ marginTop: 28 }}>
        <AppText variant="bodySmall" tone="secondary" style={{ fontWeight: '600', marginBottom: 10 }}>
          Sleep timer
        </AppText>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {TIMERS.map((timer) => {
            const selected = selectedTimer === timer;
            return (
              <TactilePressable
                key={timer}
                onPress={() => changeTimer(timer)}
                scaleDownTo={0.94}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={timer === 'Off' ? 'No timer' : `Stop after ${timer}`}
                style={{
                  flex: 1,
                  height: 38,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: selected ? colors.primary.default : colors.surface.muted,
                }}
              >
                <AppText
                  variant="caption"
                  color={selected ? colors.primary.foreground : colors.text.secondary}
                >
                  {timer}
                </AppText>
              </TactilePressable>
            );
          })}
        </View>
      </View>

      {activeTrack ? (
        <Button
          title="Stop sound"
          variant="ghost"
          size="sm"
          onPress={() => soundService.stop()}
          style={{ marginTop: 26 }}
        />
      ) : null}
    </ScreenContainer>
  );
}

/** Ten quiet zones on one line, same rhythm as the check-in strength slider. */
function VolumeSlider({ value, onChange }: { value: number; onChange: (next: number) => void }) {
  const { colors } = useAppTheme();
  const percent = `${Math.round(value * 100)}%` as const;

  return (
    <View style={{ height: 22, justifyContent: 'center' }}>
      <View style={{ height: 4, borderRadius: 2, backgroundColor: colors.surface.muted }}>
        <View style={{ width: percent, height: 4, borderRadius: 2, backgroundColor: colors.primary.default }} />
      </View>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: percent,
          marginLeft: -8,
          width: 16,
          height: 16,
          borderRadius: 8,
          backgroundColor: colors.surface.default,
          borderWidth: 2,
          borderColor: colors.primary.default,
        }}
      />
      <View style={{ position: 'absolute', left: 0, right: 0, flexDirection: 'row' }}>
        {Array.from({ length: 10 }, (_, index) => index + 1).map((step) => (
          <TactilePressable
            key={step}
            onPress={() => {
              hapticFeedback.selection();
              onChange(step / 10);
            }}
            hapticStyle="none"
            scaleDownTo={1}
            accessibilityRole="adjustable"
            accessibilityLabel={`Volume ${step * 10} percent`}
            style={{ flex: 1, height: 22 }}
          />
        ))}
      </View>
    </View>
  );
}
