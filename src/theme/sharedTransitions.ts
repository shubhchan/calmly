import { SharedTransition } from 'react-native-reanimated';
import { motion } from './motion';

/**
 * Calibrated to the native stack push; avoid separate easing curves on the
 * source and target. Reanimated 4 SET is experimental (native stacks only).
 * Parent screen content must not animate translate/scale while shared tags run.
 */
export const sharedElementStyle = SharedTransition.duration(motion.duration.normal);
export const sharedSpringStyle = SharedTransition.springify()
  .damping(26).mass(0.68).stiffness(165);
export const sharedHeroStyle = SharedTransition.duration(motion.duration.normal);

export const sharedTransitionTags = {
  habitIcon: (habitId: string) => `habit-icon-${habitId}`,
  habitPlantingHero: 'habit-planting-hero',
  affirmationCard: (affirmationId: string) => `affirmation-card-${affirmationId}`,
  journalEntryIcon: (entryId: string) => `journal-entry-icon-${entryId}`,
  journalTemplateIcon: (type: string) => `journal-template-icon-${type}`,
  journalReflectionHero: 'journal-reflection-hero',
  routineIcon: (timeOfDay: string) => `routine-icon-${timeOfDay}`,
  calmHero: (key: 'soundscapes' | 'breathwork' | 'sensory' | 'bodyScan' | 'panic') => `calm-hero-${key}`,
  ambientPlayerBar: 'ambient-player-bar',
  ambientStatusBadge: 'ambient-status-badge',
} as const;
