import { MINDSET_PROMPTS } from '../data/mindsetPrompts';

// Step sizes that are coprime with the bank size make the daily walk visit
// every prompt exactly once before repeating, while looking shuffled
// (consecutive days jump around the list instead of marching in order).
const STEP_CANDIDATES = [37, 41, 43, 47, 53, 59, 97];

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x;
}

export function getLocalDayNumber(date: Date = new Date()): number {
  const utcMidnight = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor(utcMidnight / 86400000);
}

export function getDailyPromptIndex(dayNumber: number, total: number): number {
  if (total <= 0) return 0;
  let step = 1;
  for (const candidate of STEP_CANDIDATES) {
    if (candidate < total && gcd(candidate, total) === 1) {
      step = candidate;
      break;
    }
  }
  const day = Math.abs(Math.trunc(dayNumber));
  return (day * step) % total;
}

export function getDailyPrompt(date: Date = new Date()): string {
  if (!MINDSET_PROMPTS.length) return '';
  return MINDSET_PROMPTS[getDailyPromptIndex(getLocalDayNumber(date), MINDSET_PROMPTS.length)];
}
