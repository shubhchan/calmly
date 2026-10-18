/**
 * Shape language — radii, border widths and per-component shape rules.
 *
 * Radii are NOT applied uniformly: each component family has a documented
 * radius so the app reads as one coherent shape system.
 */

export const radius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  full: 9999,
} as const;

export type RadiusToken = keyof typeof radius;

/**
 * Component shape rules (documentation + single source).
 * - Actions are pill-shaped (full radius) — the app's warm, friendly voice.
 * - Surfaces (cards, sheets, dialogs) use large soft radii.
 * - Inputs sit between: lg (16).
 * - Chips/badges/avatars are fully rounded.
 */
export const shape = {
  button: radius.full,
  iconButton: radius.full,
  card: radius.xl,
  cardElevated: radius['2xl'],
  input: radius.lg,
  searchInput: radius.full,
  chip: radius.full,
  badge: radius.full,
  avatar: radius.full,
  modal: radius['2xl'],
  dialog: radius['2xl'],
  bottomSheet: { borderTopLeftRadius: radius['2xl'], borderTopRightRadius: radius['2xl'] },
  listItem: radius.lg,
  toast: radius.lg,
  tooltip: radius.md,
  media: radius.lg,
} as const;
