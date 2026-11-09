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
}

export const PAPERS: PaperStyle[] = [
  { id: 'mist', name: 'Mist', feeling: 'Quiet', light: '#F8F9F5', dark: '#171E1B', texture: 'none' },
  { id: 'rain', name: 'Rain', feeling: 'Heavy', light: '#EDF2F6', dark: '#151C21', texture: 'rain' },
  { id: 'dawn', name: 'Dawn', feeling: 'Grateful', light: '#FBF2E7', dark: '#211B14', texture: 'rule' },
  { id: 'moss', name: 'Moss', feeling: 'Steady', light: '#EFF4ED', dark: '#161F18', texture: 'dots' },
  { id: 'dusk', name: 'Dusk', feeling: 'Tender', light: '#F3EFF6', dark: '#1C1821', texture: 'wash' },
  { id: 'ember', name: 'Ember', feeling: 'Warm', light: '#FAEFE9', dark: '#221712', texture: 'wash' },
];

/** Four papers at a time; the rest sit behind "More papers". */
export const PRIMARY_PAPERS = PAPERS.slice(0, 4);
export const MORE_PAPERS = PAPERS.slice(4);

export function paperById(id?: string | null): PaperStyle {
  return PAPERS.find((paper) => paper.id === id) ?? PAPERS[0];
}

export function paperColor(paper: PaperStyle, isDark: boolean): string {
  return isDark ? paper.dark : paper.light;
}

/** Pen colors offered on the drawing pad. */
export function sketchInks(isDark: boolean): { id: string; color: string }[] {
  return [
    { id: 'ink', color: isDark ? '#9AC6B4' : '#2C4F45' },
    { id: 'sage', color: isDark ? '#7FA394' : '#4D6B5E' },
    { id: 'reed', color: isDark ? '#D2B078' : '#B08A4F' },
  ];
}
