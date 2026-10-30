/**
 * Stackra file contract:
 * Purpose: gen-api test fixture: an `as const` enum alias that gen-api expands to its literals.
 * Boundary: test data only.
 * Runtime: node
 * Governing contract: showcase redesign spec (2026-10-27) section 7.2.
 */
export const LeafVariant = Object.freeze(["primary", "ghost"] as const);

/** One look of the leaf. */
export type LeafVariant = (typeof LeafVariant)[number];
