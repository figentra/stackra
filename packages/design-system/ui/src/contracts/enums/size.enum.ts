/**
 * Stackra file contract:
 * Purpose: the sizes every @stackra/ui component takes, the same three HeroUI v3 and HeroUI Native use.
 * Boundary: the values only; a component maps them to its renderer.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API, the contract shared); ADR 0165 (UI contract).
 */

/** The component sizes. Verified against `@heroui/styles` 3.2.6 and `heroui-native` 1.0.10 (`ButtonSize`). */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the sizes carry no labels.
export const Size = Object.freeze(["sm", "md", "lg"] as const);

/** One component size. */
export type Size = (typeof Size)[number];
