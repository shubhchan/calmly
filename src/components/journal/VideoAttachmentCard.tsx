import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useAppTheme } from '../../theme/ThemeContext';
import { TactilePressable } from '../interactive/TactilePressable';
import { NoteAttachment } from '../../types/attachment';
import { formatAudioDuration, formatFileSize } from '../../utils/attachmentStorage';

interface VideoAttachmentCardProps {
  attachment: NoteAttachment;
  onRemove?: () => void;
  editable?: boolean;
}

export function VideoAttachmentCard({
  attachment,
  onRemove,
  editable = false,
}: VideoAttachmentCardProps) {
  const { colors, isDark } = useAppTheme();

  const player = useVideoPlayer(attachment.uri, (p) => {
    p.loop = false;
  });

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
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Ionicons name="videocam-outline" size={18} color={colors.primary.default} />
          <Text style={[styles.nameText, { color: colors.text.primary }]} numberOfLines={1}>
            {attachment.name || 'Video Memory'}
          </Text>
        </View>

        <View style={styles.headerRight}>
          {attachment.duration ? (
            <Text style={[styles.durationBadge, { color: colors.text.tertiary }]}>
              {formatAudioDuration(attachment.duration)}
            </Text>
          ) : null}

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

      <View style={styles.videoWrapper}>
        <VideoView
          player={player}
          style={styles.videoPlayer}
          contentFit="cover"
          nativeControls
        />
      </View>

      {attachment.size ? (
        <Text style={[styles.sizeText, { color: colors.text.tertiary }]}>
          {formatFileSize(attachment.size)}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
    marginVertical: 6,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  nameText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  durationBadge: {
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoWrapper: {
    height: 190,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  sizeText: {
    fontSize: 11,
    marginTop: 6,
    textAlign: 'right',
  },
});
