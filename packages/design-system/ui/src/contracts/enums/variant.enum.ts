/**
 * Stackra file contract:
 * Purpose: the emphasis levels HeroUI shares across components and runtimes; a component contract adds its own
 *          variants (a button's `ghost` or `danger`) on top.
 * Boundary: the values only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (UI contract).
 */

/**
 * The shared variants: the ones both `@heroui/styles` 3.2.6 (`button`, `chip`) and `heroui-native` 1.0.10
 * (`ButtonVariant`, `ChipVariant`) define.
 */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the variants carry no labels.
export const Variant = Object.freeze(["primary", "secondary", "tertiary"] as const);

/** One shared variant. */
export type Variant = (typeof Variant)[number];
