/**
 * Stackra file contract:
 * Purpose: the props every runtime's `FilterBar` takes: the controlled resource query it edits (the search text and the
 *          applied filters), the list of filters the app offers, and the name and hint of its search box. Each runtime's
 *          `FilterBarProps` is this plus the props of its root element, which pass through unchanged.
 * Boundary: types only. The bar is controlled only, as `DataTable` is: it keeps no copy of the query, so an app (or
 *           the router binding of a later wave) owns it, mirrors it to the URL and turns it into a request. The bar
 *           edits `search` and `filterValues` and hands the sort through untouched. The words of the add-filter
 *           menu, the clear-all button and the chips come from the `ui` catalogue in the active locale.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7, props vocabulary);
 *          ADR 0318 (decisions 1 to 3).
 */
import type { FilterDefinition } from "#contracts/types/filter-definition.type";
import type { ResourceQueryContractProps } from "#contracts/types/resource-query-contract-props.type";

/** Props shared by the web and native `FilterBar`. */
export interface FilterBarContractProps extends ResourceQueryContractProps {
  /** The filters the user may add, in the order the add-filter menu lists them; `id`s are unique in the list. */
  readonly filters: readonly FilterDefinition[];
  /** The accessible name of the search box, for example "Search orders"; the box draws no visible label. */
  readonly searchLabel: string;
  /** Hint text drawn inside the empty search box. It never replaces `searchLabel`. */
  readonly searchPlaceholder?: string | undefined;
}
