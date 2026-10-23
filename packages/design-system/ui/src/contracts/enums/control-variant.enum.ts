/**
 * Stackra file contract:
 * Purpose: the two looks a selection control takes: `primary` on the page background and `secondary` on a surface, as
 *          HeroUI names them for the checkbox and the radio group; the switch has none.
 * Boundary: the values only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0304.
 */

/**
 * The variants of a checkbox and a radio group. Verified against `@heroui/styles` 3.2.6 (`checkbox`, `radioGroup`)
 * and `heroui-native` 1.0.10 (`CheckboxVariant`, `RadioGroupVariant`).
 */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the values carry no labels.
export const ControlVariant = Object.freeze(["primary", "secondary"] as const);

/** One look of a checkbox or radio group. */
export type ControlVariant = (typeof ControlVariant)[number];
