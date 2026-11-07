/**
 * Shape language — radii, border widths and per-component shape rules.
 *
 * Radii are NOT applied uniformly: each component family has a documented
 * radius so the app reads as one coherent shape system.
 *
 * Still Water rules:
 * - Inputs 12, actions 16, cards 20, sheets 28, pills full.
 * - Depth comes from contrast first; keep radii calm and consistent.
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
 * - Actions use 16 (lg) — calm, not pill-shaped by default.
 * - Surfaces (cards) use 20.
 * - Inputs sit lower at 12.
 * - Chips, badges and avatars are fully rounded.
 */
export const shape = {
  button: radius.lg,
  iconButton: radius.md,
  card: radius.xl,
  cardElevated: radius.xl,
  input: radius.md,
  searchInput: radius.full,
  chip: radius.full,
  badge: radius.full,
  avatar: radius.full,
  modal: radius['3xl'],
  dialog: radius['3xl'],
  bottomSheet: { borderTopLeftRadius: radius['3xl'], borderTopRightRadius: radius['3xl'] },
  listItem: radius.lg,
  toast: radius.lg,
  tooltip: radius.md,
  media: radius.lg,
} as const;
