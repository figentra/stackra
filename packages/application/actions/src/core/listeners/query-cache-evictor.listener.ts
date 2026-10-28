/**
 * Stackra file contract:
 * Purpose: `QueryCacheEvictorListener`, the listener that forgets a cached query's entries after an event its
 *          `cache.invalidateOn` names: every entry of the event's tenant, or of every tenant for a platform event.
 * Boundary: a listener over the `Cache` and `ContextStorage` ports. `registerCachedQueries` subscribes it to each
 *           invalidating event and gen binds it in a service that declares `@stackra/cache`; it runs after commit like
 *           every listener. It forgets under `SHARED_CACHE_CONTEXT`, the namespace the cache step writes in, by the
 *           prefixes `queryCacheKey` starts with.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rule 31); ADR 0150 (decision 3: event-driven invalidation); ADR 0078 (decision 4:
 *                     listeners after commit).
 */
import type { Cache } from "@stackra/cache/contracts";
import { CacheKey } from "@stackra/cache";
import { type Event, Listener, type ListenerContext } from "@stackra/events";

import type { ContextStorage } from "#contracts/ports/context-storage.port";
import { QUERY_CACHE_EVICTIONS } from "#core/constants/query-cache-evictions.constant";
import { SHARED_CACHE_CONTEXT } from "#core/constants/shared-cache-context.constant";

/**
 * Forgets the cached queries an event makes stale.
 *
 * @example
 * registerCachedQueries([GetBalanceQuery]); // subscribes it to PointsEarned, PointsRedeemed, ...
 * // after PointsEarned commits in ten_1: cache.forget(CacheKey.of(GetBalanceQuery, "ten_1"))
 */
export class QueryCacheEvictorListener extends Listener {
  /** Where the query cache keeps its entries. */
  private readonly cache: Cache;

  /** Where the running call's context is kept, so the forget leaves it. */
  private readonly storage: ContextStorage;

  /**
   * @param cache - the bound cache.
   * @param storage - the storage the action pipeline runs each call in.
   */
  constructor(cache: Cache, storage: ContextStorage) {
    super();
    this.cache = cache;
    this.storage = storage;
  }

  /** Forgets every registered query `event` makes stale, in the event's tenant (all tenants when it has none). */
  async handle(event: Event, ctx: ListenerContext): Promise<void> {
    const queries = new Set(
      [...QUERY_CACHE_EVICTIONS].flatMap(([type, stale]) => (event instanceof type ? stale : [])),
    );
    await this.storage.run(SHARED_CACHE_CONTEXT, async () => {
      for (const query of queries)
        await this.cache.forget(
          ctx.scopeId === undefined ? CacheKey.of(query) : CacheKey.of(query, ctx.scopeId),
        );
    });
  }
}
