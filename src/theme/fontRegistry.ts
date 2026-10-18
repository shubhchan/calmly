import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_400Regular_Italic,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import {
  Newsreader_400Regular,
  Newsreader_400Regular_Italic,
  Newsreader_500Medium,
  Newsreader_600SemiBold,
  Newsreader_700Bold,
} from '@expo-google-fonts/newsreader';
import { PatrickHand_400Regular } from '@expo-google-fonts/patrick-hand';
import { Doto_400Regular, Doto_500Medium, Doto_700Bold } from '@expo-google-fonts/doto';
import { Handjet_400Regular, Handjet_500Medium, Handjet_700Bold } from '@expo-google-fonts/handjet';
import { ActiveFont, FontCategory, registerExemptFaceKeys } from './fontStore';

/**
 * Fonts that ship inside the app bundle — always available offline and offered
 * at the top of the font picker. Anything else is downloaded on demand through
 * the Google Fonts service (see src/services/googleFonts.ts).
 */
export interface BundledFont extends ActiveFont {
  description: string;
  /** Map of registered face name -> asset module for expo-font's useFonts(). */
  assets: Record<string, number>;
}

export const BUNDLED_FONTS: BundledFont[] = [
  {
    key: 'plus-jakarta-sans',
    label: 'Plus Jakarta Sans',
    description: 'Clean and friendly modern humanist sans — Calmly default',
    category: 'sans',
    source: 'bundled',
    faces: {
      regular: 'PlusJakartaSans_400Regular',
      medium: 'PlusJakartaSans_500Medium',
      bold: 'PlusJakartaSans_700Bold',
      italic: 'PlusJakartaSans_400Regular_Italic',
    },
    assets: {
      PlusJakartaSans_400Regular,
      PlusJakartaSans_400Regular_Italic,
      PlusJakartaSans_500Medium,
      PlusJakartaSans_600SemiBold,
      PlusJakartaSans_700Bold,
    },
  },
  {
    key: 'newsreader',
    label: 'Newsreader',
    description: 'Warm editorial serif for slow, mindful reading',
    category: 'serif',
    source: 'bundled',
    faces: {
      regular: 'Newsreader_400Regular',
      medium: 'Newsreader_500Medium',
      bold: 'Newsreader_700Bold',
      italic: 'Newsreader_400Regular_Italic',
    },
    assets: {
      Newsreader_400Regular,
      Newsreader_400Regular_Italic,
      Newsreader_500Medium,
      Newsreader_600SemiBold,
      Newsreader_700Bold,
    },
  },
  {
    key: 'patrick-hand',
    label: 'Patrick Hand',
    description: 'Loose casual marker for playful notes',
    category: 'handwritten',
    source: 'bundled',
    faces: {
      regular: 'PatrickHand_400Regular',
    },
    assets: {
      PatrickHand_400Regular,
    },
  },
  {
    key: 'doto',
    label: 'Doto',
    description: 'Dot-matrix display — Nothing-phone style',
    category: 'display',
    source: 'bundled',
    faces: {
      regular: 'Doto_400Regular',
      medium: 'Doto_500Medium',
      bold: 'Doto_700Bold',
    },
    assets: {
      Doto_400Regular,
      Doto_500Medium,
      Doto_700Bold,
    },
  },
  {
    key: 'handjet',
    label: 'Handjet',
    description: 'Pixel-grid display — Nothing 5x7 style',
    category: 'display',
    source: 'bundled',
    faces: {
      regular: 'Handjet_400Regular',
      medium: 'Handjet_500Medium',
      bold: 'Handjet_700Bold',
    },
    assets: {
      Handjet_400Regular,
      Handjet_500Medium,
      Handjet_700Bold,
    },
  },
];

/** Combined useFonts() map for App boot: face key -> asset module. */
export function getBundledFontAssets(): Record<string, number> {
  const assets: Record<string, number> = {};
  for (const font of BUNDLED_FONTS) {
    Object.assign(assets, font.assets);
  }
  return assets;
}

export function getBundledFont(key: string): BundledFont | undefined {
  return BUNDLED_FONTS.find((font) => font.key === key);
}

/** Every bundled face, so font previews can render each family in its own typeface. */
const bundledExemptKeys = BUNDLED_FONTS.flatMap((font) =>
  Object.values(font.faces).filter((face): face is string => Boolean(face)),
);
registerExemptFaceKeys(bundledExemptKeys);

export const FONT_CATEGORY_LABELS: Record<FontCategory, string> = {
  handwritten: 'Handwriting',
  sans: 'Sans',
  serif: 'Serif',
  display: 'Display',
};

/** Maps Google's metadata category strings to our internal categories. */
export function normalizeGoogleCategory(raw?: string): FontCategory {
  switch ((raw ?? '').toUpperCase()) {
    case 'HANDWRITING':
      return 'handwritten';
    case 'SERIF':
      return 'serif';
    case 'DISPLAY':
      return 'display';
    default:
      return 'sans';
  }
}
