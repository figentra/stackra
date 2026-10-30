/**
 * Stackra file contract:
 * Purpose: The edge a pinned column sticks to while the rows scroll sideways: the logical `start` or `end`.
 * Boundary: the values only; the collection engine (`useCollection`) reads them.
 * Runtime: isomorphic
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0302 (decision 3); STA-1371.
 */

/** The edge a pinned column sticks to while the rows scroll sideways: the logical `start` or `end`. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128).
export const ColumnPin = Object.freeze(["start", "end"] as const);

/** One of `ColumnPin`. */
export type ColumnPin = (typeof ColumnPin)[number];
