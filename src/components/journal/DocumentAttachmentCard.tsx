import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Alert } from '../../services/appAlert';
import { Ionicons } from '@expo/vector-icons';
import { isAvailableAsync, shareAsync } from 'expo-sharing';
import { useAppTheme } from '../../theme/ThemeContext';
import { TactilePressable } from '../interactive/TactilePressable';
import { NoteAttachment } from '../../types/attachment';
import { formatFileSize } from '../../utils/attachmentStorage';
import { hapticFeedback } from '../../utils/haptics';

interface DocumentAttachmentCardProps {
  attachment: NoteAttachment;
  onRemove?: () => void;
  editable?: boolean;
}

export function DocumentAttachmentCard({
  attachment,
  onRemove,
  editable = false,
}: DocumentAttachmentCardProps) {
  const { colors, isDark } = useAppTheme();

  const handleOpenDocument = async () => {
    try {
      hapticFeedback.selection();
      const available = await isAvailableAsync();
      if (!available) {
        Alert.alert('Sharing Unavailable', 'Your device does not support document sharing.');
        return;
      }
      await shareAsync(attachment.uri, {
        dialogTitle: attachment.name || 'Open Document',
      });
    } catch (err) {
      console.error('Failed to open document:', err);
      Alert.alert('Error', 'Could not open or share this document.');
    }
  };

  const isPdf = (attachment.name || '').toLowerCase().endsWith('.pdf');

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? '#1E293B' : colors.surface.default,
          borderColor: colors.border.default,
        },
      ]}
    >
      <View style={styles.contentRow}>
        {/* Document Icon Circle */}
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: isPdf ? 'rgba(235, 105, 127, 0.12)' : colors.primary.subtle,
              borderColor: isPdf ? 'rgba(235, 105, 127, 0.3)' : colors.primary.subtleBorder,
            },
          ]}
        >
          <Ionicons
            name={isPdf ? 'document-text' : 'document-outline'}
            size={22}
            color={isPdf ? '#EB697F' : colors.primary.default}
          />
        </View>

        {/* Name and Size */}
        <View style={styles.textContainer}>
          <Text style={[styles.nameText, { color: colors.text.primary }]} numberOfLines={1}>
            {attachment.name || 'Document'}
          </Text>
          <Text style={[styles.sizeText, { color: colors.text.tertiary }]}>
            {formatFileSize(attachment.size)}
          </Text>
        </View>

        {/* Action: Open/Share */}
        <TactilePressable
          onPress={handleOpenDocument}
          scaleDownTo={0.92}
          style={[
            styles.openBtn,
            { backgroundColor: colors.primary.subtle, borderColor: colors.primary.subtleBorder },
          ]}
        >
          <Ionicons name="share-outline" size={16} color={colors.primary.default} style={{ marginRight: 4 }} />
          <Text style={[styles.openBtnText, { color: colors.primary.default }]}>Open</Text>
        </TactilePressable>

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
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  nameText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sizeText: {
    fontSize: 12,
    marginTop: 2,
  },
  openBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  openBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
