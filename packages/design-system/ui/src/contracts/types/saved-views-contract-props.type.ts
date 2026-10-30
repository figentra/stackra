/**
 * Stackra file contract:
 * Purpose: the props every runtime's `SavedViews` takes: the views a user can switch between, the facet chips of one
 *          multi-select filter, the controlled query, and the callback that saves the current query as a view.
 * Boundary: types only. Choosing a view calls `onQueryChange` with its query; a chip toggles its value in
 *           `query.filterValues[facetFilterId]`. The active view is the one whose query equals the current one, so a
 *           change by hand leaves no view chosen and offers "Save view".
 * Runtime: isomorphic
 * Governing contract: ADR 0318; product audit 2026-10-28 (saved views and facet chips).
 */
import type { FacetOption } from "#contracts/types/facet-option.type";
import type { ResourceQueryContractProps } from "#contracts/types/resource-query-contract-props.type";
import type { SavedView } from "#contracts/types/saved-view.type";

/** Props shared by the web and native `SavedViews`. */
export interface SavedViewsContractProps extends ResourceQueryContractProps {
  /** The group's spoken name, for example "Order views". */
  readonly label: string;
  /** The saved views, in order. */
  readonly views: readonly SavedView[];
  /** The id of the multi-select filter the facet chips toggle. */
  readonly facetFilterId?: string | undefined;
  /** The facet chips. */
  readonly facets?: readonly FacetOption[] | undefined;
  /** The facet group's spoken name, for example "Status". */
  readonly facetLabel?: string | undefined;
  /** Saves the current query as a view; left out, there is no Save view button. */
  readonly onSaveView?: (() => void) | undefined;
}
