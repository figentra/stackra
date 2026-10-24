/**
 * Stackra file contract:
 * Purpose: the looks of an accordion: `default` on the page's own surface, `surface` as a tinted panel of its own. The
 *          list is the same on HeroUI v3 and HeroUI Native, so a variant reaches both renderers unchanged.
 * Boundary: the values only; the colours live in the theme (@stackra/tokens).
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API); ADR 0303 (decision 7: props vocabulary); ADR 0313; ADR 0165.
 */

/**
 * The accordion variants, `default` first. Verified against `@heroui/styles` 3.2.6 (`accordionVariants.variant`) and
 * `heroui-native` 1.0.10 (`AccordionVariant`): the same two.
 */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the variants carry no labels.
export const AccordionVariant = Object.freeze(["default", "surface"] as const);

/** One accordion variant. */
export type AccordionVariant = (typeof AccordionVariant)[number];
