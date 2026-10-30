/**
 * Stackra file contract:
 * Purpose: How tightly a collection draws its rows: `compact`, `normal` (the default) or `roomy`.
 * Boundary: the values only; the collection engine (`useCollection`) reads them.
 * Runtime: isomorphic
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0302 (decision 3); STA-1371.
 */

/** How tightly a collection draws its rows: `compact`, `normal` (the default) or `roomy`. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128).
export const CollectionDensity = Object.freeze(["compact", "normal", "roomy"] as const);

/** One of `CollectionDensity`. */
export type CollectionDensity = (typeof CollectionDensity)[number];
