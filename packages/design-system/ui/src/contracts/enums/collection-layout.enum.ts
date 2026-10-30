/**
 * Stackra file contract:
 * Purpose: The views of one collection: `table`, `grid` (editable cells), `list`, `cards` and `board` (wave 4).
 * Boundary: the values only; the collection engine (`useCollection`) reads them.
 * Runtime: isomorphic
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0302 (decision 3); STA-1371.
 */

/** The views of one collection: `table`, `grid` (editable cells), `list`, `cards` and `board` (wave 4). */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128).
export const CollectionLayout = Object.freeze(["table", "grid", "list", "cards", "board"] as const);

/** One of `CollectionLayout`. */
export type CollectionLayout = (typeof CollectionLayout)[number];
