import type { AttachmentType } from '../../types/attachment';
import type { SketchStroke } from './sketch';
import type { NoteAttachment } from '../../types/attachment';
import type { PageLayout } from '../../types/journalLayout';

export type BlockSize = 'quarter' | 'third' | 'half' | 'full';
export type BlockBreath = 'tight' | 'comfortable' | 'airy';

export const SIZE_FRACTION: Record<BlockSize, number> = {
  quarter: 0.25,
  third: 1 / 3,
  half: 0.5,
  full: 1,
};

export const SIZE_LABEL: Record<BlockSize, string> = {
  quarter: '¼',
  third: '⅓',
  half: '½',
  full: 'Full',
};

/**
 * Breath is measured in writing lines, not pixels, so ruled lines still line up
 * with the text after an image or sketch.
 */
export const BREATH_LINES: Record<BlockBreath, number> = {
  tight: 0,
  comfortable: 1,
  airy: 2,
};

export const GAP = 8;
export const PAPER_LINE_HEIGHT = 28; // must match papers.ts
export const SKETCH_HEIGHT = PAPER_LINE_HEIGHT * 6;

export type PageBlock =
  | { id: string; kind: 'text'; text: string }
  | {
      id: string;
      kind: 'media';
      attachmentId: string;
      mediaType: AttachmentType;
      size: BlockSize;
      breath: BlockBreath;
    }
  | {
      id: string;
      kind: 'sketch';
      strokes: SketchStroke[];
      size: BlockSize;
      breath: BlockBreath;
    };

export interface PageDocument {
  version: 2;
  accentColor?: string;
  blocks: PageBlock[];
}

export interface Cursor {
  blockId: string;
  offset: number;
}

export const newId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

/** Which sizes make sense for each kind of attachment. */
export function allowedSizes(mediaType: AttachmentType | 'sketch'): BlockSize[] {
  switch (mediaType) {
    case 'image':
    case 'sketch':
      return ['quarter', 'third', 'half', 'full'];
    case 'audio':
    case 'document':
      return ['half', 'full'];
    case 'video':
      return ['full'];
  }
}

/** Keeps the document well-formed after any edit. */
export function normalizeBlocks(input: PageBlock[]): PageBlock[] {
  // 1. Merge adjacent text blocks.
  const merged: PageBlock[] = [];
  for (const b of input) {
    const prev = merged[merged.length - 1];
    if (b.kind === 'text' && prev?.kind === 'text') {
      merged[merged.length - 1] = { ...prev, text: prev.text + b.text };
    } else {
      merged.push(b);
    }
  }

  // 2. Drop empty text blocks that touch media, so media that sit next to each
  //    other form one row (and wrap side by side at quarter/third/half sizes).
  const isMedia = (b?: PageBlock) => !!b && b.kind !== 'text';
  const pruned = merged.filter((b, i) => {
    if (b.kind !== 'text' || b.text !== '') return true;
    return !(isMedia(merged[i - 1]) || isMedia(merged[i + 1]));
  });

  // 3. The page always ends with a text block, so the writer can keep typing.
  if (pruned.length === 0 || pruned[pruned.length - 1].kind !== 'text') {
    pruned.push({ id: newId('txt'), kind: 'text', text: '' });
  }
  return pruned;
}

/**
 * Inserts a block at the cursor. If the cursor is inside a text block, that block
 * is split at the cursor. Returns the new blocks and a cursor placed just after
 * the inserted block, so the next insert continues in the right place.
 */
export function insertAtCursor(
  blocks: PageBlock[],
  cursor: Cursor | null,
  incoming: PageBlock,
): { blocks: PageBlock[]; cursor: Cursor } {
  let idx = cursor ? blocks.findIndex((b) => b.id === cursor.blockId) : -1;
  if (idx === -1) idx = blocks.length - 1;

  const target = blocks[idx];
  let next: PageBlock[];

  if (target?.kind === 'text') {
    const offset =
      cursor && cursor.blockId === target.id
        ? Math.min(Math.max(cursor.offset, 0), target.text.length)
        : target.text.length;
    const left: PageBlock = { ...target, text: target.text.slice(0, offset) };
    const right: PageBlock = { id: newId('txt'), kind: 'text', text: target.text.slice(offset) };
    next = [...blocks.slice(0, idx), left, incoming, right, ...blocks.slice(idx + 1)];
  } else {
    next = [...blocks.slice(0, idx + 1), incoming, ...blocks.slice(idx + 1)];
  }

  const normalized = normalizeBlocks(next);
  const at = normalized.findIndex((b) => b.id === incoming.id);
  const after = normalized[at + 1];
  const nextCursor: Cursor = {
    blockId: after?.kind === 'text' ? after.id : normalized[normalized.length - 1].id,
    offset: 0,
  };
  return { blocks: normalized, cursor: nextCursor };
}

/** Inserts plain text (for example "Today's prompt") at the cursor. */
export function insertTextAtCursor(
  blocks: PageBlock[],
  cursor: Cursor | null,
  text: string,
): { blocks: PageBlock[]; cursor: Cursor } {
  let idx = cursor ? blocks.findIndex((b) => b.id === cursor.blockId) : -1;
  if (idx === -1 || blocks[idx].kind !== 'text') idx = blocks.length - 1;
  const target = blocks[idx];
  const isText = target?.kind === 'text';
  const base = isText ? target.text : '';
  const offset = isText && cursor?.blockId === target.id
    ? Math.min(cursor.offset, base.length)
    : base.length;
  const sep = base.slice(0, offset).trim() ? '\n\n' : '';
  const inserted = sep + text;
  const updated = base.slice(0, offset) + inserted + base.slice(offset);
  const nextBlocks = blocks.map((b, i) =>
    i === idx && isText ? { ...b, text: updated } : b,
  );
  const id = isText ? target.id : newId('txt');
  const finalBlocks = isText ? nextBlocks : [...blocks, { id, kind: 'text' as const, text: updated }];
  return {
    blocks: normalizeBlocks(finalBlocks),
    cursor: { blockId: id, offset: offset + inserted.length },
  };
}

/** Plain text for search and list previews. Media and sketches are not searchable text. */
export function plainTextForSearch(blocks: PageBlock[]): string {
  return blocks
    .filter((b): b is Extract<PageBlock, { kind: 'text' }> => b.kind === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();
}

export type RenderRow =
  | { kind: 'text'; block: Extract<PageBlock, { kind: 'text' }> }
  | { kind: 'media-row'; blocks: Array<Exclude<PageBlock, { kind: 'text' }>> };

/** Consecutive media and sketch blocks share a row, which wraps like a grid. */
export function groupRows(blocks: PageBlock[]): RenderRow[] {
  const rows: RenderRow[] = [];
  for (const b of blocks) {
    if (b.kind === 'text') {
      rows.push({ kind: 'text', block: b });
      continue;
    }
    const last = rows[rows.length - 1];
    if (last?.kind === 'media-row') last.blocks.push(b);
    else rows.push({ kind: 'media-row', blocks: [b] });
  }
  return rows;
}

export function migrateLegacyEntry(
  content: string,
  layout: PageLayout,
  attachments: NoteAttachment[],
  legacyStrokes: SketchStroke[],
): PageDocument {
  if (layout.doc) return layout.doc;

  const blocks: PageBlock[] = [{ id: newId('txt'), kind: 'text', text: content ?? '' }];

  // Freeform positions are dropped. Media keep their order, at full width.
  for (const att of attachments) {
    blocks.push({
      id: newId('med'),
      kind: 'media',
      attachmentId: att.id,
      mediaType: att.type,
      size: 'full',
      breath: 'comfortable',
    });
  }
  if (legacyStrokes && legacyStrokes.length > 0) {
    blocks.push({ id: newId('skt'), kind: 'sketch', strokes: legacyStrokes, size: 'full', breath: 'comfortable' });
  }

  return {
    version: 2,
    accentColor: layout.accentColor,
    blocks: normalizeBlocks(blocks),
  };
}

