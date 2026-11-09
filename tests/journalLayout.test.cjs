const test = require('node:test');
const assert = require('node:assert/strict');

function parsePageLayout(raw) {
  if (!raw || typeof raw !== 'string') {
    return { isFreeform: false, attachments: {} };
  }
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      const result = {
        isFreeform: Boolean(parsed.isFreeform),
        sketch: parsed.sketch && typeof parsed.sketch === 'object' ? parsed.sketch : undefined,
        attachments: parsed.attachments && typeof parsed.attachments === 'object' ? parsed.attachments : {},
      };
      if (typeof parsed.accentColor === 'string') {
        result.accentColor = parsed.accentColor;
      }
      if (parsed.doc && typeof parsed.doc === 'object') {
        result.doc = parsed.doc;
      }
      return result;
    }
  } catch {
    // Return empty layout if parsing fails
  }
  return { isFreeform: false, attachments: {} };
}

function serializePageLayout(layout) {
  try {
    return JSON.stringify(layout);
  } catch {
    return '{}';
  }
}

// Block and document helpers to test version 2 inline blocks logic
function normalizeBlocks(input) {
  const merged = [];
  for (const b of input) {
    const prev = merged[merged.length - 1];
    if (b.kind === 'text' && prev?.kind === 'text') {
      merged[merged.length - 1] = { ...prev, text: prev.text + b.text };
    } else {
      merged.push(b);
    }
  }

  const isMedia = (b) => !!b && b.kind !== 'text';
  const pruned = merged.filter((b, i) => {
    if (b.kind !== 'text' || b.text !== '') return true;
    return !(isMedia(merged[i - 1]) || isMedia(merged[i + 1]));
  });

  if (pruned.length === 0 || pruned[pruned.length - 1].kind !== 'text') {
    pruned.push({ id: 'txt_last', kind: 'text', text: '' });
  }
  return pruned;
}

function insertAtCursor(blocks, cursor, incoming) {
  let idx = cursor ? blocks.findIndex((b) => b.id === cursor.blockId) : -1;
  if (idx === -1) idx = blocks.length - 1;

  const target = blocks[idx];
  let next;

  if (target?.kind === 'text') {
    const offset =
      cursor && cursor.blockId === target.id
        ? Math.min(Math.max(cursor.offset, 0), target.text.length)
        : target.text.length;
    const left = { ...target, text: target.text.slice(0, offset) };
    const right = { id: 'txt_right', kind: 'text', text: target.text.slice(offset) };
    next = [...blocks.slice(0, idx), left, incoming, right, ...blocks.slice(idx + 1)];
  } else {
    next = [...blocks.slice(0, idx + 1), incoming, ...blocks.slice(idx + 1)];
  }

  const normalized = normalizeBlocks(next);
  const at = normalized.findIndex((b) => b.id === incoming.id);
  const after = normalized[at + 1];
  const nextCursor = {
    blockId: after?.kind === 'text' ? after.id : normalized[normalized.length - 1].id,
    offset: 0,
  };
  return { blocks: normalized, cursor: nextCursor };
}

function plainTextForSearch(blocks) {
  return blocks
    .filter((b) => b.kind === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();
}

function migrateLegacyEntry(content, layout, attachments, legacyStrokes) {
  if (layout.doc) return layout.doc;

  const blocks = [{ id: 'txt_1', kind: 'text', text: content ?? '' }];

  for (const att of attachments) {
    blocks.push({
      id: `med_${att.id}`,
      kind: 'media',
      attachmentId: att.id,
      mediaType: att.type,
      size: 'full',
      breath: 'comfortable',
    });
  }
  if (legacyStrokes && legacyStrokes.length > 0) {
    blocks.push({ id: 'skt_1', kind: 'sketch', strokes: legacyStrokes, size: 'full', breath: 'comfortable' });
  }

  return {
    version: 2,
    accentColor: layout.accentColor,
    blocks: normalizeBlocks(blocks),
  };
}

test('parsePageLayout returns default values when raw is null/empty/invalid', () => {
  assert.deepEqual(parsePageLayout(null), { isFreeform: false, attachments: {} });
  assert.deepEqual(parsePageLayout(''), { isFreeform: false, attachments: {} });
  assert.deepEqual(parsePageLayout('invalid json'), { isFreeform: false, attachments: {} });
});

test('parsePageLayout correctly parses valid freeform layout with sketch and attachments', () => {
  const sample = {
    isFreeform: true,
    sketch: {
      x: 100,
      y: 200,
      width: 224,
      height: 206,
      hideHeader: true,
    },
    attachments: {
      att1: {
        x: 10,
        y: 20,
        width: 150,
        height: 120,
        xFrac: 0.25,
        widthFrac: 0.5,
      },
    },
    accentColor: '#2C4F45',
  };

  const parsed = parsePageLayout(JSON.stringify(sample));
  assert.equal(parsed.isFreeform, true);
  assert.equal(parsed.accentColor, '#2C4F45');
  assert.deepEqual(parsed.sketch, sample.sketch);
  assert.deepEqual(parsed.attachments, sample.attachments);
});

test('serializePageLayout roundtrips with parsePageLayout', () => {
  const layout = {
    isFreeform: false,
    accentColor: '#D2B078',
    sketch: { x: 0, y: 0, width: 300, height: 200 },
    attachments: {},
  };
  const serialized = serializePageLayout(layout);
  const roundtripped = parsePageLayout(serialized);
  assert.deepEqual(roundtripped, layout);
});

test('PageDocument version 2 serialization and migration', () => {
  const legacyLayout = {
    isFreeform: false,
    accentColor: '#4A6B5D',
  };
  const attachments = [
    { id: 'photo_1', type: 'image', uri: 'file://photo.jpg', name: 'photo' },
  ];
  const legacyStrokes = [{ points: [{ x: 10, y: 10 }], color: '#000', strokeWidth: 2 }];

  const doc = migrateLegacyEntry('Hello journal', legacyLayout, attachments, legacyStrokes);
  assert.equal(doc.version, 2);
  assert.equal(doc.accentColor, '#4A6B5D');
  assert.equal(doc.blocks.length, 4); // text, media, sketch, trailing text
  assert.equal(doc.blocks[0].kind, 'text');
  assert.equal(doc.blocks[0].text, 'Hello journal');
  assert.equal(doc.blocks[1].kind, 'media');
  assert.equal(doc.blocks[2].kind, 'sketch');
  assert.equal(doc.blocks[3].kind, 'text');

  const serialized = serializePageLayout({ accentColor: doc.accentColor, doc });
  const parsed = parsePageLayout(serialized);
  assert.deepEqual(parsed.doc, doc);
});

test('insertAtCursor splits text block and updates cursor', () => {
  const initialBlocks = [{ id: 'txt_0', kind: 'text', text: 'Hello World' }];
  const cursor = { blockId: 'txt_0', offset: 5 };
  const incoming = { id: 'img_1', kind: 'media', attachmentId: 'att_1', mediaType: 'image', size: 'half', breath: 'comfortable' };

  const { blocks, cursor: newCursor } = insertAtCursor(initialBlocks, cursor, incoming);
  assert.equal(blocks.length, 3);
  assert.equal(blocks[0].text, 'Hello');
  assert.equal(blocks[1].id, 'img_1');
  assert.equal(blocks[2].text, ' World');
  assert.equal(newCursor.blockId, blocks[2].id);
  assert.equal(newCursor.offset, 0);

  const plain = plainTextForSearch(blocks);
  assert.equal(plain, 'Hello\n World');
});
