import React from 'react';
import { View, Image, Text, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NoteAttachment } from '../../types/attachment';
import { TactilePressable } from '../interactive/TactilePressable';

interface MediaAttachmentGridProps {
  attachments: NoteAttachment[]; // image attachments
  onPressImage: (attachment: NoteAttachment) => void;
  onRemove?: (attachmentId: string) => void;
  editable?: boolean;
}

export function MediaAttachmentGrid({
  attachments,
  onPressImage,
  onRemove,
  editable = false,
}: MediaAttachmentGridProps) {
  if (!attachments || attachments.length === 0) return null;

  const count = attachments.length;

  // Single Photo Layout
  if (count === 1) {
    const item = attachments[0];
    return (
      <View style={styles.container}>
        <TactilePressable
          onPress={() => onPressImage(item)}
          scaleDownTo={0.98}
          style={styles.singleImageContainer}
        >
          <Image source={{ uri: item.uri }} style={styles.singleImage} resizeMode="cover" />
          {editable && onRemove ? (
            <TactilePressable
              onPress={() => onRemove(item.id)}
              hitSlop={8}
              style={styles.deleteBadge}
            >
              <Ionicons name="close" size={14} color="#FFFFFF" />
            </TactilePressable>
          ) : null}
        </TactilePressable>
      </View>
    );
  }

  // 2 Photos Layout (Side by Side)
  if (count === 2) {
    return (
      <View style={[styles.container, styles.row]}>
        {attachments.map((item) => (
          <TactilePressable
            key={item.id}
            onPress={() => onPressImage(item)}
            scaleDownTo={0.97}
            style={styles.halfImageContainer}
          >
            <Image source={{ uri: item.uri }} style={styles.halfImage} resizeMode="cover" />
            {editable && onRemove ? (
              <TactilePressable
                onPress={() => onRemove(item.id)}
                hitSlop={8}
                style={styles.deleteBadge}
              >
                <Ionicons name="close" size={14} color="#FFFFFF" />
              </TactilePressable>
            ) : null}
          </TactilePressable>
        ))}
      </View>
    );
  }

  // 3+ Photos Layout (Grid)
  const displayItems = attachments.slice(0, 4);
  const remainingCount = count - 4;

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {displayItems.map((item, index) => {
          const isLastAndMore = index === 3 && remainingCount > 0;
          return (
            <TactilePressable
              key={item.id}
              onPress={() => onPressImage(item)}
              scaleDownTo={0.97}
              style={styles.gridCell}
            >
              <Image source={{ uri: item.uri }} style={styles.gridImage} resizeMode="cover" />

              {isLastAndMore ? (
                <View style={styles.moreOverlay}>
                  <Text style={styles.moreText}>+{remainingCount + 1}</Text>
                </View>
              ) : null}

              {editable && onRemove && !isLastAndMore ? (
                <TactilePressable
                  onPress={() => onRemove(item.id)}
                  hitSlop={8}
                  style={styles.deleteBadge}
                >
                  <Ionicons name="close" size={14} color="#FFFFFF" />
                </TactilePressable>
              ) : null}
            </TactilePressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  singleImageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  singleImage: {
    width: '100%',
    height: '100%',
  },
  halfImageContainer: {
    flex: 1,
    height: 150,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  halfImage: {
    width: '100%',
    height: '100%',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridCell: {
    width: '48.5%',
    height: 120,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  moreOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  deleteBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
