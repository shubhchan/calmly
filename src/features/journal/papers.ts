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
