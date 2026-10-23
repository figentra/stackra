/**
 * Stackra file contract:
 * Purpose: the looks of the tags in a tag group: `default` on the page's own surface, `surface` on a surface that is
 *          already tinted (a card, a panel). The list is the same on HeroUI v3 and HeroUI Native, so a variant reaches
 *          both renderers unchanged.
 * Boundary: the values only; the colours live in the theme (@stackra/tokens).
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API); ADR 0303 (decision 7: props vocabulary); ADR 0165.
 */

/**
 * The tag variants, `default` first. Verified against `@heroui/styles` 3.2.6 (`tagVariants.variant`) and
 * `heroui-native` 1.0.10 (`TagGroup` `variant`): the same two.
 */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the variants carry no labels.
export const TagVariant = Object.freeze(["default", "surface"] as const);

/** One tag variant. */
export type TagVariant = (typeof TagVariant)[number];
