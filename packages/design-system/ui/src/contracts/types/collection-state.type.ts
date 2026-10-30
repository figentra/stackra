/**
 * Stackra file contract:
 * Purpose: `CollectionState`, everything a user can change about a collection: columns, sort, filter, search, group, totals, selection, paging, density, view and layout.
 * Boundary: types only; `useCollection` holds it, a `CollectionStore` keeps the persistable part, a `CollectionView` names a part of it.
 * Runtime: isomorphic
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0302 (decision 3); STA-1371.
 */
import type { AggregateKind } from "#contracts/enums/aggregate-kind.enum";
import type { CollectionDensity } from "#contracts/enums/collection-density.enum";
import type { CollectionLayout } from "#contracts/enums/collection-layout.enum";
import type { CollectionColumnState } from "#contracts/types/collection-column-state.type";
import type { CollectionFilter } from "#contracts/types/collection-filter.type";
import type { SortDescriptor } from "#contracts/types/sort-descriptor.type";

/** The state of a collection. */
export interface CollectionState {
  /** The columns in display order, with what the user changed about each. */
  readonly columns: readonly CollectionColumnState[];
  /** The sort keys, most significant first; empty for the source's own order. */
  readonly sort: readonly SortDescriptor[];
  /** The rule tree the rows must meet. */
  readonly filter: CollectionFilter;
  /** The quick search text; empty for none. */
  readonly search: string;
  /** The id of the column the rows are grouped by, or `null`. */
  readonly groupBy: string | null;
  /** The footer aggregate of each column, by column id. */
  readonly aggregates: Readonly<Record<string, AggregateKind>>;
  /** The ids of the selected rows. */
  readonly selection: readonly string[];
  /** True when every row matching the query is selected, beyond the rows loaded. */
  readonly isAllMatchingSelected: boolean;
  /** The page shown, from 0 (for `infinite`, the last page loaded). */
  readonly page: number;
  /** The rows per page. */
  readonly pageSize: number;
  /** The server cursor of the page shown, or `null` for the first. */
  readonly cursor: string | null;
  /** How tightly the rows are drawn. */
  readonly density: CollectionDensity;
  /** The view the rows are drawn as. */
  readonly layout: CollectionLayout;
  /** The id of the saved view applied, or `null`. */
  readonly viewId: string | null;
}
