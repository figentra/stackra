/**
 * Stackra file contract:
 * Purpose: `collectionSelectionOf()`, the `CollectionSelection` of a collection state: the selected ids, every matching
 *          id but the unticked ones when "all matching" is chosen in client mode, or the all-matching descriptor (with
 *          its `except` ids) in server mode.
 * Boundary: a pure function; the engine calls it with the rows it matched (client) or the server's total (server).
 * Runtime: isomorphic
 * Governing contract: data-collection plan (owner, 2026-10-29), wave 3 (select all across pages); STA-1371.
 */
import type { CollectionMode } from "#contracts/enums/collection-mode.enum";
import type { CollectionItem } from "#contracts/types/collection-item.type";
import type { CollectionSelection } from "#contracts/types/collection-selection.type";
import type { CollectionState } from "#contracts/types/collection-state.type";

/**
 * What a bulk action acts on.
 * @param state - the collection state (its selection, "all matching", search and filter)
 * @param mode - `client` or `server`
 * @param matched - in client mode, every row matching the query across all pages
 * @param totalCount - how many rows match in all
 * @returns ids, or the all-matching descriptor in server mode
 */
export function collectionSelectionOf(
  state: CollectionState,
  mode: CollectionMode,
  matched: readonly CollectionItem[],
  totalCount: number,
): CollectionSelection {
  if (!state.isAllMatchingSelected) return { kind: "ids", ids: state.selection };
  const except = state.excludedKeys;
  if (mode === "client")
    return {
      kind: "ids",
      ids: matched.map((item) => item.id).filter((id) => !except.includes(id)),
    };
  return { kind: "all-matching", search: state.search, filter: state.filter, totalCount, except };
}
