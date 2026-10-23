/**
 * Stackra file contract:
 * Purpose: the surface levels a Surface or Card is painted with: the theme's `surface`, `surface-secondary` and
 *          `surface-tertiary` roles, or none (`transparent`). The list is the same on HeroUI v3 and HeroUI Native, so a
 *          level reaches both renderers unchanged.
 * Boundary: the values only; the colours live in the theme (@stackra/tokens).
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API); ADR 0303 (decision 7: props vocabulary); ADR 0304; ADR 0165.
 */

/**
 * The surface levels, `default` first. Verified against `@heroui/styles` 3.2.6 (`surfaceVariants.variant`,
 * `cardVariants.variant`) and `heroui-native` 1.0.10 (`SurfaceVariant`): the same four.
 */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the levels carry no labels.
export const SurfaceVariant = Object.freeze([
  "default",
  "secondary",
  "tertiary",
  "transparent",
] as const);

/** One surface level. */
export type SurfaceVariant = (typeof SurfaceVariant)[number];
