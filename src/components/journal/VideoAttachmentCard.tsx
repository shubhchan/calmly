import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEvent, useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { setAudioModeAsync } from 'expo-audio';
import { NoteAttachment } from '../../types/attachment';
import { hapticFeedback } from '../../utils/haptics';

interface VideoAttachmentCardProps {
  attachment: NoteAttachment;
  /** Called when the viewer taps the video, so the page can show its edit buttons. */
  onSelect?: () => void;
}

/**
 * A video memory with no card chrome: the clip fills the block, and the page
 * shows floating edit buttons while the clip is selected.
 */
export function VideoAttachmentCard({ attachment, onSelect }: VideoAttachmentCardProps) {
  // Playback mode must be restored after recording a voice memo. Recording leaves
  // the audio session routed to the earpiece, which makes video sound inaudible.
  useEffect(() => {
    setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => {});
  }, []);

  const player = useVideoPlayer(attachment.uri, (p) => {
    p.loop = false;
    p.muted = false;
    p.volume = 1;
    p.timeUpdateEventInterval = 0.25;
  });

  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });
  const [currentTime, setCurrentTime] = useState(0);
  useEventListener(player, 'timeUpdate', ({ currentTime: t }) => setCurrentTime(t));

  const duration = player.duration > 0 ? player.duration : attachment.duration || 0;
  const progress = duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;

  const handlePress = useCallback(() => {
    hapticFeedback.selection();
    if (isPlaying) {
      player.pause();
    } else {
      // Recover sound if a previous recording muted or rerouted playback.
      if (player.muted) player.muted = false;
      if (player.volume < 1) player.volume = 1;
      player.play();
    }
    onSelect?.();
  }, [isPlaying, onSelect, player]);

  return (
    <View style={styles.wrapper}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="contain"
        nativeControls={false}
        accessibilityLabel={attachment.name || 'Video memory'}
      />

      {/* Tap target: plays or pauses, and reveals the page's edit buttons. */}
      <Pressable
        onPress={handlePress}
        style={StyleSheet.absoluteFill}
        accessibilityRole="button"
        accessibilityLabel={`${attachment.name || 'Video'}. Tap to play or pause.`}
      />

      {!isPlaying ? (
        <View pointerEvents="none" style={styles.centerPlay}>
          <Ionicons name="play" size={20} color="#FFFFFF" style={{ marginLeft: 2 }} />
        </View>
      ) : null}

      {isPlaying || progress > 0 ? (
        <View pointerEvents="none" style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  centerPlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 44,
    height: 44,
    marginTop: -22,
    marginLeft: -22,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  progressTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
});
