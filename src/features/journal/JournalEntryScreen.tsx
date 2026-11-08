import React, { useState, useEffect } from 'react';
import { ActivityIndicator, ScrollView, TextInput, View, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { Alert } from '../../services/appAlert';
import { useNavigation, useRoute, NavigationProp, RouteProp } from '@react-navigation/native';
import { AppText, TactilePressable, Modal } from '../../components';
import { RootStackParamList, JournalType } from '../../types/navigation';
import { useAppTheme } from '../../theme/ThemeContext';
import { journalRepository } from '../../database/repositories/journalRepository';
import { Ionicons } from '@expo/vector-icons';
import { FormSkeleton } from '../../components/interactive/LoadingState';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
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
import { getDailyPrompt } from '../../utils/dailyPrompt';
import { fontFamilies } from '../../theme/typography';

const journalTypeLabels: Record<JournalType, string> = {
  free: 'Free write',
  daily_reflection: 'Daily reflection',
  gratitude: 'Gratitude',
  stress: 'Stress release',
  sleep: 'Sleep journal',
  morning: 'Morning pages',
  evening: 'Evening unwind',
  brain_dump: 'Brain dump',
};

const JOURNAL_TYPES_LIST: {
  id: JournalType;
  label: string;
  desc: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}[] = [
  { id: 'free', label: 'Free write', desc: 'A blank page with no prompts or goals', icon: 'create-outline' },
  { id: 'gratitude', label: 'Gratitude', desc: 'Three moments you want to keep', icon: 'heart-outline' },
  { id: 'daily_reflection', label: 'Daily reflection', desc: 'A gentle look back across today', icon: 'sunny-outline' },
  { id: 'stress', label: 'Stress release', desc: 'Set the weight down before sleep', icon: 'leaf-outline' },
  { id: 'sleep', label: 'Sleep journal', desc: 'Wind down and clear your mind', icon: 'moon-outline' },
  { id: 'morning', label: 'Morning pages', desc: 'Clear the cobwebs before the day starts', icon: 'cafe-outline' },
  { id: 'brain_dump', label: 'Brain dump', desc: 'Unfiltered flow, no rules or structure', icon: 'sparkles-outline' },
];

const MOOD_WORDS: { label: string; group: 'accent' | 'gold' | 'neutral' }[] = [
  { label: 'Tender', group: 'accent' },
  { label: 'Relieved', group: 'accent' },
  { label: 'Grateful', group: 'gold' },
  { label: 'At peace', group: 'accent' },
  { label: 'Quiet', group: 'neutral' },
  { label: 'Restless', group: 'neutral' },
  { label: 'Heavy', group: 'neutral' },
  { label: 'Hopeful', group: 'gold' },
];

/** Exact SVG icons from Doop "New page — A · Blank page" (n6PmK9J7dm) */
function CameraSvgIcon({ color = '#5C6B65' }: { color?: string }) {
  return (
    <Svg width={21} height={21} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="5" width="18" height="14" rx="3" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
      <Circle cx="12" cy="12" r="3.5" stroke={color} strokeWidth="1.7" />
      <Path d="M8 5l1-2h6l1 2" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
    </Svg>
  );
}

function MicSvgIcon({ color = '#5C6B65' }: { color?: string }) {
  return (
    <Svg width={21} height={21} viewBox="0 0 24 24" fill="none">
      <Rect x="9" y="3" width="6" height="11" rx="3" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
      <Path d="M5 11a7 7 0 0014 0M12 18v3" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
    </Svg>
  );
}

function MoodSvgIcon({ color = '#5C6B65' }: { color?: string }) {
  return (
    <Svg width={21} height={21} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.7" />
      <Path d="M8 14s1.5 2 4 2 4-2 4-2" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
      <Circle cx="9" cy="9" r="1.1" fill={color} />
      <Circle cx="15" cy="9" r="1.1" fill={color} />
    </Svg>
  );
}

function PromptSvgIcon({ color = '#5C6B65' }: { color?: string }) {
  return (
    <Svg width={21} height={21} viewBox="0 0 24 24" fill="none">
      <Path d="M7 7h10M7 12h10M7 17h6" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
    </Svg>
  );
}

/**
 * Journal entry screen — 1:1 implementation of Doop "New page — A · Blank page".
 *
 * Exact tokens:
 * - Background: #F4F5F1
 * - Header: Cancel (14px #5C6B65) | New page (14.5px 600 #1A2420) | Save (14px 600 #2C4F45)
 * - Date: Eyebrow (11px 600 uppercase #838F89) | Chip: Free write (28px height #E3ECE7 / #2C4F45)
 * - Title: Newsreader serif (24px #1A2420) with placeholder "A quieter evening than usual"
 * - Page: Ruled lines spaced 32px (#E9EDE7), placeholder "Start anywhere. No one else reads this." (#8A958F)
 * - Tool row: Camera, Mic, Mood face, Prompt icons (stroke #5C6B65 1.7) | Word count (#9AA5A0)
 * - Bottom action: "Insert today's prompt" button (52px radius 16 #E3ECE7, text #2C4F45)
 */
export function JournalEntryScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'JournalEntry'>>();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const topPad = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0, 10);

  const params = (route as any)?.params ?? {};
  const id = (params as any)?.id ?? undefined;
  const preview = (params as any)?.preview;
  const rawType = (params as any)?.type;
  const initialType: JournalType = (rawType && (journalTypeLabels as any)[rawType]
    ? rawType
    : preview?.type && (journalTypeLabels as any)[preview.type]
    ? preview.type
    : 'free') as JournalType;
  const isEditing = !!id;

  const [entryType, setEntryType] = useState<JournalType>(initialType);
  const [typePickerVisible, setTypePickerVisible] = useState(false);
  const [moodPickerVisible, setMoodPickerVisible] = useState(false);
  const [photoPickerVisible, setPhotoPickerVisible] = useState(false);
  const [entryCreatedAt, setEntryCreatedAt] = useState<number>(preview?.createdAt ?? Date.now());

  const typeLabel = (journalTypeLabels as any)?.[entryType] ?? 'Free write';
  const isGratitude = entryType === 'gratitude';

  const [title, setTitle] = useState<string>(preview?.title ?? '');
  const [content, setContent] = useState<string>(preview?.body ?? '');
  const [isFavorite, setIsFavorite] = useState(!!preview?.favorite);
  const [attachments, setAttachments] = useState<NoteAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [attaching, setAttaching] = useState(false);

  const [recorderVisible, setRecorderVisible] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<NoteAttachment | null>(null);

  const { colors, isDark } = useAppTheme();

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
          if (entry.createdAt) {
            setEntryCreatedAt(entry.createdAt);
          }
          if (entry.type && (journalTypeLabels as any)[entry.type]) {
            setEntryType(entry.type as JournalType);
          }
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
        Alert.alert('Camera access needed', 'Allow camera access to take a photo.');
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
      Alert.alert('Camera error', 'Could not capture the photo.');
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
      Alert.alert('Media error', 'Could not attach the selected media.');
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
      Alert.alert('File error', 'Could not attach the selected file.');
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
      Alert.alert('Nothing to save yet', 'Write a line or attach something first.');
      return;
    }

    setSaving(true);
    try {
      if (isEditing && id) {
        await journalRepository.update(id, {
          type: entryType,
          title: trimmedTitle,
          body: trimmedContent,
          favorite: isFavorite,
          attachments,
        });
      } else {
        await journalRepository.create({
          type: entryType,
          title: trimmedTitle,
          body: trimmedContent,
          favorite: isFavorite,
          attachments,
        });
      }
      navigation.goBack();
    } catch (err) {
      console.error('Failed to save reflection:', err);
      Alert.alert('Save error', 'Could not save this page. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!id) return;
    Alert.alert('Delete this page?', 'This entry is removed permanently.', [
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
            Alert.alert('Not deleted', 'Could not delete this page.');
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  const handleInsertPrompt = () => {
    hapticFeedback.selection();
    const prompt = getDailyPrompt();
    if (!prompt) return;
    setContent((prev) => (prev.trim() ? `${prev.replace(/\s+$/, '')}\n\n${prompt}` : prompt));
  };

  const handleMoodSelect = (word: string) => {
    hapticFeedback.selection();
    setMoodPickerVisible(false);
    setContent((prev) => {
      const stamp = `Feeling: ${word}.`;
      return prev.trim() ? `${prev.replace(/\s+$/, '')}\n\n${stamp}\n` : `${stamp}\n\n`;
    });
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const contentLines = content
    ? content.split('\n').reduce((total, line) => total + Math.max(1, Math.ceil(line.length / 32)), 0)
    : 0;
  const lineCount = Math.max(14, contentLines + 6);
  const pageHeight = lineCount * 32;

  const imageAttachments = attachments.filter((a) => a.type === 'image');
  const audioAttachments = attachments.filter((a) => a.type === 'audio');
  const videoAttachments = attachments.filter((a) => a.type === 'video');
  const docAttachments = attachments.filter((a) => a.type === 'document');

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.default }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={{ flex: 1, paddingTop: topPad }}>
        {/* Doop 1:1 Header: Cancel | New page | Save */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 24,
            height: 44,
            marginTop: 6,
          }}
        >
          <TactilePressable
            onPress={() => navigation?.goBack?.()}
            scaleDownTo={0.94}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            style={{ height: 44, justifyContent: 'center' }}
          >
            <AppText style={{ fontSize: 14, color: colors.text.secondary, fontWeight: '400' }}>Cancel</AppText>
          </TactilePressable>

          <AppText style={{ fontSize: 14.5, fontWeight: '600', color: colors.text.primary }}>
            {isEditing ? 'Your page' : 'New page'}
          </AppText>

          <TactilePressable
            onPress={handleSave}
            disabled={saving || loading || attaching}
            scaleDownTo={0.94}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Save page"
            style={{ height: 44, justifyContent: 'center' }}
          >
            <AppText
              style={{
                fontSize: 14,
                color: saving ? colors.text.tertiary : colors.primary.default,
                fontWeight: '600',
              }}
            >
              {saving ? 'Saving' : 'Save'}
            </AppText>
          </TactilePressable>
        </View>

        {/* Date & Category row */}
        <View
          style={{
            marginTop: 14,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 24,
          }}
        >
          <AppText
            style={{
              fontSize: 11,
              fontWeight: '600',
              letterSpacing: 1.32,
              textTransform: 'uppercase',
              color: colors.text.tertiary,
            }}
          >
            {format(new Date(entryCreatedAt), 'EEEE, d MMMM')}
          </AppText>

          <TactilePressable
            onPress={() => setTypePickerVisible(true)}
            scaleDownTo={0.94}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`Category: ${typeLabel}. Tap to change`}
            style={{
              height: 28,
              paddingHorizontal: 11,
              borderRadius: 999,
              backgroundColor: isGratitude ? (isDark ? 'rgba(176,138,79,0.2)' : '#F4EDE2') : colors.surface.selected,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <AppText
              style={{
                fontSize: 12.5,
                fontWeight: '600',
                color: isGratitude ? (isDark ? '#D2B078' : '#B08A4F') : colors.primary.default,
              }}
            >
              {typeLabel}
            </AppText>
            <Ionicons
              name="chevron-down"
              size={11}
              color={isGratitude ? (isDark ? '#D2B078' : '#B08A4F') : colors.primary.default}
            />
          </TactilePressable>
        </View>

        {/* Title — Newsreader display serif */}
        <TextInput
          placeholder="A quieter evening than usual"
          placeholderTextColor={colors.text.tertiary}
          value={title}
          onChangeText={setTitle}
          accessibilityLabel="Page title"
          style={{
            fontFamily: fontFamilies.display.regular,
            fontSize: 24,
            lineHeight: 32,
            letterSpacing: -0.48,
            color: colors.text.primary,
            marginTop: 12,
            paddingHorizontal: 24,
            paddingVertical: 2,
            paddingBottom: 4,
          }}
        />

        {/* Page — repeating ruled lines */}
        <View style={{ flex: 1, marginTop: 10 }}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ minHeight: pageHeight, paddingHorizontal: 24, paddingBottom: 20 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Repeating hairlines every 32px */}
            <View style={{ position: 'absolute', top: 0, left: 24, right: 24, bottom: 0 }} pointerEvents="none">
              {Array.from({ length: lineCount }).map((_, index) => (
                <View
                  key={`rule-${index}`}
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: (index + 1) * 32 - 1,
                    height: 1,
                    backgroundColor: colors.border.subtle,
                  }}
                />
              ))}
            </View>

            {loading ? (
              <FormSkeleton fields={2} />
            ) : (
              <>
                <TextInput
                  multiline
                  placeholder="Start anywhere. No one else reads this."
                  placeholderTextColor={colors.text.tertiary}
                  value={content}
                  onChangeText={setContent}
                  accessibilityLabel="Page body"
                  style={{
                    fontSize: 16,
                    lineHeight: 32,
                    color: colors.text.primary,
                    minHeight: pageHeight,
                    textAlignVertical: 'top',
                    padding: 0,
                  }}
                />

                {/* Attachments rendering */}
                {attachments.length > 0 ? (
                  <View
                    style={{
                      marginTop: 18,
                      paddingTop: 14,
                      borderTopWidth: 1,
                      borderTopColor: colors.border.default,
                      gap: 10,
                    }}
                  >
                    <AppText
                      style={{
                        fontSize: 10.5,
                        fontWeight: '600',
                        letterSpacing: 1.1,
                        textTransform: 'uppercase',
                        color: colors.text.tertiary,
                      }}
                    >
                      Attached ({attachments.length})
                    </AppText>
                    {imageAttachments.length > 0 ? (
                      <MediaAttachmentGrid
                        attachments={imageAttachments}
                        onPressImage={(img) => setLightboxImage(img)}
                        onRemove={handleRemoveAttachment}
                        editable
                      />
                    ) : null}
                    {audioAttachments.map((aud) => (
                      <AudioAttachmentPlayer
                        key={aud.id}
                        attachment={aud}
                        onRemove={() => handleRemoveAttachment(aud.id)}
                        editable
                      />
                    ))}
                    {videoAttachments.map((vid) => (
                      <VideoAttachmentCard
                        key={vid.id}
                        attachment={vid}
                        onRemove={() => handleRemoveAttachment(vid.id)}
                        editable
                      />
                    ))}
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

                {attaching ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 }}>
                    <ActivityIndicator size="small" color={colors.primary.default} />
                    <AppText variant="caption" tone="tertiary">
                      Saving attachment…
                    </AppText>
                  </View>
                ) : null}

                {isEditing ? (
                  <TactilePressable
                    onPress={handleDelete}
                    scaleDownTo={0.95}
                    accessibilityRole="button"
                    accessibilityLabel="Delete this page"
                    style={{ marginTop: 24, paddingVertical: 4 }}
                  >
                    <AppText variant="label" tone="error">
                      Delete this page
                    </AppText>
                  </TactilePressable>
                ) : null}
              </>
            )}
          </ScrollView>
        </View>

        {/* Tool row — Doop 4 SVG icons + word count */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 24,
            paddingTop: 14,
            paddingBottom: 6,
            borderTopWidth: 1,
            borderTopColor: colors.border.subtle,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
            <TactilePressable
              onPress={() => setPhotoPickerVisible(true)}
              disabled={attaching}
              scaleDownTo={0.9}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Add photo"
            >
              <CameraSvgIcon color={colors.text.secondary} />
            </TactilePressable>

            <TactilePressable
              onPress={() => {
                hapticFeedback.light();
                setRecorderVisible(true);
              }}
              disabled={attaching}
              scaleDownTo={0.9}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Record voice memo"
            >
              <MicSvgIcon color={colors.text.secondary} />
            </TactilePressable>

            <TactilePressable
              onPress={() => {
                hapticFeedback.light();
                setMoodPickerVisible(true);
              }}
              scaleDownTo={0.9}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Stamp mood"
            >
              <MoodSvgIcon color={colors.text.secondary} />
            </TactilePressable>

            <TactilePressable
              onPress={handleInsertPrompt}
              scaleDownTo={0.9}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Insert prompt"
            >
              <PromptSvgIcon color={colors.text.secondary} />
            </TactilePressable>
          </View>

          <AppText style={{ fontSize: 12, color: colors.text.tertiary }}>
            {wordCount} {wordCount === 1 ? 'word' : 'words'}
          </AppText>
        </View>

        {/* Bottom button — Doop "Insert today's prompt" */}
        <View style={{ paddingHorizontal: 24, paddingBottom: 22, paddingTop: 10 }}>
          <TactilePressable
            onPress={handleInsertPrompt}
            scaleDownTo={0.98}
            accessibilityRole="button"
            accessibilityLabel="Insert today's prompt"
            style={{
              height: 52,
              borderRadius: 16,
              backgroundColor: colors.surface.selected,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AppText style={{ fontSize: 14.5, fontWeight: '600', color: colors.primary.default }}>
              Insert today's prompt
            </AppText>
          </TactilePressable>
        </View>
      </View>

      {/* Category Selection Modal */}
      <Modal
        visible={typePickerVisible}
        onClose={() => setTypePickerVisible(false)}
        position="bottom"
        scrollable
        title="Page category"
      >
        <View style={{ gap: 4 }}>
          {JOURNAL_TYPES_LIST.map((item) => {
            const isSelected = item.id === entryType;
            return (
              <TactilePressable
                key={item.id}
                onPress={() => {
                  setEntryType(item.id);
                  setTypePickerVisible(false);
                  hapticFeedback.selection();
                }}
                scaleDownTo={0.98}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  paddingVertical: 12,
                  paddingHorizontal: 10,
                  borderRadius: 14,
                  backgroundColor: isSelected ? colors.surface.selected : 'transparent',
                }}
              >
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isSelected ? colors.primary.default : colors.surface.muted,
                  }}
                >
                  <Ionicons
                    name={item.icon}
                    size={18}
                    color={isSelected ? colors.primary.foreground : colors.primary.default}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText
                    style={{
                      fontSize: 15,
                      color: isSelected ? colors.primary.default : colors.text.primary,
                      fontWeight: isSelected ? '700' : '600',
                    }}
                  >
                    {item.label}
                  </AppText>
                  <AppText style={{ fontSize: 12, color: colors.text.tertiary, marginTop: 1 }}>
                    {item.desc}
                  </AppText>
                </View>
                {isSelected ? (
                  <Ionicons name="checkmark" size={18} color={colors.primary.default} />
                ) : null}
              </TactilePressable>
            );
          })}
        </View>
      </Modal>

      {/* Mood Emotion Stamp Modal (from Doop New page — B) */}
      <Modal
        visible={moodPickerVisible}
        onClose={() => setMoodPickerVisible(false)}
        position="bottom"
        title="A word for how this feels"
      >
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 10 }}>
          {MOOD_WORDS.map((m) => {
            let chipBg = colors.surface.muted;
            let chipTone = colors.text.secondary;
            if (m.group === 'accent') {
              chipBg = colors.primary.subtle;
              chipTone = colors.primary.default;
            } else if (m.group === 'gold') {
              chipBg = isDark ? 'rgba(176,138,79,0.22)' : '#F4EDE2';
              chipTone = isDark ? '#D2B078' : '#B08A4F';
            }
            return (
              <TactilePressable
                key={m.label}
                onPress={() => handleMoodSelect(m.label)}
                scaleDownTo={0.94}
                style={{
                  height: 34,
                  paddingHorizontal: 14,
                  borderRadius: 999,
                  backgroundColor: chipBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AppText style={{ fontSize: 13, fontWeight: '600', color: chipTone }}>
                  {m.label}
                </AppText>
              </TactilePressable>
            );
          })}
        </View>
      </Modal>

      {/* Photo / Media Picker Modal */}
      <Modal
        visible={photoPickerVisible}
        onClose={() => setPhotoPickerVisible(false)}
        position="bottom"
        title="Attach to page"
      >
        <View style={{ gap: 8, paddingVertical: 8 }}>
          <TactilePressable
            onPress={() => {
              setPhotoPickerVisible(false);
              handlePickCamera();
            }}
            scaleDownTo={0.98}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingVertical: 12,
              paddingHorizontal: 10,
              borderRadius: 12,
              backgroundColor: colors.surface.muted,
            }}
          >
            <CameraSvgIcon color={colors.primary.default} />
            <AppText style={{ fontSize: 14.5, fontWeight: '600', color: colors.text.primary }}>
              Take photo with camera
            </AppText>
          </TactilePressable>

          <TactilePressable
            onPress={() => {
              setPhotoPickerVisible(false);
              handlePickMedia();
            }}
            scaleDownTo={0.98}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingVertical: 12,
              paddingHorizontal: 10,
              borderRadius: 12,
              backgroundColor: colors.surface.muted,
            }}
          >
            <Ionicons name="images-outline" size={21} color={colors.primary.default} />
            <AppText style={{ fontSize: 14.5, fontWeight: '600', color: colors.text.primary }}>
              Choose photo or video
            </AppText>
          </TactilePressable>

          <TactilePressable
            onPress={() => {
              setPhotoPickerVisible(false);
              handlePickDocument();
            }}
            scaleDownTo={0.98}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingVertical: 12,
              paddingHorizontal: 10,
              borderRadius: 12,
              backgroundColor: colors.surface.muted,
            }}
          >
            <Ionicons name="attach-outline" size={21} color={colors.primary.default} />
            <AppText style={{ fontSize: 14.5, fontWeight: '600', color: colors.text.primary }}>
              Attach file or document
            </AppText>
          </TactilePressable>
        </View>
      </Modal>

      <AudioRecorderModal
        visible={recorderVisible}
        onClose={() => setRecorderVisible(false)}
        onSaved={(attachment) => {
          setAttachments((prev) => [...prev, attachment]);
        }}
      />

      <ImageLightboxModal attachment={lightboxImage} onClose={() => setLightboxImage(null)} />
    </View>
  );
}
