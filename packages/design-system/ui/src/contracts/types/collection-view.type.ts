/**
 * Stackra file contract:
 * Purpose: `CollectionView`, a saved view: a name and the part of a collection's state it applies.
 * Boundary: types only; `state` holds only what the view sets, so applying it keeps the rest.
 * Runtime: isomorphic
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0302 (decision 3); STA-1371.
 */
import type { CollectionState } from "#contracts/types/collection-state.type";

/** A saved view of a collection. */
export interface CollectionView {
  /** The key of the view, unique in the collection. */
  readonly id: string;
  /** The name shown in the views menu. */
  readonly label: string;
  /** The columns, sort, filter, search, group, totals, density and layout the view applies. */
  readonly state: Partial<
    Omit<CollectionState, "selection" | "isAllMatchingSelected" | "page" | "cursor" | "viewId">
  >;
  /** True when the view was shared with others; the app decides what sharing means. */
  readonly isShared?: boolean | undefined;
}
