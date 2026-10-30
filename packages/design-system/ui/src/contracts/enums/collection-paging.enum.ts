/**
 * Stackra file contract:
 * Purpose: How a collection pages its rows: `none`, numbered `page`s, a server `cursor`, or `infinite` (more rows appended).
 * Boundary: the values only; the collection engine (`useCollection`) reads them.
 * Runtime: isomorphic
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0302 (decision 3); STA-1371.
 */

/** How a collection pages its rows: `none`, numbered `page`s, a server `cursor`, or `infinite` (more rows appended). */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128).
export const CollectionPaging = Object.freeze(["none", "page", "cursor", "infinite"] as const);

/** One of `CollectionPaging`. */
export type CollectionPaging = (typeof CollectionPaging)[number];
