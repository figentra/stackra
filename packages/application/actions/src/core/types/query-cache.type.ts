/**
 * Stackra file contract:
 * Purpose: `QueryCache`, a query's `cache` option: how long its result may be served from cache, whom one entry is
 *          shared with (`per`) and which integration events make it stale.
 * Boundary: a type only. The pipeline's cache step serves and stores the result; `QueryCacheEvictorListener` forgets it
 *           after an `invalidateOn` event; clients and the live-query refresh channel read it from the manifest (a
 *           query with `invalidateOn` is live, owner decision R-25).
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 31 to 33, rule 31 as amended 2026-10-28); ADR 0297 as amended.
 */
import type { AnyClass } from "@stackra/container";
import type { Event } from "@stackra/events";

import type { CacheScope } from "#core/enums/cache-scope.enum";

/** A query's cache profile. */
export interface QueryCache {
  /** How long a result is served, as a duration (`"5m"`). */
  readonly ttl: string;

  /** Whom one entry is shared with; `CacheScope.Principal` (one per caller) when absent. */
  readonly per?: CacheScope;

  /** The events after which a cached result is stale. */
  readonly invalidateOn?: readonly AnyClass<Event>[];
}
