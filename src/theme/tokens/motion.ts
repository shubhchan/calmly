/**
 * Motion tokens — re-exported from the app's motion system so there is exactly
 * one source of truth (`src/theme/motion.ts`), plus per-intent presets.
 */

import { motion } from '../motion';

export { motion };
export type { } from '../motion';

/** Per-intent motion presets — documented so screens never invent timings. */
export const motionPresets = {
  /** Press feedback on any touchable. */
  press: motion.spring.snappy,
  /** Cards, rows and lists settling in. */
  entrance: motion.spring.gentle,
  /** Screen content entrances. */
  screen: motion.spring.screen,
  /** Playful pops for colorful cards. */
  pop: motion.spring.pop,
  /** Expand/collapse (disclosure, accordion). */
  expand: { duration: motion.duration.fast, easing: motion.ease.decelerate },
  collapse: { duration: motion.duration.instant, easing: motion.ease.accelerate },
  /** Modal + bottom sheet presentation. */
  modal: { duration: motion.duration.normal, easing: motion.ease.decelerate },
  /** Page transitions (native stack drives these; token for custom cases). */
  page: { duration: motion.duration.normal, easing: motion.ease.standard },
  /** Loading shimmer sweep. */
  shimmer: { duration: 1500 },
  /** Subtle state changes (color, opacity). */
  state: { duration: motion.duration.fast, easing: motion.ease.gentle },
} as const;

/** Standard press scale used across buttons and cards. */
export const pressScale = {
  button: 0.965,
  card: 0.985,
  chip: 0.95,
  iconButton: 0.9,
} as const;
