/**
 * Stackra file contract:
 * Purpose: Where a collection's search, filter, sort and paging run: `client` here, `server` by the app from the query object.
 * Boundary: the values only; the collection engine (`useCollection`) reads them.
 * Runtime: isomorphic
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0302 (decision 3); STA-1371.
 */

/** Where a collection's search, filter, sort and paging run: `client` here, `server` by the app from the query object. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128).
export const CollectionMode = Object.freeze(["client", "server"] as const);

/** One of `CollectionMode`. */
export type CollectionMode = (typeof CollectionMode)[number];
