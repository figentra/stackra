/**
 * Stackra file contract:
 * Purpose: `CollectionSnapshot`, what a `CollectionStore` keeps for one collection key: the persistable state, the saved views and the default view.
 * Boundary: types only; plain JSON.
 * Runtime: isomorphic
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0302 (decision 3); STA-1371.
 */
import type { CollectionState } from "#contracts/types/collection-state.type";
import type { CollectionView } from "#contracts/types/collection-view.type";

/** The persisted part of a collection. */
export interface CollectionSnapshot {
  /** The version of this shape, so a driver can drop what it cannot read. */
  readonly version: 1;
  /** The state, without the selection, page and cursor. */
  readonly state: Partial<
    Omit<CollectionState, "selection" | "isAllMatchingSelected" | "page" | "cursor">
  >;
  /** The saved views, in order. */
  readonly views: readonly CollectionView[];
  /** The id of the view applied when the collection opens, or `null`. */
  readonly defaultViewId: string | null;
}
