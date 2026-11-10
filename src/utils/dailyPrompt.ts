import { THOUGHTS_BY_PERIOD, type ThoughtPeriod } from '../data/mindsetPrompts';

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

/**
 * Which bank of the thought of the day the user is in right now.
 *
 * - Night: deep night into early morning — rest and safety thoughts.
 * - Morning: early morning into late morning — gentle start-of-day thoughts.
 * - Evening: afternoon into early evening — wind-down softness thoughts.
 */
export function getThoughtPeriod(date: Date = new Date()): ThoughtPeriod {
  const hour = date.getHours();
  if (hour >= 21 || hour < 5) return 'night';
  if (hour < 12) return 'morning';
  return 'evening';
}

/**
 * The thought of the day. Rotates through the bank for the period the moment
 * falls in, so the same thought is never repeated until the bank is exhausted.
 */
export function getDailyPrompt(date: Date = new Date()): string {
  const period = getThoughtPeriod(date);
  const bank = THOUGHTS_BY_PERIOD[period];
  if (!bank.length) return '';
  const index = getDailyPromptIndex(getLocalDayNumber(date), bank.length);
  const promptIndex = Math.abs(index) % bank.length;
  return bank[promptIndex] ?? '';
}
