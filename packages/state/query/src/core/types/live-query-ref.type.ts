/**
 * Stackra file contract:
 * Purpose: `LiveQueryRef`, what `ServerStateCache.watch` takes: the generated class of a consumed query
 *          (`OrderKpisQuery` from `#stackra/clients/commerce`), read by its static versioned key and the integration
 *          events its `cache.invalidateOn` names.
 * Boundary: a structural type, so this package never imports `@stackra/clients`: any class with a static `key`
 *           (`orders.order.kpis@1`) and an optional static `invalidateOn` qualifies, and `@stackra/clients`'
 *           `queryRef(key, { invalidateOn })` sets both. A query with events is live (owner decision R-25).
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (generated client classes); ADR 0225 (data-free refreshes); R-25 (live queries).
 */
import type { RealtimeEventRef } from "@stackra/realtime";

/** A consumed query, by its generated class. */
export interface LiveQueryRef {
  /** The versioned query key; every cache key of the query starts with it. */
  readonly key: string;

  /** The events after which its cached results are stale; none means it is not live. */
  readonly invalidateOn?: readonly RealtimeEventRef[];
}
