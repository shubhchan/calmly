/**
 * The paper a page is written on.
 *
 * Each paper pairs a color and a texture with a feeling, so the page can carry
 * an emotion the words do not have to name. Papers are a visual choice only —
 * they never change what a page means or how it is searched.
 */

export type PaperTextureKind = 'none' | 'rain' | 'rule' | 'dots' | 'wash';

export type PaperId = 'mist' | 'rain' | 'dawn' | 'moss' | 'dusk' | 'ember';

export interface PaperStyle {
  id: PaperId;
  name: string;
  feeling: string;
  light: string;
  dark: string;
  texture: PaperTextureKind;
  accent: string;
  inkText: string;
}

export const PAPERS: PaperStyle[] = [
  {
    id: 'mist',
    name: 'Mist',
    feeling: 'Quiet',
    light: '#F8F9F5',
    dark: '#171E1B',
    texture: 'none',
    accent: '#46524C',
    inkText: 'All is quiet',
  },
  {
    id: 'rain',
    name: 'Rain',
    feeling: 'Heavy',
    light: '#EDF2F6',
    dark: '#151C21',
    texture: 'rain',
    accent: '#466B78',
    inkText: 'It has been heavy',
  },
  {
    id: 'dawn',
    name: 'Dawn',
    feeling: 'Grateful',
    light: '#FBF2E7',
    dark: '#211B14',
    texture: 'rule',
    accent: '#B08A4F',
    inkText: 'Thankful for this',
  },
  {
    id: 'moss',
    name: 'Moss',
    feeling: 'Steady',
    light: '#EFF4ED',
    dark: '#161F18',
    texture: 'dots',
    accent: '#2C4F45',
    inkText: 'One small thing',
  },
  {
    id: 'dusk',
    name: 'Dusk',
    feeling: 'Tender',
    light: '#F3EFF6',
    dark: '#1C1821',
    texture: 'wash',
    accent: '#7A5B8A',
    inkText: 'Soft twilight',
  },
  {
    id: 'ember',
    name: 'Ember',
    feeling: 'Warm',
    light: '#FAEFE9',
    dark: '#221712',
    texture: 'wash',
    accent: '#B86B4D',
    inkText: 'Warm embers',
  },
];

/** Four primary papers shown on the sheet; Dusk and Ember sit under 'More papers'. */
export const PRIMARY_PAPERS = PAPERS.slice(0, 4);
export const MORE_PAPERS = PAPERS.slice(4);

export const ACCENT_COLORS = [
  { id: 'deep-pine', name: 'Forest', color: '#2C4F45' },
  { id: 'dawn-gold', name: 'Gold', color: '#B08A4F' },
  { id: 'moss-sage', name: 'Sage', color: '#4D6B5E' },
  { id: 'rain-slate', name: 'Slate', color: '#466B78' },
  { id: 'dusk-lavender', name: 'Lavender', color: '#7A5B8A' },
  { id: 'ember-clay', name: 'Clay', color: '#B86B4D' },
];

export function paperById(id?: string | null): PaperStyle {
  return PAPERS.find((paper) => paper.id === id) ?? PAPERS[2]; // Default to Dawn as shown in mocks
}

export function paperColor(paper: PaperStyle, isDark: boolean): string {
  return isDark ? paper.dark : paper.light;
}

/** Pen colors offered on the drawing pad. */
export function sketchInks(isDark: boolean, customAccent?: string): { id: string; color: string }[] {
  const base = [
    { id: 'ink', color: isDark ? '#9AC6B4' : '#2C4F45' },
    { id: 'sage', color: isDark ? '#7FA394' : '#4D6B5E' },
    { id: 'reed', color: isDark ? '#D2B078' : '#B08A4F' },
  ];
  if (customAccent && !base.some((b) => b.color.toLowerCase() === customAccent.toLowerCase())) {
    base.push({ id: 'accent', color: customAccent });
  }
  return base;
}

/** Line height shared by the page text and the ruled texture so writing sits on the lines. */
export const PAPER_LINE_HEIGHT = 28;
/** Font size used for page body text. */
export const PAPER_BODY_SIZE = 16;

const INK_DARK = '#1B2420'; // near-black with a green tint, from the Forest palette
const INK_LIGHT = '#F4F7F3';

function hexToRgb(hex: string) {
  let c = (hex || '#000000').replace('#', '');
  if (c.length === 3) c = c.split('').map((ch) => ch + ch).join('');
  return {
    r: parseInt(c.slice(0, 2), 16) || 0,
    g: parseInt(c.slice(2, 4), 16) || 0,
    b: parseInt(c.slice(4, 6), 16) || 0,
  };
}

export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const ch = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

export function mixHex(a: string, b: string, t: number): string {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  const m = (x: number, y: number) => Math.round(x + (y - x) * t);
  const to = (n: number) => n.toString(16).padStart(2, '0');
  return `#${to(m(A.r, B.r))}${to(m(A.g, B.g))}${to(m(A.b, B.b))}`;
}

/** The paper background that is actually on screen right now. */
export function paperBackground(paper: PaperStyle | string, isDark: boolean): string {
  const resolved = typeof paper === 'string' ? paperById(paper) : paper;
  return paperColor(resolved, isDark);
}

/** Body ink: whichever of the two inks has the higher contrast on this paper. */
export function paperInk(paper: PaperStyle | string, isDark: boolean): string {
  const bg = paperBackground(paper, isDark);
  return contrastRatio(bg, INK_DARK) >= contrastRatio(bg, INK_LIGHT) ? INK_DARK : INK_LIGHT;
}

/** Secondary ink (placeholders, dates, hints). Same hue, lower emphasis, still above 3:1. */
export function paperInkSoft(paper: PaperStyle | string, isDark: boolean): string {
  const bg = paperBackground(paper, isDark);
  const ink = paperInk(paper, isDark);
  // Blend ink toward the background until the contrast is at least 3:1.
  for (let t = 0.35; t <= 0.9; t += 0.05) {
    const mixed = mixHex(ink, bg, t);
    if (contrastRatio(mixed, bg) >= 3) return mixed;
  }
  return ink;
}

/**
 * Accent colors used as text (headers, links, labels) must meet 4.5:1 against the paper.
 * If the accent is too light or too dark, it is moved toward the ink until it passes.
 */
export function paperAccentText(paper: PaperStyle | string, isDark: boolean, accent: string): string {
  const bg = paperBackground(paper, isDark);
  if (contrastRatio(accent, bg) >= 4.5) return accent;
  const ink = paperInk(paper, isDark);
  for (let t = 0.1; t <= 1; t += 0.05) {
    const mixed = mixHex(accent, ink, t);
    if (contrastRatio(mixed, bg) >= 4.5) return mixed;
  }
  return ink;
}


