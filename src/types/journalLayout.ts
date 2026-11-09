import type { PageDocument } from '../features/journal/pageBlocks';

export interface ElementLayout {
  x: number;
  y: number;
  width: number;
  height: number;
  xFrac?: number;
  widthFrac?: number;
  hideHeader?: boolean;
  hideFooter?: boolean;
  compact?: boolean;
  zeroPad?: boolean;
  visible?: boolean;
}

export interface PageLayout {
  accentColor?: string;
  doc?: PageDocument; // version 2 entries
  // legacy fields, read only for migration:
  isFreeform?: boolean;
  sketch?: ElementLayout;
  attachments?: { [id: string]: ElementLayout };
}

export function parsePageLayout(raw?: string | null): PageLayout {
  if (!raw || typeof raw !== 'string') {
    return { isFreeform: false, attachments: {} };
  }
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      const result: PageLayout = {
        isFreeform: Boolean(parsed.isFreeform),
        sketch: parsed.sketch && typeof parsed.sketch === 'object' ? parsed.sketch : undefined,
        attachments: parsed.attachments && typeof parsed.attachments === 'object' ? parsed.attachments : {},
      };
      if (typeof parsed.accentColor === 'string') {
        result.accentColor = parsed.accentColor;
      }
      if (parsed.doc && typeof parsed.doc === 'object') {
        result.doc = parsed.doc as PageDocument;
      }
      return result;
    }
  } catch {
    // Return empty layout if parsing fails
  }
  return { isFreeform: false, attachments: {} };
}

export function serializePageLayout(layout: PageLayout): string {
  try {
    return JSON.stringify(layout);
  } catch {
    return '{}';
  }
}
