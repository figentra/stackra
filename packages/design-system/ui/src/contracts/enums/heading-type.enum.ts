/**
 * Stackra file contract:
 * Purpose: the visual styles of headings, `h1` (largest) to `h6`, the same six HeroUI v3 and HeroUI Native draw;
 *          a heading's style is independent of its level.
 * Boundary: the values only; every one is a token of the theme's type scale (`h4` to `h6` since ADR 0303 decision 9).
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decisions 2 and 3); ADR 0303 (decision 9); ADR 0165 (UI contract).
 */

/** The heading styles. Verified against `@heroui/styles` 3.2.6 (`typographyVariants.type`) and `heroui-native` 1.0.10. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the styles carry no labels.
export const HeadingType = Object.freeze(["h1", "h2", "h3", "h4", "h5", "h6"] as const);

/** One heading style. */
export type HeadingType = (typeof HeadingType)[number];
