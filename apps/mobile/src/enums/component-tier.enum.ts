/**
 * Stackra file contract:
 * Purpose: the tiers of the design-system review area: "Free", a `@stackra/ui/native` component (screens in
 *          `free/`), and "Pro", a `@stackra-pro/ui/native` component (screens in `pro/`). The index lists Free rows
 *          before Pro rows inside each category, badges the Pro ones and filters by tier.
 * Boundary: the values only; each row of `design-system-components.ts` names its tier.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); ADR 0294 (decision 14).
 */

/** The component tiers, Free first. */
// shortcut: a frozen tuple of English labels until @stackra/contracts ships Enum.of (ADR 0128).
export const ComponentTier = Object.freeze(["Free", "Pro"] as const);

/** One component tier. */
export type ComponentTier = (typeof ComponentTier)[number];
