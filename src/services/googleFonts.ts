import { Platform } from 'react-native';
import * as Font from 'expo-font';
import { Directory, File, Paths } from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Storage } from './storage';
import {
  ActiveFont,
  FONT_PREFERENCE_KEY,
  FontFaces,
  registerExemptFaceKeys,
  useFontStore,
} from '../theme/fontStore';
import { getBundledFont, normalizeGoogleCategory } from '../theme/fontRegistry';

/**
 * Google Fonts integration.
 *
 * Native (iOS/Android):
 *  1. Fetch the public font catalog once (fonts.google.com/metadata/fonts) and
 *     cache it in MMKV — no API key required.
 *  2. For a family, request the CSS with a legacy User-Agent so Google serves
 *     static TTF URLs (the modern API only serves woff2, which RN can't load).
 *  3. Download the TTFs into the app's document directory and register them
 *     with expo-font. Downloads persist, so the chosen font keeps working
 *     fully offline on every subsequent launch.
 *
 * Web: inject the Google Fonts stylesheet <link> and use the family name
 * directly (browsers handle webfont loading natively).
 */

const CATALOG_CACHE_KEY = 'gf_catalog_v1';
const CATALOG_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CATALOG_URL = 'https://fonts.google.com/metadata/fonts';
const CSS_BASE_URL = 'https://fonts.googleapis.com/css2';
// Non-browser UA => Google Fonts serves static TTF URLs. Browser-era UAs get
// woff2 (RN cannot render) and IE-era UAs now get EOT via /l/font `kit` URLs
// (also unloadable by expo-font). This matches React Native's own runtime UA.
const TTF_USER_AGENT = 'okhttp/4.9.0';
const MANIFEST_PREFIX = 'gf_manifest_v1_';

export interface GoogleFontSummary {
  family: string;
  category: ActiveFont['category'];
  popularity: number;
}

interface FontManifest {
  family: string;
  weights: number[];
  faces: FontFaces;
}

interface ParsedFace {
  weight: number;
  italic: boolean;
  url: string;
}

const loadedFamilies = new Map<string, FontFaces>();
const inFlight = new Map<string, Promise<FontFaces>>();
const warnedFamilies = new Set<string>();
const resolvedFaceCache = new Map<string, ParsedFace[]>();
const familyTasks = new Map<string, Promise<unknown>>();

// ---------------------------------------------------------------------------
// Small concurrency pool so the picker's lazy previews never fire 100 parallel
// downloads at once.
// ---------------------------------------------------------------------------
const MAX_CONCURRENT = 3;
let running = 0;
const waiters: Array<() => void> = [];

function withSlot<T>(task: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const run = () => {
      running += 1;
      task()
        .then(resolve, reject)
        .finally(() => {
          running -= 1;
          const next = waiters.shift();
          if (next) next();
        });
    };
    if (running < MAX_CONCURRENT) run();
    else waiters.push(run);
  });
}

/**
 * Serializes download work per family. A lazy preview (weight 400) can be in
 * flight when the user taps to apply the same family — without this queue both
 * tasks would race on the same target file and one would fail.
 */
function enqueueForFamily<T>(family: string, task: () => Promise<T>): Promise<T> {
  const prev = familyTasks.get(family) ?? Promise.resolve();
  const next = prev.then(task, task);
  const tail = next
    .then(
      () => undefined,
      () => undefined,
    )
    .then(() => {
      if (familyTasks.get(family) === tail) familyTasks.delete(family);
    });
  familyTasks.set(family, tail);
  return next;
}

function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = 10000): Promise<Response> {
  return Promise.race([
    fetch(url, init),
    new Promise<Response>((_, reject) => setTimeout(() => reject(new Error(`Request timed out: ${url}`)), timeoutMs)),
  ]);
}

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

function parseCatalogJson(raw: string): GoogleFontSummary[] {
  const cleaned = raw.replace(/^\)\]\}'\s*/, '');
  const parsed = JSON.parse(cleaned);
  const list: any[] = parsed?.familyMetadataList ?? [];
  return list
    .filter((item) => item?.family && item?.fonts?.['400'])
    .map((item, index) => ({
      family: String(item.family),
      category: normalizeGoogleCategory(item.category),
      popularity: typeof item.popularity === 'number' ? item.popularity : index,
    }))
    .sort((a, b) => a.popularity - b.popularity);
}

/** Minimal offline list — names only; actual fonts still require one download. */
const OFFLINE_FALLBACK_CATALOG: GoogleFontSummary[] = [
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 'Nunito',
  'Quicksand', 'Dancing Script', 'Caveat', 'Lora', 'Merriweather', 'Playfair Display',
  'Work Sans', 'Raleway', 'Rubik', 'Oswald', 'Karla', 'Manrope', 'Sora',
].map((family, index) => ({ family, category: 'sans' as const, popularity: index }));

let catalogMemory: GoogleFontSummary[] | null = null;

export async function getFontCatalog(options?: { forceRefresh?: boolean }): Promise<GoogleFontSummary[]> {
  if (catalogMemory && !options?.forceRefresh) return catalogMemory;

  const cached = Storage.getObject<{ savedAt: number; fonts: GoogleFontSummary[] }>(CATALOG_CACHE_KEY);
  const cacheFresh = cached && Date.now() - cached.savedAt < CATALOG_CACHE_TTL_MS;

  if (cacheFresh) {
    catalogMemory = cached!.fonts;
    return catalogMemory;
  }

  try {
    const response = await fetchWithTimeout(CATALOG_URL, { headers: { 'User-Agent': TTF_USER_AGENT } }, 12000);
    if (!response.ok) throw new Error(`Catalog request failed: ${response.status}`);
    const text = await response.text();
    const fonts = parseCatalogJson(text);
    if (fonts.length === 0) throw new Error('Catalog empty');
    Storage.setObject(CATALOG_CACHE_KEY, { savedAt: Date.now(), fonts });
    catalogMemory = fonts;
    return fonts;
  } catch (error) {
    console.warn('Google Fonts catalog unavailable, using cache/fallback:', error);
    if (cached?.fonts?.length) {
      catalogMemory = cached.fonts;
      return catalogMemory;
    }
    catalogMemory = OFFLINE_FALLBACK_CATALOG;
    return catalogMemory;
  }
}

// ---------------------------------------------------------------------------
// CSS -> TTF URL resolution
// ---------------------------------------------------------------------------

function buildCssUrl(family: string, weights: number[]): string {
  const familyParam = family.trim().replace(/\s+/g, '+');
  return `${CSS_BASE_URL}?family=${familyParam}:wght@${weights.join(';')}&display=swap`;
}

function parseFontFaceBlocks(css: string): ParsedFace[] {
  const faces: ParsedFace[] = [];
  const blocks = css.split('@font-face');
  for (const block of blocks.slice(1)) {
    const urlMatch = block.match(/url\((https:[^)]+)\)/i);
    if (!urlMatch) continue;
    const url = urlMatch[1].replace(/['"]/g, '').trim();
    const usable =
      /\.(?:ttf|otf)(?:\?|$)/i.test(url) ||
      /format\(\s*['"](?:truetype|opentype)['"]\s*\)/i.test(block);
    if (!usable) continue;
    const weightMatch = block.match(/font-weight:\s*(\d+)/i);
    const italic = /font-style:\s*italic/i.test(block);
    faces.push({
      weight: weightMatch ? parseInt(weightMatch[1], 10) : 400,
      italic,
      url,
    });
  }
  return faces;
}

async function resolveTtfFaces(family: string): Promise<ParsedFace[]> {
  const cached = resolvedFaceCache.get(family);
  if (cached) return cached;

  const attempts: number[][] = [[400, 500, 600, 700], [400, 700], [400]];
  for (const weights of attempts) {
    try {
      const response = await fetchWithTimeout(
        buildCssUrl(family, weights),
        { headers: { 'User-Agent': TTF_USER_AGENT } },
        12000,
      );
      if (!response.ok) continue;
      const css = await response.text();
      // Families with several subsets emit one block per weight per subset;
      // keep the last (latin) block per weight so downloads never collide.
      const byWeight = new Map<number, ParsedFace>();
      for (const face of parseFontFaceBlocks(css)) {
        if (!face.italic) byWeight.set(face.weight, face);
      }
      const faces = Array.from(byWeight.values());
      if (faces.length > 0) {
        resolvedFaceCache.set(family, faces);
        return faces;
      }
    } catch {
      // try the next weight set
    }
  }
  throw new Error(`Could not resolve font files for ${family}`);
}

// ---------------------------------------------------------------------------
// Download + registration (native)
// ---------------------------------------------------------------------------

function faceKeyFor(family: string, weight: number): string {
  const compact = family.replace(/[^A-Za-z0-9]/g, '');
  switch (weight) {
    case 400:
      return `${compact}_400Regular`;
    case 500:
      return `${compact}_500Medium`;
    case 600:
      return `${compact}_600SemiBold`;
    case 700:
      return `${compact}_700Bold`;
    default:
      return `${compact}_${weight}`;
  }
}

function fontDirectory(family: string): Directory {
  const safe = family.replace(/[^A-Za-z0-9]/g, '_');
  return new Directory(Paths.document, 'google-fonts', safe);
}

const DOWNLOAD_TIMEOUT_MS = 30000;

async function downloadFace(dir: Directory, face: ParsedFace): Promise<{ weight: number; uri: string }> {
  const fileName = `${face.weight}.ttf`;
  const target = new File(dir, fileName);
  if (!target.exists) {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        File.downloadFileAsync(face.url, target, { idempotent: true }),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error(`Download timed out: ${face.url}`)), DOWNLOAD_TIMEOUT_MS);
        }),
      ]);
    } catch (error) {
      // A concurrent task may have produced the file while we waited; that is fine.
      if (!target.exists) throw error;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
  return { weight: face.weight, uri: target.uri };
}

function buildFacesFromWeights(family: string, availableWeights: number[]): FontFaces {
  const has = (w: number) => availableWeights.includes(w);
  const pick = (candidates: number[], fallback: number) => candidates.find(has) ?? fallback;
  const regularWeight = pick([400], 400);
  const mediumWeight = pick([500, 600, 400], regularWeight);
  const boldWeight = pick([700, 600, 500, 400], regularWeight);
  return {
    regular: faceKeyFor(family, regularWeight),
    medium: faceKeyFor(family, mediumWeight),
    bold: faceKeyFor(family, boldWeight),
  };
}

function loadManifest(family: string): FontManifest | undefined {
  return Storage.getObject<FontManifest>(`${MANIFEST_PREFIX}${family}`);
}

function weightForFaceKey(key: string | undefined): number | undefined {
  if (!key) return undefined;
  const match = key.match(/_(\d+)[A-Za-z]+$/);
  return match ? parseInt(match[1], 10) : undefined;
}

/** The manifest stores face keys; file URIs are re-derived from the document
 * directory each boot so they can never go stale across app updates. */
async function loadFacesFromManifest(family: string, manifest: FontManifest): Promise<FontFaces | null> {
  const dir = fontDirectory(family);
  const fontMap: Record<string, Font.FontSource> = {};
  const uniqueKeys = Array.from(
    new Set([manifest.faces.regular, manifest.faces.medium, manifest.faces.bold].filter(Boolean)),
  ) as string[];
  for (const key of uniqueKeys) {
    const weight = weightForFaceKey(key) ?? 400;
    const file = new File(dir, `${weight}.ttf`);
    if (file.exists) fontMap[key] = { uri: file.uri };
  }
  if (!fontMap[manifest.faces.regular]) return null;
  registerExemptFaceKeys(Object.keys(fontMap));
  await Font.loadAsync(fontMap);
  loadedFamilies.set(family, manifest.faces);
  return manifest.faces;
}

async function loadNativeGoogleFont(family: string, options: EnsureFontOptions = {}): Promise<FontFaces> {
  let manifest = loadManifest(family);
  if (!manifest) {
    try {
      const raw = await AsyncStorage.getItem(`${MANIFEST_PREFIX}${family}`);
      if (raw) {
        manifest = JSON.parse(raw);
        if (manifest) Storage.setObject<FontManifest>(`${MANIFEST_PREFIX}${family}`, manifest);
      }
    } catch {}
  }
  if (manifest?.faces?.regular) {
    const restored = await loadFacesFromManifest(family, manifest);
    if (restored) return restored;
    // Files missing (cache cleared / app updated): fall through to re-download.
  }

  return enqueueForFamily(family, async () => {
    // A queued task for the same family may have finished the download while
    // we waited for our turn.
    let raced = loadManifest(family);
    if (!raced) {
      try {
        const raw = await AsyncStorage.getItem(`${MANIFEST_PREFIX}${family}`);
        if (raw) raced = JSON.parse(raw);
      } catch {}
    }
    if (raced?.faces?.regular) {
      const restored = await loadFacesFromManifest(family, raced);
      if (restored) return restored;
    }

    const faces = await resolveTtfFaces(family);
    const dir = fontDirectory(family);
    try {
      dir.create({ intermediates: true, idempotent: true });
    } catch {
      // Directory may already exist; downloadFileAsync below will surface real errors.
    }

    const wanted = options.previewOnly ? [400] : faces.map((face) => face.weight);
    const chosen = faces.filter((face) => wanted.includes(face.weight));
    const limited = options.previewOnly ? chosen.slice(0, 1) : chosen;

    const downloaded = await Promise.all(limited.map((face) => withSlot(() => downloadFace(dir, face))));
    const weights = downloaded.map((item) => item.weight).sort((a, b) => a - b);

    const fontMap: Record<string, Font.FontSource> = {};
    for (const item of downloaded) {
      fontMap[faceKeyFor(family, item.weight)] = { uri: item.uri };
    }
    registerExemptFaceKeys(Object.keys(fontMap));
    await Font.loadAsync(fontMap);

    const resolved: FontFaces = options.previewOnly
      ? { regular: faceKeyFor(family, 400) }
      : buildFacesFromWeights(family, weights);

    if (!options.previewOnly) {
      Storage.setObject<FontManifest>(`${MANIFEST_PREFIX}${family}`, { family, weights, faces: resolved });
      AsyncStorage.setItem(`${MANIFEST_PREFIX}${family}`, JSON.stringify({ family, weights, faces: resolved })).catch(() => {});
      loadedFamilies.set(family, resolved);
    }
    return resolved;
  });
}

function loadWebGoogleFont(family: string): FontFaces {
  const doc: any = (globalThis as any).document;
  if (doc?.head) {
    const id = `gf-${family.replace(/[^A-Za-z0-9]/g, '-')}`;
    if (!doc.getElementById(id)) {
      const link = doc.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = buildCssUrl(family, [400, 500, 600, 700]);
      doc.head.appendChild(link);
    }
  }
  // Web resolves weight via the stylesheet; the patcher normalizes weight to
  // 'normal', matching the app's existing single-face behavior on web.
  return { regular: family, medium: family, bold: family, italic: family };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface EnsureFontOptions {
  previewOnly?: boolean;
  category?: ActiveFont['category'];
}

function toActiveFont(family: string, faces: FontFaces, category?: ActiveFont['category']): ActiveFont {
  return {
    key: `google:${family}`,
    label: family,
    category: category ?? 'sans',
    source: 'google',
    faces,
  };
}

/**
 * Makes a Google family renderable (downloads once, then loads from disk).
 * Returns the resolved face keys.
 */
export async function ensureGoogleFontFaces(family: string, options?: EnsureFontOptions): Promise<FontFaces> {
  const cached = loadedFamilies.get(family);
  if (cached && !options?.previewOnly) return cached;

  const key = `${family}:${options?.previewOnly ? 'preview' : 'full'}`;
  const pending = inFlight.get(key);
  if (pending) return pending;

  const promise = (async () => {
    try {
      if (Platform.OS === 'web') return loadWebGoogleFont(family);
      return await loadNativeGoogleFont(family, options);
    } catch (error) {
      if (!warnedFamilies.has(family)) {
        warnedFamilies.add(family);
        console.warn(`Failed to load Google font "${family}":`, error);
      }
      throw error;
    } finally {
      inFlight.delete(key);
    }
  })();

  inFlight.set(key, promise);
  return promise;
}

/** Loads (if needed) and applies a Google font as the app-wide typeface. */
export async function applyGoogleFont(family: string, category?: ActiveFont['category']): Promise<ActiveFont> {
  const faces = await ensureGoogleFontFaces(family);
  const active = toActiveFont(family, faces, category);
  useFontStore.getState().setActive(active);
  return active;
}

/** Applies one of the bundled fonts as the app-wide typeface. */
export function applyBundledFont(key: string): boolean {
  const bundled = getBundledFont(key);
  if (!bundled) return false;
  useFontStore.getState().setActive(bundled);
  return true;
}

/**
 * Restores the persisted font choice at boot. Runs after bundled fonts load.
 * Failures fall back silently to the bundled handwritten default.
 */
export async function restoreSavedFont(): Promise<void> {
  try {
    let savedKey = Storage.getString(FONT_PREFERENCE_KEY);
    if (!savedKey) {
      savedKey = (await AsyncStorage.getItem(FONT_PREFERENCE_KEY)) ?? undefined;
    }
    if (!savedKey || savedKey === 'oddly-calming') return;

    const bundled = getBundledFont(savedKey);
    if (bundled) {
      useFontStore.getState().setActive(bundled, { persist: false });
      return;
    }

    if (savedKey.startsWith('google:')) {
      const family = savedKey.slice('google:'.length);
      const faces = await ensureGoogleFontFaces(family);
      useFontStore.getState().setActive(toActiveFont(family, faces), { persist: false });
    }
  } catch (error) {
    console.warn('Could not restore saved font, keeping default:', error);
  }
}

/** True when the family has been fully downloaded and can be used offline. */
export function isFontDownloaded(family: string): boolean {
  return Boolean(loadManifest(family));
}
