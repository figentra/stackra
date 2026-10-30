/**
 * Stackra file contract:
 * Purpose: the props every runtime's `FilterPanel` takes: the controlled resource query, the filters drawn as facets
 *          with their option counts, the result count, the saved views shown as tabs, the sort menu's columns and the
 *          panel's name. Each runtime's `FilterPanelProps` is this plus its root element's own props.
 * Boundary: types only. Controlled only, as `FilterBar` is: each change calls `onQueryChange` with the whole next
 *           query. The counts and the result count are the app's (the server's facets); the panel only draws them.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0318 (decisions 1 to 3); design-system gap
 *          inventory (2026-10-28) row 9.
 */
import type { FilterDefinition } from "#contracts/types/filter-definition.type";
import type { ResourceQueryContractProps } from "#contracts/types/resource-query-contract-props.type";
import type { SavedView } from "#contracts/types/saved-view.type";
import type { SortOption } from "#contracts/types/sort-option.type";

/** Props shared by the web and native `FilterPanel`. */
export interface FilterPanelContractProps extends ResourceQueryContractProps {
  /** The facets, in the order the panel lists them; `id`s are unique in the list. */
  readonly filters: readonly FilterDefinition[];
  /** The panel's heading and accessible name, for example "Filter products". */
  readonly label: string;
  /** How many records each option of a choice facet would match, by filter `id` then option `id`. */
  readonly counts?: Readonly<Record<string, Readonly<Record<string, number>>>> | undefined;
  /** How many records the query matches; it rolls to its new value when it changes. */
  readonly resultCount?: number | undefined;
  /** The saved views, drawn as tabs above the chips; choosing one applies its whole query. */
  readonly views?: readonly SavedView[] | undefined;
  /** The id of the view in force; left out, the first view is shown as chosen. */
  readonly activeViewId?: string | undefined;
  /** Called with a view's id when it is chosen, after `onQueryChange` has its query. */
  readonly onViewChange?: ((id: string) => void) | undefined;
  /** The columns the sort menu offers; left out or empty, there is no sort menu. */
  readonly sortOptions?: readonly SortOption[] | undefined;
}
