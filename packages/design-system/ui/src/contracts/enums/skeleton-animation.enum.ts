/**
 * Stackra file contract:
 * Purpose: the ways a skeleton placeholder moves while content loads: a light sweep, a slow fade in and out, or none.
 *          The three values are the same on HeroUI v3 (`animationType`) and HeroUI Native (`variant`).
 * Boundary: the values only; each Skeleton renders them.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API); ADR 0165 (UI contract); ADR 0303 (decision 7); ADR 0304.
 */

/**
 * The skeleton animations. Verified against `@heroui/styles` 3.2.6 (`skeletonVariants.animationType`) and
 * `heroui-native` 1.0.10 (`SkeletonAnimation`): the same three on both.
 */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the animations carry no labels.
export const SkeletonAnimation = Object.freeze(["shimmer", "pulse", "none"] as const);

/** One skeleton animation. */
export type SkeletonAnimation = (typeof SkeletonAnimation)[number];
