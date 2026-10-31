/**
 * Stackra file contract:
 * Purpose: the props every runtime's `FilterBar` takes: the `useCollection` engine whose search and filter it edits,
 *          and the name and hint of its search box. Each runtime's `FilterBarProps` is this plus the props of its root
 *          element, which pass through unchanged.
 * Boundary: types only. The bar keeps no state: the filters it offers come from the engine's filterable columns (the
 *           kind from the column's `type` and `options`), each chip is one top-level condition of the engine's
 *           `CollectionFilter`, and "Advanced" opens the whole and/or tree. The words of the add-filter menu, the
 *           clear-all button and the chips come from the `ui` catalogue in the active locale. It replaced the
 *           `ResourceQuery` props (`query`, `onQueryChange`, `filters`) on 2026-10-31.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7, props vocabulary);
 *          ADR 0505 (one filter model).
 */
import type { CollectionController } from "#contracts/types/collection-controller.type";
import type { CollectionItem } from "#contracts/types/collection-item.type";

/** Props shared by the web and native `FilterBar`. */
export interface FilterBarContractProps<TItem extends CollectionItem = CollectionItem> {
  /** The engine whose search and filter the bar edits (`useCollection`). */
  readonly collection: CollectionController<TItem>;
  /** The accessible name of the search box, for example "Search orders"; the box draws no visible label. */
  readonly searchLabel: string;
  /** Hint text drawn inside the empty search box. It never replaces `searchLabel`. */
  readonly searchPlaceholder?: string | undefined;
  /**
   * The ids of the filter's conditions and groups that the data source does not apply, for example ones a server
   * cannot read (a quick filter's condition id is `quickFilterIdOf(column id)`). Their chips are drawn as warnings,
   * with the `ui` catalogue's "not applied" words as a tooltip on a warning button beside them.
   */
  readonly unappliedIds?: readonly string[] | undefined;
}
