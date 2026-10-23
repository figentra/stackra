/**
 * Stackra file contract:
 * Purpose: the separator colour levels, each matching the surface it sits on: `default` on the page or a default
 *          surface, `secondary` and `tertiary` on those surface levels (the theme's `separator`,
 *          `separator-secondary` and `separator-tertiary` colours).
 * Boundary: the values only; the web Separator passes the level to HeroUI, the native one paints its theme colour.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0304 (decision 1); ADR 0165.
 */

/**
 * The separator levels. Verified against `@heroui/styles` 3.2.6 (`separatorVariants.variant`); HeroUI Native 1.0.10
 * has the three colours as theme colours (`ThemeColor`) but its own `variant` means thickness (`thin`, `thick`).
 */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the levels carry no labels.
export const SeparatorVariant = Object.freeze(["default", "secondary", "tertiary"] as const);

/** One separator level. */
export type SeparatorVariant = (typeof SeparatorVariant)[number];
