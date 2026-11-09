import React, { useMemo } from 'react';
import { Image, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SketchPad } from './SketchPad';
import { AudioAttachmentPlayer } from './AudioAttachmentPlayer';
import { VideoAttachmentCard } from './VideoAttachmentCard';
import { DocumentAttachmentCard } from './DocumentAttachmentCard';
import type { NoteAttachment } from '../../types/attachment';
import type { SketchStroke } from '../../features/journal/sketch';
import {
  PageBlock,
  Cursor,
  groupRows,
  SIZE_FRACTION,
  BREATH_LINES,
  GAP,
  PAPER_LINE_HEIGHT,
  SKETCH_HEIGHT,
} from '../../features/journal/pageBlocks';

interface Props {
  blocks: PageBlock[];
  attachments: NoteAttachment[];
  containerWidth: number;
  ink: string;
  inkSoft: string;
  accent: string;
  paperBg: string;
  fontSize?: number;
  onChangeText: (id: string, text: string) => void;
  onChangeSketch: (id: string, strokes: SketchStroke[]) => void;
  onCursor: (cursor: Cursor) => void;
  onLongPressMedia: (id: string) => void;
  onRemoveMedia: (id: string) => void;
  onLongPressMargin: () => void;
}

const GUTTER = 28;

/** Image height rounded up to whole lines so the ruled texture stays aligned. */
const mediaHeight = (width: number) =>
  Math.ceil((width * 0.75) / PAPER_LINE_HEIGHT) * PAPER_LINE_HEIGHT;

export function PageBlockEditor(props: Props) {
  const {
    blocks,
    attachments,
    containerWidth,
    ink,
    inkSoft,
    accent,
    paperBg,
    fontSize = 16,
    onChangeText,
    onChangeSketch,
    onCursor,
    onLongPressMedia,
    onRemoveMedia,
    onLongPressMargin,
  } = props;

  // The margin gutter sits to the left of text blocks for easy long-press insertion.
  // Full-width media & sketch bleed flush across the gutter to fill the page container.
  const textWidth = Math.max(0, containerWidth - GUTTER);
  const rows = useMemo(() => groupRows(blocks), [blocks]);
  const attById = useMemo(() => new Map(attachments.map((a) => [a.id, a])), [attachments]);

  return (
    <View style={{ width: containerWidth }}>
      {rows.map((row, rowIndex) => {
        if (row.kind === 'text') {
          const b = row.block;
          const isFirst = rowIndex === 0 && blocks.length === 1;
          return (
            <View key={b.id} style={{ flexDirection: 'row', width: containerWidth }}>
              {/* Gutter: long-press here to insert at the cursor. */}
              <Pressable
                onLongPress={onLongPressMargin}
                delayLongPress={350}
                accessibilityRole="button"
                accessibilityLabel="Insert here. Hold to add a photo, sketch, voice memo, or prompt."
                style={{ width: GUTTER }}
              />

              <TextInput
                multiline
                scrollEnabled={false}
                value={b.text}
                placeholder={isFirst ? 'Start anywhere. No one else reads this.' : undefined}
                placeholderTextColor={inkSoft}
                onChangeText={(t) => onChangeText(b.id, t)}
                onSelectionChange={(e) =>
                  onCursor({ blockId: b.id, offset: e.nativeEvent.selection.start })
                }
                onFocus={() => onCursor({ blockId: b.id, offset: b.text.length })}
                selectionColor={accent}
                cursorColor={accent}
                style={{
                  width: textWidth,
                  color: ink,
                  fontSize,
                  lineHeight: PAPER_LINE_HEIGHT,
                  minHeight: PAPER_LINE_HEIGHT,
                  padding: 0,
                  textAlignVertical: 'top',
                }}
              />
            </View>
          );
        }

        // Media / sketch row:
        // If a single full-width block, let it span containerWidth flush (no gutter indent).
        // If multi-column or partial-width, align with the text block width.
        const isSingleFull = row.blocks.length === 1 && row.blocks[0].size === 'full';
        const rowWidth = isSingleFull ? containerWidth : textWidth;
        const breath = BREATH_LINES[row.blocks[0].breath] * PAPER_LINE_HEIGHT;

        return (
          <View
            key={row.blocks.map((b) => b.id).join('-')}
            style={{
              flexDirection: 'row',
              marginLeft: isSingleFull ? 0 : GUTTER,
              width: rowWidth,
              flexWrap: 'wrap',
              gap: GAP,
              marginVertical: breath,
            }}
          >
            {row.blocks.map((b) => {
              const width =
                rowWidth * SIZE_FRACTION[b.size] - (row.blocks.length > 1 ? GAP : 0);

              if (b.kind === 'sketch') {
                return (
                  <View key={b.id} style={{ width }}>
                    <SketchPad
                      strokes={b.strokes}
                      onChange={(s) => onChangeSketch(b.id, s)}
                      accentColor={accent}
                      paperBgColor={paperBg}
                      width={width}
                      height={SKETCH_HEIGHT}
                      isFreeform={false}
                      compact
                      onResize={() => onLongPressMedia(b.id)}
                      onClose={() => onRemoveMedia(b.id)}
                    />
                  </View>
                );
              }

              const att = attById.get(b.attachmentId);
              if (!att) return null;

              return (
                <Pressable
                  key={b.id}
                  onLongPress={() => onLongPressMedia(b.id)}
                  delayLongPress={350}
                  style={{ width }}
                  accessibilityRole="button"
                  accessibilityLabel={`${att.name}. Hold to change size or spacing.`}
                >
                  {att.type === 'image' ? (
                    <Image
                      source={{ uri: att.uri }}
                      resizeMode="cover"
                      style={{ width, height: mediaHeight(width), borderRadius: 10 }}
                    />
                  ) : att.type === 'audio' ? (
                    <AudioAttachmentPlayer attachment={att} editable={false} />
                  ) : att.type === 'video' ? (
                    <VideoAttachmentCard attachment={att} editable={false} />
                  ) : (
                    <DocumentAttachmentCard attachment={att} editable={false} />
                  )}

                  {/* Quick Action Overlay (Format / Resize + Remove) */}
                  <View style={styles.actionRow}>
                    <Pressable
                      onPress={() => onLongPressMedia(b.id)}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel="Resize block or adjust spacing"
                      style={styles.actionBtn}
                    >
                      <Ionicons name="options-outline" size={12} color="#FFFFFF" />
                    </Pressable>
                    <Pressable
                      onPress={() => onRemoveMedia(b.id)}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel="Remove this item from the page"
                      style={styles.actionBtn}
                    >
                      <Ionicons name="close" size={12} color="#FFFFFF" />
                    </Pressable>
                  </View>
                </Pressable>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    position: 'absolute',
    top: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    zIndex: 10,
  },
  actionBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(26, 36, 32, 0.65)',
  },
});
