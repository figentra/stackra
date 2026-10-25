/**
 * Stackra file contract:
 * Purpose: `queryKeyOf`, the TanStack Query key of a query ref and input: `[OrderKpisQuery.key, input]`, so every cached
 *          result of the query starts with its versioned key and `ServerStateCache` invalidates them by that prefix.
 * Boundary: internal to the hooks; not exported from an entry. The input is the caller's; TanStack hashes it stably.
 * Runtime: isomorphic
 * Governing contract: ADR 0079 (TanStack Query core); owner decision R-25 (live queries).
 */
import type { QueryRef } from "#core/types/query-ref.type";

/**
 * The cache key of `query` with `input`.
 *
 * @example
 * queryKeyOf(OrderKpisQuery, { range: TimeRange.Today }); // ["orders.order.kpis@1", { range: "today" }]
 */
export function queryKeyOf(query: QueryRef, input: unknown): readonly [string, unknown] {
  return [query.key, input];
}
