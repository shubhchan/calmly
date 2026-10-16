import { create } from 'zustand';
import { Easing, useReducedMotion } from 'react-native-reanimated';
import { Storage } from '../services/storage';

/**
 * Central motion design system for Calmly.
 *
 * Every route, card, list and loading state animates with these tokens so the
 * app feels like one continuous, choreographed experience:
 * - One spring family for entrances (gentle rise + settle, no overshoot chaos).
 * - One ease family for tints / crossfades.
 * - One stagger step so lists dance in the same rhythm everywhere.
 *
 * "Reduce motion" is respected from two sources:
 * 1. The OS accessibility setting (via Reanimated's `useReducedMotion`).
 * 2. The in-app Accessibility toggle in Settings (persisted here).
 */
export const motion = {
  duration: {
    instant: 120,
    fast: 200,
    normal: 320,
    slow: 480,
  },
  spring: {
    /** Cards, rows, list items settling into place. */
    gentle: { mass: 0.6, damping: 18, stiffness: 180 },
    /** Screen + modal content entrances. */
    screen: { mass: 0.7, damping: 20, stiffness: 160 },
    /** Playful "pop" for colorful cards. */
    pop: { mass: 0.62, damping: 13, stiffness: 220 },
    /** Pressable interactions. */
    snappy: { mass: 0.45, damping: 14, stiffness: 280 },
  },
  ease: {
    standard: Easing.bezier(0.2, 0, 0, 1),
    decelerate: Easing.out(Easing.cubic),
    accelerate: Easing.in(Easing.cubic),
    gentle: Easing.inOut(Easing.quad),
  },
  /** Vertical rise distance (px) used by every screen/card entrance. */
  rise: 14,
  /** Initial scale for screen content entrances. */
  settleScale: 0.985,
  /** Initial scale for playful card pops. */
  popScale: 0.92,
  /** Delay between staggered siblings (ms). */
  stagger: 36,
};

const REDUCE_MOTION_KEY = 'app_reduce_motion';

interface MotionPrefsState {
  reduceMotion: boolean;
  hydrated: boolean;
  setReduceMotion: (value: boolean) => void;
  hydrate: () => void;
}

/**
 * Persisted in-app motion preference (the "Reduce Animations" switch).
 * Kept separate from the OS flag so the user can quiet the app even when the
 * system setting is off.
 */
export const useMotionPrefs = create<MotionPrefsState>((set) => ({
  reduceMotion: false,
  hydrated: false,
  setReduceMotion: (value) => {
    set({ reduceMotion: value });
    Storage.setBoolean(REDUCE_MOTION_KEY, value);
  },
  hydrate: () => {
    try {
      const saved = Storage.getBoolean(REDUCE_MOTION_KEY);
      set({ reduceMotion: saved ?? false, hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },
}));

let motionHydrationStarted = false;

/** Kick off persistence hydration exactly once (safe to call from any root). */
export function hydrateMotionPrefs() {
  if (motionHydrationStarted) return;
  motionHydrationStarted = true;
  useMotionPrefs.getState().hydrate();
}

/**
 * Single source of truth for "should animations be quieted?" used by every
 * animated component, screen container and navigator option builder.
 */
export function useAppReducedMotion(): boolean {
  const osReducedMotion = useReducedMotion();
  const appReducedMotion = useMotionPrefs((s) => s.reduceMotion);
  return Boolean(osReducedMotion) || appReducedMotion;
}
