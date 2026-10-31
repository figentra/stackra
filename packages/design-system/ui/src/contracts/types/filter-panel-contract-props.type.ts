/**
 * Stackra file contract:
 * Purpose: the props every runtime's `FilterPanel` takes: the `useCollection` engine whose filter it edits as facets
 *          (one per filterable column) with their option counts, the result count and the panel's name. Each runtime's
 *          `FilterPanelProps` is this plus its root element's own props.
 * Boundary: types only. The panel keeps no state: each facet is one top-level condition of the engine's
 *           `CollectionFilter`, so a FilterBar or DataView on the same engine shows the same filter. The counts are
 *           the app's (the server's facets); the panel only draws them. Saved views are `SavedViews`, the sort is the
 *           toolbar's: the panel's own tabs and sort menu were removed on 2026-10-31.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0505 (one filter model); design-system gap
 *          inventory (2026-10-28) row 9.
 */
import type { CollectionController } from "#contracts/types/collection-controller.type";
import type { CollectionItem } from "#contracts/types/collection-item.type";

/** Props shared by the web and native `FilterPanel`. */
export interface FilterPanelContractProps<TItem extends CollectionItem = CollectionItem> {
  /** The engine whose filter the facets edit (`useCollection`). */
  readonly collection: CollectionController<TItem>;
  /** The panel's heading and accessible name, for example "Filter products". */
  readonly label: string;
  /** How many records each option of a choice facet would match, by column `id` then option `id`. */
  readonly counts?: Readonly<Record<string, Readonly<Record<string, number>>>> | undefined;
  /** How many records match; it rolls to its new value when it changes. Defaults to the engine's `totalCount`. */
  readonly resultCount?: number | undefined;
}
