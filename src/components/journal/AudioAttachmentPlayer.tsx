import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useAppTheme } from '../../theme/ThemeContext';
import { TactilePressable } from '../interactive/TactilePressable';
import { NoteAttachment } from '../../types/attachment';
import { formatAudioDuration, formatFileSize } from '../../utils/attachmentStorage';
import { hapticFeedback } from '../../utils/haptics';

interface AudioAttachmentPlayerProps {
  attachment: NoteAttachment;
  onRemove?: () => void;
  editable?: boolean;
}

export function AudioAttachmentPlayer({
  attachment,
  onRemove,
  editable = false,
}: AudioAttachmentPlayerProps) {
  const { colors, isDark } = useAppTheme();
  const player = useAudioPlayer(attachment.uri);
  const status = useAudioPlayerStatus(player);

  const isPlaying = status?.playing ?? false;
  const currentTime = status?.currentTime ?? 0;
  const totalDuration = status?.duration && status.duration > 0
    ? status.duration
    : attachment.duration || 0;

  const progressPercent = totalDuration > 0
    ? Math.min(100, Math.max(0, (currentTime / totalDuration) * 100))
    : 0;

  const handleTogglePlay = () => {
    hapticFeedback.selection();
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface.default,
          borderColor: colors.border.default,
        },
      ]}
    >
      <View style={styles.contentRow}>
        {/* Play/Pause Button */}
        <TactilePressable
          onPress={handleTogglePlay}
          scaleDownTo={0.9}
          style={[styles.playBtn, { backgroundColor: colors.primary.default }]}
        >
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={18}
            color={colors.primary.foreground}
            style={!isPlaying ? { marginLeft: 2 } : undefined}
          />
        </TactilePressable>

        {/* Info & Progress */}
        <View style={styles.metaContainer}>
          <View style={styles.titleRow}>
            <Text style={[styles.nameText, { color: colors.text.primary }]} numberOfLines={1}>
              {attachment.name || 'Voice Memo'}
            </Text>
            <Text style={[styles.durationText, { color: colors.text.tertiary }]}>
              {isPlaying
                ? `${formatAudioDuration(currentTime)} / ${formatAudioDuration(totalDuration)}`
                : formatAudioDuration(totalDuration)}
            </Text>
          </View>

          {/* Progress Bar */}
          <View style={[styles.progressBarTrack, { backgroundColor: colors.border.subtle }]}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${progressPercent}%`, backgroundColor: colors.primary.default },
              ]}
            />
          </View>

          {attachment.size ? (
            <Text style={[styles.fileSizeText, { color: colors.text.tertiary }]}>
              {formatFileSize(attachment.size)}
            </Text>
          ) : null}
        </View>

        {/* Remove Button if editable */}
        {editable && onRemove ? (
          <TactilePressable
            onPress={onRemove}
            hitSlop={8}
            scaleDownTo={0.88}
            style={[styles.removeBtn, { backgroundColor: isDark ? '#2A374A' : '#F1F5F9' }]}
          >
            <Ionicons name="trash-outline" size={16} color="#EB697F" />
          </TactilePressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginVertical: 4,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  nameText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  durationText: {
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  progressBarTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  fileSizeText: {
    fontSize: 11,
    marginTop: 4,
  },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
