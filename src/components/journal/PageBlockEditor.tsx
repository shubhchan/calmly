import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  RenderRow,
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
  fontSize?: number;
  onChangeText: (id: string, text: string) => void;
  onChangeSketch: (id: string, strokes: SketchStroke[]) => void;
  onChangeSketchLock: (id: string, locked: boolean) => void;
  onCursor: (cursor: Cursor) => void;
  onLongPressMedia: (id: string) => void;
  onRemoveMedia: (id: string) => void;
}

/** How long the floating edit buttons stay on screen after you tap an item. */
const CONTROLS_TIMEOUT_MS = 5000;

/** Image height rounded up to whole lines so the ruled texture stays aligned. */
const mediaHeight = (width: number) =>
  Math.ceil((width * 0.75) / PAPER_LINE_HEIGHT) * PAPER_LINE_HEIGHT;

type MediaBlock = Extract<PageBlock, { kind: 'media' | 'sketch' }>;

/**
 * Split a media row into lines and size each block so every line fills the page
 * width exactly. Gaps are only taken from blocks that share a line, so a block
 * that wraps onto its own line is not left short on the right.
 */
function layoutMediaRow(row: Extract<RenderRow, { kind: 'media-row' }>, containerWidth: number) {
  const lines: { block: MediaBlock; fraction: number }[][] = [];
  let current: { block: MediaBlock; fraction: number }[] = [];
  let used = 0;

  for (const block of row.blocks) {
    const fraction = SIZE_FRACTION[block.size];
    if (current.length > 0 && used + fraction > 1) {
      lines.push(current);
      current = [];
      used = 0;
    }
    current.push({ block, fraction });
    used += fraction;
  }
  if (current.length > 0) lines.push(current);

  return lines.map((line) => {
    const gaps = GAP * (line.length - 1);
    return line.map(({ block, fraction }) => ({
      block,
      width: (containerWidth - gaps) * fraction,
    }));
  });
}

export function PageBlockEditor(props: Props) {
  const {
    blocks,
    attachments,
    containerWidth,
    ink,
    inkSoft,
    accent,
    fontSize = 16,
    onChangeText,
    onChangeSketch,
    onChangeSketchLock,
    onCursor,
    onLongPressMedia,
    onRemoveMedia,
  } = props;

  // Every block starts at the same left edge. No hidden gutter, so text, photos,
  // sketches and videos line up on the page.
  const rows = useMemo(() => groupRows(blocks), [blocks]);
  const attById = useMemo(() => new Map(attachments.map((a) => [a.id, a])), [attachments]);

  // Tapping a media block reveals floating edit buttons. They fade out of the way
  // on their own, so the page keeps its paper-like look.
  const [activeId, setActiveId] = useState<string | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHideTimer = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }, []);

  useEffect(() => () => clearHideTimer(), [clearHideTimer]);

  const showControls = useCallback(
    (blockId: string) => {
      clearHideTimer();
      setActiveId(blockId);
      hideTimer.current = setTimeout(() => setActiveId(null), CONTROLS_TIMEOUT_MS);
    },
    [clearHideTimer],
  );

  const toggleControls = useCallback(
    (blockId: string) => {
      if (activeId === blockId) {
        clearHideTimer();
        setActiveId(null);
        return;
      }
      showControls(blockId);
    },
    [activeId, clearHideTimer, showControls],
  );

  return (
    <View style={{ width: containerWidth }}>
      {rows.map((row, rowIndex) => {
        if (row.kind === 'text') {
          const b = row.block;
          const isFirst = rowIndex === 0 && blocks.length === 1;
          return (
            <View key={b.id} style={{ width: containerWidth }}>
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
                onFocus={() => {
                  setActiveId(null);
                  onCursor({ blockId: b.id, offset: b.text.length });
                }}
                selectionColor={accent}
                cursorColor={accent}
                style={{
                  width: containerWidth,
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

        // Media / sketch row: flush with the page edge, same as the text.
        const breath = BREATH_LINES[row.blocks[0].breath] * PAPER_LINE_HEIGHT;
        const lines = layoutMediaRow(row, containerWidth);

        return (
          <View
            key={row.blocks.map((b) => b.id).join('-')}
            style={{ width: containerWidth, marginVertical: breath, gap: GAP }}
          >
            {lines.map((line, lineIndex) => (
              <View key={lineIndex} style={{ flexDirection: 'row', gap: GAP }}>
                {line.map(({ block: b, width }) => {
                  const isActive = activeId === b.id;

                  if (b.kind === 'sketch') {
                    return (
                      <View key={b.id} style={{ width }}>
                        <SketchPad
                          strokes={b.strokes}
                          onChange={(s) => onChangeSketch(b.id, s)}
                          accentColor={accent}
                          width={width}
                          height={SKETCH_HEIGHT}
                          active={isActive}
                          locked={b.locked}
                          onToggleLock={(locked) => onChangeSketchLock(b.id, locked)}
                          onToggleControls={() => toggleControls(b.id)}
                          onResize={() => onLongPressMedia(b.id)}
                          onClose={() => onRemoveMedia(b.id)}
                        />
                      </View>
                    );
                  }

                  const att = attById.get(b.attachmentId);
                  if (!att) return null;

                  return (
                    <View key={b.id} style={{ width }}>
                      {att.type === 'video' ? (
                        <VideoAttachmentCard
                          attachment={att}
                          onSelect={() => showControls(b.id)}
                        />
                      ) : (
                        <Pressable
                          onPress={() => toggleControls(b.id)}
                          onLongPress={() => onLongPressMedia(b.id)}
                          delayLongPress={350}
                          accessibilityRole="button"
                          accessibilityLabel={`${att.name}. Tap for options. Hold to change size or spacing.`}
                        >
                          {att.type === 'image' ? (
                            <Image
                              source={{ uri: att.uri }}
                              resizeMode="cover"
                              style={{ width, height: mediaHeight(width), borderRadius: 10 }}
                            />
                          ) : att.type === 'audio' ? (
                            <AudioAttachmentPlayer attachment={att} editable={false} />
                          ) : (
                            <DocumentAttachmentCard attachment={att} editable={false} />
                          )}
                        </Pressable>
                      )}

                      {/* Floating edit buttons: only while this item is selected. */}
                      {isActive ? (
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
                      ) : null}
                    </View>
                  );
                })}
              </View>
            ))}
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
