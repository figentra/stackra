/**
 * Stackra file contract:
 * Purpose: `registerCachedQueries`, which records the events that make each cached query stale (its
 *          `cache.invalidateOn`) and subscribes `QueryCacheEvictorListener` to each of them.
 * Boundary: writes `QUERY_CACHE_EVICTIONS` and the events registry only; a query registered again is kept once. Gen
 *           calls it from `#stackra/registrations` with every query of the member (and its hosted packages) whose
 *           `cache` names events; the listener runs only where a container binds it.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rule 31); ADR 0150 (decision 3); ADR 0294 (decision 4: listeners are registered).
 */
import { type AnyClass, kindOf } from "@stackra/container";
import { registerListeners } from "@stackra/events";

import type { Query } from "#core/bases/query.base";
import { QUERY_CACHE_EVICTIONS } from "#core/constants/query-cache-evictions.constant";
import { QueryCacheEvictorListener } from "#core/listeners/query-cache-evictor.listener";
import type { QueryCache } from "#core/types/query-cache.type";

/**
 * Registers the invalidating events of each query in `queries`.
 *
 * @throws TypeError when a class is not a query.
 * @example
 * registerCachedQueries([GetBalanceQuery, PointsIssuedQuery]);
 */
export function registerCachedQueries(queries: readonly AnyClass<Query>[]): void {
  for (const query of queries) {
    const record = kindOf(query);
    if (record?.kind !== "query")
      throw new TypeError(`${query.name} is not a query: extend Query({...})`);
    const cache = (record.options as { readonly cache?: QueryCache }).cache;
    for (const event of cache?.invalidateOn ?? []) {
      const stale = QUERY_CACHE_EVICTIONS.get(event) ?? [];
      if (!stale.includes(query)) stale.push(query);
      QUERY_CACHE_EVICTIONS.set(event, stale);
      registerListeners([[event, QueryCacheEvictorListener]]);
    }
  }
}
