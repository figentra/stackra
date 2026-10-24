/**
 * Stackra file contract:
 * Purpose: the two props that hand a component the resource query and take the next one back, so FilterBar and
 *          DataTable are controlled by the same object and an app (or the router binding) owns it.
 * Boundary: types only. The query is controlled only: a resource index is server-driven, so there is no default value
 *           and no internal copy.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0318.
 */
import type { ResourceQuery } from "#contracts/types/resource-query.type";

/** Props shared by every component that edits or reads the resource query. */
export interface ResourceQueryContractProps {
  /** The query in force: the search text, the applied filters and the sort. */
  readonly query: ResourceQuery;
  /** Called with the whole next query each time the user changes any part of it. */
  readonly onQueryChange: (query: ResourceQuery) => void;
}
