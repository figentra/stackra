/**
 * Stackra file contract:
 * Purpose: the emphasis variants of a `TrendChip`, the four HeroUI Pro's trend chip draws.
 * Boundary: the values only; the look is HeroUI Pro's.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 4); ADR 0303 (decision 7); STA-403 FR-007.
 */

/** The trend chip variants. Verified against `@heroui-pro/react` 1.0.0-beta.10 (`TrendChipRootProps`). */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the variants carry no labels.
export const TrendChipVariant = Object.freeze([
  "primary",
  "secondary",
  "soft",
  "tertiary",
] as const);

/** One trend chip variant. */
export type TrendChipVariant = (typeof TrendChipVariant)[number];
