import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Storage } from '../services/storage';

/**
 * Global typography state for Calmly.
 *
 * The entire app renders text through ONE patched Text/TextInput layer (see
 * fontPatcher.ts). That layer subscribes to this store, so switching the font
 * here re-renders every piece of text in the app instantly — no remount, no
 * lost navigation state.
 */

export type FontCategory = 'handwritten' | 'sans' | 'serif' | 'display';

export interface FontFaces {
  regular: string;
  medium?: string;
  bold?: string;
  italic?: string;
}

export interface ActiveFont {
  /** Stable id: 'oddly-calming', 'plus-jakarta-sans', or 'google:Lora'. */
  key: string;
  label: string;
  category: FontCategory;
  source: 'bundled' | 'google';
  faces: FontFaces;
}

/** The always-available handwritten font shipped inside the app bundle. */
export const DEFAULT_FACES: FontFaces = {
  regular: 'OddlyCalming',
  medium: 'OddlyCalming',
  bold: 'OddlyCalming',
  italic: 'OddlyCalming',
};

export const DEFAULT_FONT: ActiveFont = {
  key: 'oddly-calming',
  label: 'Oddly Calming',
  category: 'handwritten',
  source: 'bundled',
  faces: DEFAULT_FACES,
};

export const FONT_PREFERENCE_KEY = 'app_font_key';

interface FontState {
  fontKey: string;
  active: ActiveFont;
  /** Bumped on every font change; useful for one-off re-render triggers. */
  revision: number;
  hydrated: boolean;
  setActive: (font: ActiveFont, options?: { persist?: boolean }) => void;
  hydrate: () => void;
}

export const useFontStore = create<FontState>((set) => ({
  fontKey: DEFAULT_FONT.key,
  active: DEFAULT_FONT,
  revision: 0,
  hydrated: false,
  setActive: (font, options) => {
    set((state) => ({
      active: font,
      fontKey: font.key,
      revision: state.revision + 1,
    }));
    if (options?.persist !== false) {
      Storage.setString(FONT_PREFERENCE_KEY, font.key);
      AsyncStorage.setItem(FONT_PREFERENCE_KEY, font.key).catch(() => {});
    }
  },
  hydrate: () => set({ hydrated: true }),
}));

/** Sync accessor for the patcher (callable outside React). */
export function getActiveFont(): ActiveFont {
  return useFontStore.getState().active;
}

/**
 * Face keys that the patcher must NOT override. Used so the font picker can
 * preview each family in its own typeface even while another font is active.
 * 'OddlyCalming' itself is intentionally NOT exempt: it is the legacy default
 * baked into old styles and must follow the active font.
 */
const exemptFaceKeys = new Set<string>();

export function registerExemptFaceKeys(keys: Iterable<string>) {
  for (const key of keys) exemptFaceKeys.add(key);
}

export function isExemptFaceKey(fontFamily?: string | null): boolean {
  if (!fontFamily || typeof fontFamily !== 'string') return false;
  return exemptFaceKeys.has(fontFamily);
}

/**
 * Resolves which registered face file should render for a given style,
 * preserving weight hierarchy (regular / medium / bold / italic) because each
 * face is a separate single-weight file.
 */
export function resolveFaceForWeight(
  faces: FontFaces,
  fontWeight?: unknown,
  fontStyle?: unknown,
  familyHint?: string | null,
): string {
  const isItalic =
    fontStyle === 'italic' ||
    (typeof familyHint === 'string' && /italic/i.test(familyHint));

  if (isItalic && faces.italic) return faces.italic;

  let numeric: number | undefined;

  if (typeof fontWeight === 'number') {
    numeric = fontWeight;
  } else if (typeof fontWeight === 'string') {
    if (/^\d+$/.test(fontWeight)) {
      numeric = parseInt(fontWeight, 10);
    } else {
      const lower = fontWeight.toLowerCase();
      if (lower.includes('bold')) numeric = 700;
      else if (lower.includes('semibold')) numeric = 600;
      else if (lower.includes('medium')) numeric = 500;
      else if (lower.includes('normal')) numeric = 400;
    }
  }

  // If style didn't have an explicit fontWeight, infer from legacy family name
  if (numeric === undefined && typeof familyHint === 'string') {
    const lower = familyHint.toLowerCase();
    if (lower.includes('extrabold') || lower.includes('black') || lower.includes('800') || lower.includes('900')) {
      numeric = 800;
    } else if (lower.includes('bold') || lower.includes('700')) {
      numeric = 700;
    } else if (lower.includes('semibold') || lower.includes('600')) {
      numeric = 600;
    } else if (lower.includes('medium') || lower.includes('500')) {
      numeric = 500;
    }
  }

  if (numeric !== undefined) {
    if (numeric >= 600 && faces.bold) return faces.bold;
    if (numeric >= 500 && faces.medium) return faces.medium;
    if (numeric >= 500 && faces.bold) return faces.bold;
  }
  return faces.regular;
}

