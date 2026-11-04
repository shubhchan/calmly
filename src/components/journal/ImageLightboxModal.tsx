import React from 'react';
import {
  Modal,
  View,
  Image,
  Text,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TactilePressable } from '../interactive/TactilePressable';
import { NoteAttachment } from '../../types/attachment';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ImageLightboxModalProps {
  attachment: NoteAttachment | null;
  onClose: () => void;
}

export function ImageLightboxModal({ attachment, onClose }: ImageLightboxModalProps) {
  if (!attachment) return null;

  return (
    <Modal visible={!!attachment} transparent animationType="fade" onRequestClose={onClose}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          {/* Header Bar */}
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={1}>
              {attachment.name || 'Photo'}
            </Text>
            <TactilePressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TactilePressable>
          </View>

          {/* Full Image */}
          <View style={styles.imageWrapper}>
            <Image
              source={{ uri: attachment.uri }}
              style={styles.image}
              resizeMode="contain"
            />
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(10, 15, 25, 0.96)',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    flex: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.8,
  },
});
