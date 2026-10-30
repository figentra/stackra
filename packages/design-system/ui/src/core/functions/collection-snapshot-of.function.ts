/**
 * Stackra file contract:
 * Purpose: `collectionSnapshotOf()`, the persistable part of a collection: its state without the selection, page and cursor, its saved views and its default view.
 * Boundary: pure; plain JSON for a `CollectionStore`.
 * Runtime: isomorphic
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0302 (decision 3); STA-1371.
 */
import type { CollectionSnapshot } from "#contracts/types/collection-snapshot.type";
import type { CollectionState } from "#contracts/types/collection-state.type";
import type { CollectionView } from "#contracts/types/collection-view.type";

/**
 * The snapshot to save.
 * @param state - the state
 * @param views - the saved views
 * @param defaultViewId - the view applied on open
 */
export function collectionSnapshotOf(
  state: CollectionState,
  views: readonly CollectionView[],
  defaultViewId: string | null,
): CollectionSnapshot {
  const {
    selection: _selection,
    isAllMatchingSelected: _all,
    excludedKeys: _excluded,
    page: _page,
    cursor: _cursor,
    ...kept
  } = state;
  return { version: 1, state: kept, views, defaultViewId };
}
