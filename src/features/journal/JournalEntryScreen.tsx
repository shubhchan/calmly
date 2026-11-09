import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  TextInput,
  View,
  Platform,
  StatusBar,
  StyleSheet,
} from 'react-native';
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
import Svg, { Circle, Path } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { NoteAttachment, AttachmentType } from '../../types/attachment';
import { persistAttachmentFile } from '../../utils/attachmentStorage';
import { ImageLightboxModal } from '../../components/journal/ImageLightboxModal';
import { AudioRecorderModal } from '../../components/journal/AudioRecorderModal';
import { PaperTexture } from '../../components/journal/PaperTexture';
import { PaperStyleModal } from '../../components/journal/PaperStyleModal';
import { PageBlockEditor } from '../../components/journal/PageBlockEditor';
import { BlockInsertSheet, InsertKind } from '../../components/journal/BlockInsertSheet';
import {
  paperById,
  paperColor,
  paperInk,
  paperInkSoft,
  paperAccentText,
  PAPER_LINE_HEIGHT,
  PAPER_BODY_SIZE,
} from './papers';
import { parseSketch } from './sketch';
import { parsePageLayout, serializePageLayout } from '../../types/journalLayout';
import {
  PageBlock,
  BlockSize,
  BlockBreath,
  Cursor,
  PageDocument,
  newId,
  allowedSizes,
  insertAtCursor,
  insertTextAtCursor,
  normalizeBlocks,
  plainTextForSearch,
  migrateLegacyEntry,
} from './pageBlocks';
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

function hexToRgba(hex: string, alpha: number): string {
  let clean = (hex || '#2C4F45').replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const r = parseInt(clean.substring(0, 2), 16) || 44;
  const g = parseInt(clean.substring(2, 4), 16) || 79;
  const b = parseInt(clean.substring(4, 6), 16) || 69;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function MoodSvgIcon({ color = '#5C6B65' }: { color?: string }) {
  return (
    <Svg width={21} height={21} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={1.7} />
      <Path d="M8 14s1.5 2 4 2 4-2 4-2" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
      <Circle cx="9" cy="9" r="1.1" fill={color} />
      <Circle cx="15" cy="9" r="1.1" fill={color} />
    </Svg>
  );
}

function PromptSvgIcon({ color = '#5C6B65' }: { color?: string }) {
  return (
    <Svg width={21} height={21} viewBox="0 0 24 24" fill="none">
      <Path d="M7 7h10M7 12h10M7 17h6" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
  );
}

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
  const [entryCreatedAt, setEntryCreatedAt] = useState<number>(preview?.createdAt ?? Date.now());

  const typeLabel = (journalTypeLabels as any)?.[entryType] ?? 'Free write';

  const [title, setTitle] = useState<string>(preview?.title ?? '');
  const [isFavorite, setIsFavorite] = useState(!!preview?.favorite);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [attaching, setAttaching] = useState(false);

  // Paper Style, Texture, and Accent Color states
  const [paperId, setPaperId] = useState<string>('dawn');
  const [accentColor, setAccentColor] = useState<string>(paperById('dawn').accent);
  const [paperModalVisible, setPaperModalVisible] = useState<boolean>(false);

  // Inline blocks document model
  const [blocks, setBlocks] = useState<PageBlock[]>(() => [{ id: newId('txt'), kind: 'text', text: '' }]);
  const [attachments, setAttachments] = useState<NoteAttachment[]>([]);
  const cursorRef = useRef<Cursor | null>(null);
  const [insertOpen, setInsertOpen] = useState(false);
  const [insertSize, setInsertSize] = useState<BlockSize>('half');
  const [insertBreath, setInsertBreath] = useState<BlockBreath>('comfortable');
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const [recorderVisible, setRecorderVisible] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<NoteAttachment | null>(null);

  const { colors, isDark } = useAppTheme();
  const currentPaper = useMemo(() => paperById(paperId), [paperId]);
  const currentPaperColor = useMemo(() => paperColor(currentPaper, isDark), [currentPaper, isDark]);
  const activeAccent = accentColor || currentPaper.accent;

  const ink = useMemo(() => paperInk(currentPaper, isDark), [currentPaper, isDark]);
  const inkSoft = useMemo(() => paperInkSoft(currentPaper, isDark), [currentPaper, isDark]);
  const textAccent = useMemo(
    () => paperAccentText(currentPaper, isDark, activeAccent),
    [currentPaper, isDark, activeAccent],
  );

  const editingBlock = useMemo(
    () => blocks.find((b) => b.id === editingBlockId && b.kind !== 'text'),
    [blocks, editingBlockId],
  );

  // Load entry & migrate legacy format if needed
  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    const loadEntry = async () => {
      if (!preview) setLoading(true);
      try {
        const entry = await journalRepository.getById(id);
        if (entry && isMounted) {
          setTitle(entry.title || '');
          setIsFavorite(!!entry.favorite);
          if (entry.createdAt) {
            setEntryCreatedAt(entry.createdAt);
          }
          if (entry.type && (journalTypeLabels as any)[entry.type]) {
            setEntryType(entry.type as JournalType);
          }
          if (entry.pageStyle) {
            setPaperId(entry.pageStyle);
            const p = paperById(entry.pageStyle);
            setAccentColor(p.accent);
          }

          const parsedAttachments: NoteAttachment[] = Array.isArray(entry.attachments) ? entry.attachments : [];
          setAttachments(parsedAttachments);

          const layout = parsePageLayout(entry.layout);
          const legacyStrokes = entry.drawing ? parseSketch(entry.drawing) : [];
          const doc = migrateLegacyEntry(entry.body || '', layout, parsedAttachments, legacyStrokes);
          setBlocks(doc.blocks);
          if (doc.accentColor) {
            setAccentColor(doc.accentColor);
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

  // Debounced autosave
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef(false);

  const persist = useCallback(() => {
    if (!id) return;
    const doc: PageDocument = { version: 2, accentColor: activeAccent, blocks };
    journalRepository
      .update(id, {
        content: plainTextForSearch(blocks),
        body: plainTextForSearch(blocks),
        layout: serializePageLayout({ accentColor: activeAccent, doc }),
        attachments,
      })
      .catch((e) => console.warn('[journal] autosave failed', e));
  }, [id, blocks, activeAccent, attachments]);

  const persistRef = useRef(persist);
  persistRef.current = persist;

  useEffect(() => {
    if (!isEditing || !id || loading) return;
    pending.current = true;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      pending.current = false;
      persistRef.current();
    }, 600);
  }, [blocks, activeAccent, isEditing, id, loading, attachments]);

  useEffect(() => () => {
    // Flush on leaving the screen so a quick swipe-back does not lose the last edit.
    if (saveTimer.current) clearTimeout(saveTimer.current);
    if (pending.current) persistRef.current();
  }, []);

  const capSize = (t: AttachmentType | 'sketch', s: BlockSize): BlockSize => {
    const ok = allowedSizes(t);
    return ok.includes(s) ? s : ok[ok.length - 1];
  };

  const placeBlock = (block: PageBlock) => {
    const res = insertAtCursor(blocks, cursorRef.current, block);
    setBlocks(res.blocks);
    cursorRef.current = res.cursor;
    hapticFeedback.success();
  };

  const placeAttachment = (att: NoteAttachment) => {
    setAttachments((prev) => [...prev, att]);
    placeBlock({
      id: newId('med'),
      kind: 'media',
      attachmentId: att.id,
      mediaType: att.type,
      size: capSize(att.type, insertSize),
      breath: insertBreath,
    });
  };

  const handleCapturePhoto = async () => {
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
        placeAttachment(newAttachment);
      }
    } catch (err) {
      console.error('Camera capture failed:', err);
      Alert.alert('Camera error', 'Could not capture the photo.');
    } finally {
      setAttaching(false);
    }
  };

  const handlePickMedia = async (targetMediaType: 'media' | 'video' = 'media') => {
    try {
      hapticFeedback.light();
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: targetMediaType === 'video' ? ['videos'] : ['images', 'videos'],
        allowsMultipleSelection: true,
        quality: 0.85,
      });

      if (!result.canceled && result.assets?.length > 0) {
        setAttaching(true);
        for (const asset of result.assets) {
          const isVideo = asset.type === 'video';
          const mediaType = isVideo ? 'video' : 'image';
          const defaultName = isVideo ? 'Video Clip' : 'Photo';
          const { uri, size } = await persistAttachmentFile(
            asset.uri,
            mediaType,
            asset.fileName || `${defaultName}.${isVideo ? 'mp4' : 'jpg'}`
          );

          const newAttachment: NoteAttachment = {
            id: `att_med_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            type: mediaType,
            uri,
            name: asset.fileName || defaultName,
            size: size || asset.fileSize,
            mimeType: asset.mimeType,
            duration: asset.duration ? Math.round(asset.duration / 1000) : undefined,
            createdAt: Date.now(),
          };
          placeAttachment(newAttachment);
        }
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
        placeAttachment(newAttachment);
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

  const removeMedia = (blockId: string) => {
    const b = blocks.find((x) => x.id === blockId);
    if (!b || b.kind !== 'media') {
      setBlocks((prev) => normalizeBlocks(prev.filter((x) => x.id !== blockId)));
      return;
    }
    setBlocks((prev) => normalizeBlocks(prev.filter((x) => x.id !== blockId)));
    handleRemoveAttachment(b.attachmentId);
  };

  const handleInsertKind = async (kind: InsertKind) => {
    setInsertOpen(false);
    if (kind === 'prompt') {
      const prompt = getDailyPrompt();
      if (!prompt) return;
      const res = insertTextAtCursor(blocks, cursorRef.current, prompt);
      setBlocks(res.blocks);
      cursorRef.current = res.cursor;
      return;
    }
    if (kind === 'sketch') {
      placeBlock({
        id: newId('skt'),
        kind: 'sketch',
        strokes: [],
        size: capSize('sketch', insertSize),
        breath: insertBreath,
      });
      return;
    }
    if (kind === 'voice') {
      setRecorderVisible(true);
      return;
    }
    if (kind === 'photo') return handlePickMedia('media');
    if (kind === 'camera') return handleCapturePhoto();
    if (kind === 'video') return handlePickMedia('video');
    if (kind === 'file') return handlePickDocument();
  };

  const openInsertAtCursor = () => {
    hapticFeedback.light();
    setEditingBlockId(null);
    setInsertOpen(true);
  };

  const editBlock = (id: string) => {
    const b = blocks.find((x) => x.id === id);
    if (!b || b.kind === 'text') return;
    hapticFeedback.light();
    setEditingBlockId(id);
    setInsertSize(b.size);
    setInsertBreath(b.breath);
    setInsertOpen(true);
  };

  const changeSize = (s: BlockSize) => {
    setInsertSize(s);
    if (editingBlockId) {
      setBlocks((prev) =>
        prev.map((b) =>
          b.id === editingBlockId && b.kind !== 'text'
            ? { ...b, size: capSize(b.kind === 'media' ? b.mediaType : 'sketch', s) }
            : b,
        ),
      );
    }
  };

  const changeBreath = (br: BlockBreath) => {
    setInsertBreath(br);
    if (editingBlockId) {
      setBlocks((prev) =>
        prev.map((b) => (b.id === editingBlockId && b.kind !== 'text' ? { ...b, breath: br } : b)),
      );
    }
  };

  const handleSave = async () => {
    const trimmedTitle = (title || '').trim();
    const plainText = plainTextForSearch(blocks);

    if (!plainText && !trimmedTitle && blocks.length <= 1) {
      Alert.alert('Nothing to save yet', 'Write a line, sketch, or attach something first.');
      return;
    }

    setSaving(true);
    try {
      const doc: PageDocument = { version: 2, accentColor: activeAccent, blocks };
      const serializedLayout = serializePageLayout({ accentColor: activeAccent, doc });

      if (isEditing && id) {
        await journalRepository.update(id, {
          type: entryType,
          title: trimmedTitle,
          body: plainText,
          content: plainText,
          favorite: isFavorite,
          attachments,
          pageStyle: paperId,
          layout: serializedLayout,
        });
      } else {
        await journalRepository.create({
          type: entryType,
          title: trimmedTitle,
          body: plainText,
          content: plainText,
          favorite: isFavorite,
          attachments,
          pageStyle: paperId,
          layout: serializedLayout,
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

  const handleMoodSelect = (word: string) => {
    hapticFeedback.selection();
    setMoodPickerVisible(false);
    const stamp = `Feeling: ${word}.`;
    const res = insertTextAtCursor(blocks, cursorRef.current, stamp);
    setBlocks(res.blocks);
    cursorRef.current = res.cursor;
  };

  const fullText = useMemo(() => plainTextForSearch(blocks), [blocks]);
  const wordCount = fullText.trim() ? fullText.trim().split(/\s+/).length : 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.default }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={{ flex: 1, paddingTop: topPad }}>
        {/* Header: Cancel | New page / Your page | Save */}
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
                color: saving ? colors.text.tertiary : activeAccent,
                fontWeight: '600',
              }}
            >
              {saving ? 'Saving' : 'Save'}
            </AppText>
          </TactilePressable>
        </View>

        {/* Date & Category Row */}
        <View
          style={{
            marginTop: 8,
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

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {/* Category selection chip */}
            <TactilePressable
              onPress={() => setTypePickerVisible(true)}
              scaleDownTo={0.94}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={`Category: ${typeLabel}. Tap to change`}
              style={{
                height: 28,
                paddingHorizontal: 10,
                borderRadius: 999,
                backgroundColor: isDark
                  ? hexToRgba(activeAccent, 0.18)
                  : hexToRgba(activeAccent, 0.1),
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                borderWidth: 1,
                borderColor: isDark ? hexToRgba(activeAccent, 0.3) : hexToRgba(activeAccent, 0.2),
              }}
            >
              <AppText
                style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: activeAccent,
                }}
              >
                {typeLabel}
              </AppText>
              <Ionicons name="chevron-down" size={11} color={activeAccent} />
            </TactilePressable>
          </View>
        </View>

        {/* Title — Newsreader display serif */}
        <View
          style={{
            paddingHorizontal: 24,
            marginTop: 8,
          }}
        >
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
              paddingVertical: 2,
              paddingBottom: 4,
            }}
          />
        </View>

        {/* Paper Sheet Container */}
        <View
          style={{
            flex: 1,
            marginHorizontal: 14,
            marginTop: 8,
            borderRadius: 22,
            backgroundColor: currentPaperColor,
            position: 'relative',
            overflow: 'hidden',
            borderWidth: 1.5,
            borderColor: isDark ? hexToRgba(activeAccent, 0.28) : hexToRgba(activeAccent, 0.22),
            shadowColor: '#14241E',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 10,
            elevation: 2,
          }}
        >
          {/* Paper Texture layer */}
          <PaperTexture texture={currentPaper.texture} isDark={isDark} accentColor={activeAccent} />

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              minHeight: 800,
              paddingHorizontal: 18,
              paddingVertical: 14,
              paddingBottom: 40,
            }}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={true}
            showsVerticalScrollIndicator={false}
          >
            <View onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}>
              {loading ? (
                <FormSkeleton fields={2} />
              ) : (
                <>
                  <PageBlockEditor
                    blocks={blocks}
                    attachments={attachments}
                    containerWidth={containerWidth}
                    ink={ink}
                    inkSoft={inkSoft}
                    accent={textAccent}
                    paperBg={currentPaperColor}
                    onChangeText={(id, text) =>
                      setBlocks((prev) =>
                        prev.map((b) => (b.id === id && b.kind === 'text' ? { ...b, text } : b)),
                      )
                    }
                    onChangeSketch={(id, strokes) =>
                      setBlocks((prev) =>
                        prev.map((b) => (b.id === id && b.kind === 'sketch' ? { ...b, strokes } : b)),
                      )
                    }
                    onCursor={(c) => {
                      cursorRef.current = c;
                    }}
                    onLongPressMedia={editBlock}
                    onRemoveMedia={removeMedia}
                    onLongPressMargin={openInsertAtCursor}
                  />

                  {attaching ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 }}>
                      <ActivityIndicator size="small" color={activeAccent} />
                      <AppText variant="caption" tone="tertiary">
                        Saving attachment…
                      </AppText>
                    </View>
                  ) : null}

                  {isEditing ? (
                    <TactilePressable
                      onPress={handleDelete}
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
            </View>
          </ScrollView>
        </View>

        {/* Toolbar */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 24,
            paddingTop: 12,
            paddingBottom: 6,
            borderTopWidth: 1,
            borderTopColor: colors.border.subtle,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
            <TactilePressable
              onPress={openInsertAtCursor}
              accessibilityRole="button"
              accessibilityLabel="Insert at cursor"
            >
              <Ionicons name="add-circle-outline" size={24} color={colors.text.secondary} />
            </TactilePressable>
            <TactilePressable
              onPress={() => setMoodPickerVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Stamp mood"
            >
              <MoodSvgIcon color={colors.text.secondary} />
            </TactilePressable>
            <TactilePressable
              onPress={() => handleInsertKind('prompt')}
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

        {/* Footer with page type / paper style chip */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingBottom: 14,
          }}
        >
          <TactilePressable
            onPress={() => {
              hapticFeedback.light();
              setPaperModalVisible(true);
            }}
            accessibilityRole="button"
            accessibilityLabel={`Page type: ${currentPaper.name}. Change paper and accent.`}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingHorizontal: 12,
              height: 32,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.border.subtle,
            }}
          >
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: currentPaperColor,
                borderWidth: 1,
                borderColor: colors.border.default,
              }}
            />
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: activeAccent,
              }}
            />
            <AppText style={{ fontSize: 12.5, fontWeight: '600', color: colors.text.secondary }}>
              {currentPaper.name}
            </AppText>
          </TactilePressable>
        </View>
      </View>

      {/* Block Insert & Format Sheet */}
      <BlockInsertSheet
        visible={insertOpen}
        onClose={() => {
          setInsertOpen(false);
          setEditingBlockId(null);
        }}
        size={insertSize}
        breath={insertBreath}
        onSizeChange={changeSize}
        onBreathChange={changeBreath}
        onPickKind={editingBlockId ? undefined : handleInsertKind}
        sizeOptions={
          editingBlock
            ? allowedSizes(editingBlock.kind === 'media' ? editingBlock.mediaType : 'sketch')
            : undefined
        }
        onDeleteBlock={
          editingBlockId
            ? () => {
                const targetId = editingBlockId;
                setInsertOpen(false);
                setEditingBlockId(null);
                removeMedia(targetId);
              }
            : undefined
        }
        accent={textAccent}
        ink={ink}
        surface={colors.surface.muted}
        border={colors.border.subtle}
      />

      {/* Paper Style & Texture & Accent Color Modal */}
      <PaperStyleModal
        visible={paperModalVisible}
        onClose={() => setPaperModalVisible(false)}
        selectedPaperId={paperId}
        onSelectPaper={(id) => {
          setPaperId(id);
          const p = paperById(id);
          setAccentColor(p.accent);
        }}
        accentColor={activeAccent}
        onSelectAccentColor={(color) => {
          setAccentColor(color);
        }}
      />

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
                    backgroundColor: isSelected ? activeAccent : colors.surface.muted,
                  }}
                >
                  <Ionicons
                    name={item.icon}
                    size={18}
                    color={isSelected ? colors.primary.foreground : activeAccent}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText
                    style={{
                      fontSize: 15,
                      color: isSelected ? activeAccent : colors.text.primary,
                      fontWeight: isSelected ? '700' : '600',
                    }}
                  >
                    {item.label}
                  </AppText>
                  <AppText style={{ fontSize: 12, color: colors.text.tertiary, marginTop: 1 }}>
                    {item.desc}
                  </AppText>
                </View>
                {isSelected ? <Ionicons name="checkmark" size={18} color={activeAccent} /> : null}
              </TactilePressable>
            );
          })}
        </View>
      </Modal>

      {/* Mood Emotion Stamp Modal */}
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
              chipTone = activeAccent;
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

      <AudioRecorderModal
        visible={recorderVisible}
        onClose={() => setRecorderVisible(false)}
        onSaved={(attachment) => {
          placeAttachment(attachment);
        }}
      />

      <ImageLightboxModal attachment={lightboxImage} onClose={() => setLightboxImage(null)} />
    </View>
  );
}
