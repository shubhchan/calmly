/**
 * Spacing scale — the single source of truth for all layout rhythm.
 *
 * Base unit: 4pt. Every gap, pad and inset in the app must come from this
 * scale; arbitrary numbers are a bug.
 */

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  18: 72,
} as const;

export type SpacingToken = keyof typeof spacing;

/** Standard horizontal screen gutter used by every ScreenContainer. */
export const screenGutter = spacing[6];

/** Typed accessor: space(4) === 16. */
export function space(token: SpacingToken): number {
  return spacing[token];
}

/** Common composite rhythms documented for consistency. */
export const layout = {
  /** Horizontal padding inside a screen. */
  screenPadding: screenGutter,
  /** Padding inside a standard card. */
  cardPadding: spacing[5],
  /** Vertical gap between sections on a screen. */
  sectionGap: spacing[10],
  /** Gap between items in a vertical list. */
  listGap: spacing[4],
  /** Gap between label and input. */
  fieldGap: spacing[2],
  /** Gap between a control's icon and its label. */
  inlineGap: spacing[2],
  /** Padding inside modal / bottom sheet bodies. */
  modalPadding: spacing[6],
  /** Default bottom clearance above the floating tab bar. */
  screenBottomClearance: 110,
} as const;
