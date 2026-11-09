export interface ElementLayout {
  x: number;
  y: number;
  width: number;
  height: number;
  hideHeader?: boolean;
  hideFooter?: boolean;
  compact?: boolean;
  zeroPad?: boolean;
  visible?: boolean;
}

export interface PageLayout {
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

export function serializePageLayout(layout: PageLayout): string {
  try {
    return JSON.stringify(layout);
  } catch {
    return '{}';
  }
}

