/**
 * Stackra file contract:
 * Purpose: the looks of a text field, text area or input group: `primary` on the page's own surface, `secondary` on a
 *          surface that is already tinted (a card, a panel). The list is the same on HeroUI v3 and HeroUI Native, so a
 *          variant reaches both renderers unchanged.
 * Boundary: the values only; the colours live in the theme (@stackra/tokens).
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API); ADR 0303 (decision 7: props vocabulary); ADR 0165.
 */

/**
 * The field variants, `primary` first. Verified against `@heroui/react` 3.2.6 (`TextFieldRootProps.variant`) and
 * `heroui-native` 1.0.10 (`InputProps.variant`): the same two.
 */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the variants carry no labels.
export const TextFieldVariant = Object.freeze(["primary", "secondary"] as const);

/** One field variant. */
export type TextFieldVariant = (typeof TextFieldVariant)[number];
