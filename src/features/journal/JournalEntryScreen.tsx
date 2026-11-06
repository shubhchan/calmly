import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { Alert } from '../../services/appAlert';
import { useNavigation, useRoute, NavigationProp, RouteProp } from '@react-navigation/native';
import {
  Card,
  CardContent,
  PrimaryButton,
  AppIcon,
  JournalReflectionIllustration,
  ScreenHeader,
  TactilePressable,
} from '../../components';
import type { AppIconName } from '../../components';
import { RootStackParamList, JournalType } from '../../types/navigation';
import { useAppTheme } from '../../theme/ThemeContext';
import { journalRepository } from '../../database/repositories/journalRepository';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { PopIn } from '../../components/interactive/PopIn';
import { FormSkeleton } from '../../components/interactive/LoadingState';
import Animated from 'react-native-reanimated';
import { sharedElementStyle, sharedHeroStyle, sharedTransitionTags } from '../../theme/sharedTransitions';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { NoteAttachment } from '../../types/attachment';
import { persistAttachmentFile } from '../../utils/attachmentStorage';
import { MediaAttachmentGrid } from '../../components/journal/MediaAttachmentGrid';
import { AudioAttachmentPlayer } from '../../components/journal/AudioAttachmentPlayer';
import { VideoAttachmentCard } from '../../components/journal/VideoAttachmentCard';
import { DocumentAttachmentCard } from '../../components/journal/DocumentAttachmentCard';
import { ImageLightboxModal } from '../../components/journal/ImageLightboxModal';
import { AudioRecorderModal } from '../../components/journal/AudioRecorderModal';
import { hapticFeedback } from '../../utils/haptics';

const journalTypeLabels: Record<JournalType, string> = {
  free: 'Free writing',
  daily_reflection: 'Daily reflection',
  gratitude: 'Gratitude',
  stress: 'Stress release',
  sleep: 'Sleep journal',
  morning: 'Morning pages',
  evening: 'Evening unwind',
  brain_dump: 'Brain dump',
};

const journalTypeIcons: Record<JournalType, AppIconName> = {
  free: 'l-write',
  daily_reflection: 'i-sun',
  gratitude: 'l-gift',
  stress: 'l-pulse',
  sleep: 'i-moon',
  morning: 'i-sun',
  evening: 'i-moon',
  brain_dump: 'i-bulb',
};

export function JournalEntryScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'JournalEntry'>>();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const params = (route as any)?.params ?? {};
  const rawType = (params as any)?.type;
  const type: JournalType = (rawType && (journalTypeLabels as any)[rawType] ? rawType : 'free') as JournalType;
  const id = (params as any)?.id ?? undefined;
  const preview = (params as any)?.preview;
  const isEditing = !!id;
  const typeIcon: AppIconName = (journalTypeIcons as any)?.[type] ?? 'l-write';
  const typeLabel = (journalTypeLabels as any)?.[type] ?? (typeof type === 'string' ? type : 'Entry');

  const [title, setTitle] = useState(preview?.title ?? '');
  const [content, setContent] = useState(preview?.body ?? '');
  const [isFavorite, setIsFavorite] = useState(!!preview?.favorite);
  const [attachments, setAttachments] = useState<NoteAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [attaching, setAttaching] = useState(false);

  // Modals
  const [recorderVisible, setRecorderVisible] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<NoteAttachment | null>(null);

  const { colors, isDark } = useAppTheme();

  // Load entry if editing
  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    const loadEntry = async () => {
      if (!preview) setLoading(true);
      try {
        const entry = await journalRepository.getById(id);
        if (entry && isMounted) {
          setTitle(entry.title || '');
          setContent(entry.body || '');
          setIsFavorite(!!entry.favorite);
          if (Array.isArray(entry.attachments)) {
            setAttachments(entry.attachments);
          }
        }
      } catch (err) {
        console.error('Failed to load entry:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadEntry();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const handlePickCamera = async () => {
    try {
      hapticFeedback.light();
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Camera Permission Required', 'Please enable camera access to take a photo for your note.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.85,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets?.[0]) {
        setAttaching(true);
        const asset = result.assets[0];
        const { uri, size } = await persistAttachmentFile(asset.uri, 'image', asset.fileName || 'Camera Photo.jpg');
        const newAttachment: NoteAttachment = {
          id: `att_cam_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          type: 'image',
          uri,
          name: asset.fileName || 'Camera Photo',
          size: size || asset.fileSize,
          mimeType: asset.mimeType || 'image/jpeg',
          createdAt: Date.now(),
        };
        setAttachments((prev) => [...prev, newAttachment]);
        hapticFeedback.success();
      }
    } catch (err) {
      console.error('Camera capture failed:', err);
      Alert.alert('Camera Error', 'Could not capture photo.');
    } finally {
      setAttaching(false);
    }
  };

  const handlePickMedia = async () => {
    try {
      hapticFeedback.light();
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsMultipleSelection: true,
        quality: 0.85,
      });

      if (!result.canceled && result.assets?.length > 0) {
        setAttaching(true);
        const newItems: NoteAttachment[] = [];
        for (const asset of result.assets) {
          const isVideo = asset.type === 'video';
          const mediaType = isVideo ? 'video' : 'image';
          const defaultName = isVideo ? 'Video Clip' : 'Photo';
          const { uri, size } = await persistAttachmentFile(
            asset.uri,
            mediaType,
            asset.fileName || `${defaultName}.${isVideo ? 'mp4' : 'jpg'}`
          );

          newItems.push({
            id: `att_med_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            type: mediaType,
            uri,
            name: asset.fileName || defaultName,
            size: size || asset.fileSize,
            mimeType: asset.mimeType,
            duration: asset.duration ? Math.round(asset.duration / 1000) : undefined,
            createdAt: Date.now(),
          });
        }
        setAttachments((prev) => [...prev, ...newItems]);
        hapticFeedback.success();
      }
    } catch (err) {
      console.error('Media picker failed:', err);
      Alert.alert('Media Error', 'Could not attach selected media.');
    } finally {
      setAttaching(false);
    }
  };

  const handlePickDocument = async () => {
    try {
      hapticFeedback.light();
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        setAttaching(true);
        const asset = result.assets[0];
        const { uri, size } = await persistAttachmentFile(asset.uri, 'document', asset.name);
        const newAttachment: NoteAttachment = {
          id: `att_doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          type: 'document',
          uri,
          name: asset.name || 'Document',
          size: size || asset.size,
          mimeType: asset.mimeType,
          createdAt: Date.now(),
        };
        setAttachments((prev) => [...prev, newAttachment]);
        hapticFeedback.success();
      }
    } catch (err) {
      console.error('Document picker failed:', err);
      Alert.alert('Document Error', 'Could not attach selected file.');
    } finally {
      setAttaching(false);
    }
  };

  const handleRemoveAttachment = (attachmentId: string) => {
    hapticFeedback.selection();
    setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
  };

  const handleSave = async () => {
    const trimmedTitle = (title || '').trim();
    const trimmedContent = (content || '').trim();

    if (!trimmedContent && !trimmedTitle && attachments.length === 0) {
      Alert.alert('Empty reflection', 'Please add your thoughts or attach a photo/memo before saving.');
      return;
    }

    setSaving(true);
    try {
      if (isEditing && id) {
        await journalRepository.update(id, {
          title: trimmedTitle,
          body: trimmedContent,
          favorite: isFavorite,
          attachments,
        });
      } else {
        await journalRepository.create({
          type,
          title: trimmedTitle,
          body: trimmedContent,
          favorite: isFavorite,
          attachments,
        });
      }
      navigation.goBack();
    } catch (err) {
      console.error('Failed to save reflection:', err);
      Alert.alert('Save Error', 'Could not save your reflection. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!id) return;
    Alert.alert(
      'Delete reflection?',
      'This entry will be permanently removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            try {
              await journalRepository.delete(id);
              navigation.goBack();
            } catch (err) {
              console.error('Failed to delete entry:', err);
              Alert.alert('Error', 'Could not delete entry.');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const imageAttachments = attachments.filter((a) => a.type === 'image');
  const audioAttachments = attachments.filter((a) => a.type === 'audio');
  const videoAttachments = attachments.filter((a) => a.type === 'video');
  const docAttachments = attachments.filter((a) => a.type === 'document');

  return (
    <ScreenContainer animate={false} scroll={false} backgroundColor={colors.background.default}>
      <PopIn index={0}>
        <ScreenHeader
          title={isEditing ? 'Edit Reflection' : 'New Reflection'}
          right={
            isEditing ? (
              <TactilePressable onPress={handleDelete} hitSlop={8} style={{ padding: 4 }}>
                <Ionicons name="trash-outline" size={22} color="#EB697F" />
              </TactilePressable>
            ) : undefined
          }
        />
      </PopIn>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 110 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Visual Zen Header Card */}
        <View
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 12,
            marginBottom: 16,
          }}
        >
          <Animated.View
            sharedTransitionTag={sharedTransitionTags.journalReflectionHero}
            sharedTransitionStyle={sharedHeroStyle}
          >
            <JournalReflectionIllustration width={150} height={120} />
          </Animated.View>
        </View>

        {loading ? (
          <FormSkeleton fields={2} />
        ) : (
          <Card variant="elevated" style={{ marginBottom: 20 }}>
            <CardContent style={{ padding: 20 }}>
              {/* Type Header Pill */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <Animated.View
                  sharedTransitionTag={
                    id
                      ? sharedTransitionTags.journalEntryIcon(id)
                      : sharedTransitionTags.journalTemplateIcon(type)
                  }
                  sharedTransitionStyle={sharedElementStyle}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: colors.primary.subtle,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: colors.primary.subtleBorder,
                  }}
                >
                  <AppIcon name={typeIcon} size={20} color={colors.primary.default} />
                </Animated.View>
                <View style={{ marginLeft: 12 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text.primary }}>
                    {typeLabel}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.text.tertiary }}>
                    {isEditing ? 'Tap below to modify' : 'Safe & private offline notes'}
                  </Text>
                </View>
              </View>

              {/* Title input */}
              <TextInput
                placeholder="Title (optional)"
                placeholderTextColor={colors.text.tertiary}
                value={title}
                onChangeText={setTitle}
                style={{
                  fontSize: 18,
                  fontWeight: '700',
                  color: colors.text.primary,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border.default,
                  paddingBottom: 10,
                  marginBottom: 14,
                }}
              />

              {/* Content input */}
              <TextInput
                multiline
                numberOfLines={8}
                placeholder="What thoughts or feelings are present for you right now?"
                placeholderTextColor={colors.text.tertiary}
                value={content}
                onChangeText={setContent}
                style={{
                  fontSize: 16,
                  lineHeight: 24,
                  color: colors.text.primary,
                  minHeight: 140,
                  textAlignVertical: 'top',
                  paddingTop: 4,
                }}
              />

              {/* Attached Media Previews */}
              {attachments.length > 0 ? (
                <View style={styles.attachmentsSection}>
                  <Text style={[styles.attachmentsHeading, { color: colors.text.secondary }]}>
                    Attached Media ({attachments.length})
                  </Text>

                  {/* Photo Collage */}
                  {imageAttachments.length > 0 ? (
                    <MediaAttachmentGrid
                      attachments={imageAttachments}
                      onPressImage={(img) => setLightboxImage(img)}
                      onRemove={handleRemoveAttachment}
                      editable
                    />
                  ) : null}

                  {/* Voice Memos */}
                  {audioAttachments.map((aud) => (
                    <AudioAttachmentPlayer
                      key={aud.id}
                      attachment={aud}
                      onRemove={() => handleRemoveAttachment(aud.id)}
                      editable
                    />
                  ))}

                  {/* Videos */}
                  {videoAttachments.map((vid) => (
                    <VideoAttachmentCard
                      key={vid.id}
                      attachment={vid}
                      onRemove={() => handleRemoveAttachment(vid.id)}
                      editable
                    />
                  ))}

                  {/* Documents */}
                  {docAttachments.map((doc) => (
                    <DocumentAttachmentCard
                      key={doc.id}
                      attachment={doc}
                      onRemove={() => handleRemoveAttachment(doc.id)}
                      editable
                    />
                  ))}
                </View>
              ) : null}

              {/* Attaching Indicator */}
              {attaching ? (
                <View style={styles.attachingRow}>
                  <ActivityIndicator size="small" color={colors.primary.default} />
                  <Text style={[styles.attachingText, { color: colors.text.tertiary }]}>
                    Saving attachment...
                  </Text>
                </View>
              ) : null}

              {/* Multi-Media Attachment Dock */}
              <View style={[styles.mediaToolbar, { borderTopColor: colors.border.default }]}>
                <Text style={[styles.toolbarTitle, { color: colors.text.tertiary }]}>Attach</Text>
                <View style={styles.toolbarButtons}>
                  {/* Camera */}
                  <TactilePressable
                    onPress={handlePickCamera}
                    disabled={attaching}
                    style={[
                      styles.dockBtn,
                      {
                        backgroundColor: colors.primary.subtle,
                        borderColor: colors.primary.subtleBorder,
                      },
                    ]}
                  >
                    <Ionicons name="camera-outline" size={17} color={colors.primary.default} />
                    <Text style={[styles.dockBtnText, { color: colors.primary.default }]}>Camera</Text>
                  </TactilePressable>

                  {/* Photos / Video */}
                  <TactilePressable
                    onPress={handlePickMedia}
                    disabled={attaching}
                    style={[
                      styles.dockBtn,
                      {
                        backgroundColor: colors.primary.subtle,
                        borderColor: colors.primary.subtleBorder,
                      },
                    ]}
                  >
                    <Ionicons name="images-outline" size={17} color={colors.primary.default} />
                    <Text style={[styles.dockBtnText, { color: colors.primary.default }]}>Media</Text>
                  </TactilePressable>

                  {/* Voice Note */}
                  <TactilePressable
                    onPress={() => {
                      hapticFeedback.light();
                      setRecorderVisible(true);
                    }}
                    disabled={attaching}
                    style={[
                      styles.dockBtn,
                      {
                        backgroundColor: colors.primary.subtle,
                        borderColor: colors.primary.subtleBorder,
                      },
                    ]}
                  >
                    <Ionicons name="mic-outline" size={17} color={colors.primary.default} />
                    <Text style={[styles.dockBtnText, { color: colors.primary.default }]}>Voice</Text>
                  </TactilePressable>

                  {/* Document */}
                  <TactilePressable
                    onPress={handlePickDocument}
                    disabled={attaching}
                    style={[
                      styles.dockBtn,
                      {
                        backgroundColor: colors.primary.subtle,
                        borderColor: colors.primary.subtleBorder,
                      },
                    ]}
                  >
                    <Ionicons name="attach-outline" size={17} color={colors.primary.default} />
                    <Text style={[styles.dockBtnText, { color: colors.primary.default }]}>Doc</Text>
                  </TactilePressable>
                </View>
              </View>

              {/* Bottom Actions Row */}
              <View
                style={{
                  marginTop: 14,
                  paddingTop: 12,
                  borderTopWidth: 1,
                  borderTopColor: colors.border.default,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                }}
              >
                <TactilePressable
                  onPress={() => setIsFavorite(!isFavorite)}
                  hapticStyle="selection"
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    borderRadius: 9999,
                    backgroundColor: isFavorite ? '#FDF1F4' : colors.primary.subtle,
                  }}
                >
                  <Ionicons
                    name={isFavorite ? 'heart' : 'heart-outline'}
                    size={16}
                    color={isFavorite ? '#DB3A60' : colors.text.tertiary}
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: isFavorite ? '#DB3A60' : colors.text.tertiary,
                    }}
                  >
                    {isFavorite ? 'Favorited' : 'Favorite'}
                  </Text>
                </TactilePressable>
              </View>
            </CardContent>
          </Card>
        )}

        {/* Buttons */}
        <PopIn index={3}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <PrimaryButton
              title={saving ? 'Saving...' : 'Save Reflection'}
              variant="primary"
              size="lg"
              onPress={handleSave}
              disabled={saving || loading || attaching}
              style={{ flex: 2 }}
              fullWidth={false}
            />
            <PrimaryButton
              title="Cancel"
              variant="outline"
              size="lg"
              onPress={() => navigation?.goBack?.()}
              disabled={saving}
              style={{ flex: 1 }}
              fullWidth={false}
            />
          </View>
        </PopIn>
      </ScrollView>

      {/* Voice Note Recorder Modal */}
      <AudioRecorderModal
        visible={recorderVisible}
        onClose={() => setRecorderVisible(false)}
        onSaved={(attachment) => {
          setAttachments((prev) => [...prev, attachment]);
        }}
      />

      {/* Fullscreen Photo Lightbox Modal */}
      <ImageLightboxModal
        attachment={lightboxImage}
        onClose={() => setLightboxImage(null)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  attachmentsSection: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.15)',
  },
  attachmentsHeading: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  attachingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  attachingText: {
    fontSize: 12,
  },
  mediaToolbar: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  toolbarTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  toolbarButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  dockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  dockBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
