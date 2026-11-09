const test = require('node:test');
const assert = require('node:assert/strict');

// Minimal implementations mirroring src/types/journalLayout.ts for NodeJS CJS testing
function parsePageLayout(raw) {
  if (!raw || typeof raw !== 'string') {
    return { isFreeform: false, attachments: {} };
  }
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return {
        isFreeform: Boolean(parsed.isFreeform),
        sketch: parsed.sketch && typeof parsed.sketch === 'object' ? parsed.sketch : undefined,
        attachments: parsed.attachments && typeof parsed.attachments === 'object' ? parsed.attachments : {},
      };
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
      hideFooter: false,
      compact: true,
      zeroPad: false,
    },
    attachments: {
      att_1: { x: 20, y: 30, width: 140, height: 150 },
    },
  };
  const raw = JSON.stringify(sample);
  const parsed = parsePageLayout(raw);

  assert.equal(parsed.isFreeform, true);
  assert.equal(parsed.sketch?.x, 100);
  assert.equal(parsed.sketch?.hideHeader, true);
  assert.equal(parsed.sketch?.compact, true);
  assert.equal(parsed.attachments?.att_1?.x, 20);
});

test('serializePageLayout roundtrips with parsePageLayout', () => {
  const sample = {
    isFreeform: true,
    sketch: { x: 50, y: 75, width: 200, height: 180, zeroPad: true },
    attachments: {
      att_photo: { x: 10, y: 10, width: 150, height: 160 },
    },
  };
  const serialized = serializePageLayout(sample);
  const parsed = parsePageLayout(serialized);
  assert.deepEqual(parsed, sample);
});
