/**
 * Stackra file contract:
 * Purpose: `CollectionSource`, the server adapter port of a server-mode collection: `fetch` answers a `CollectionQuery`
 *          (the search, the rule tree, the sort keys, the group, the paging, the page or cursor and the visible
 *          columns) with a `CollectionPage`, and `resolve` turns a `CollectionSelection` (ids, or every match of a
 *          search and filter but the `except` ids) into the ids a bulk action runs on. Each product implements one over
 *          its API; `createMemoryCollectionSource` is the in-memory one for demos and tests.
 * Boundary: types only; plain data both ways, so a query and a selection serialise into a request as they are. Every
 *           call takes an `AbortSignal`, which the engine fires when a newer query replaces the one asked.
 * Runtime: isomorphic
 * Governing contract: data-collection plan (owner, 2026-10-29), wave 4 (server mode end to end); ADR 0302 (decision 3);
 *          STA-1371.
 */
import type { CollectionItem } from "#contracts/types/collection-item.type";
import type { CollectionPage } from "#contracts/types/collection-page.type";
import type { CollectionQuery } from "#contracts/types/collection-query.type";
import type { CollectionSelection } from "#contracts/types/collection-selection.type";

/** Where a server-mode collection gets its rows. */
export interface CollectionSource<TItem extends CollectionItem = CollectionItem> {
  /** The page of rows a query asks for, searched, filtered, grouped and sorted by the server. */
  readonly fetch: (query: CollectionQuery, signal: AbortSignal) => Promise<CollectionPage<TItem>>;
  /** The ids a selection stands for, as the server resolves them (every match but the `except` ids). */
  readonly resolve?:
    | ((selection: CollectionSelection, signal?: AbortSignal) => Promise<readonly string[]>)
    | undefined;
}
