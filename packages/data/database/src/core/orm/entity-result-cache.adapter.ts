/**
 * Stackra file contract:
 * Purpose: `EntityResultCacheAdapter`, MikroORM's result-cache adapter over the bound `Cache`: the store behind the
 *          entity cache of `Cached` models, so a row read by its id is answered from the shared cache and hydrated
 *          into the unit of work by the ORM itself.
 * Boundary: `PostgresDatabaseDriver` names it as the ORM's `resultCache.adapter`; it reaches `Cache` and
 *           `ContextStorage` through the resolver `connectVisibilityFilter` connected, and with no `Cache` bound it
 *           stores nothing and answers nothing. Every call runs under `SHARED_CACHE_CONTEXT`. A failing cache never
 *           fails a read: a get answers a miss and a write is dropped. Names are the `CacheKey`s `entityCacheOf`
 *           builds (the ORM may append its session context after them, which the row's key still covers).
 * Runtime: node
 * Governing contract: ADR 0150 (decision 5: second-level cache); ADR 0097 (MikroORM only here); data-layer gap ca5.
 */
import type { CacheAdapter } from "@mikro-orm/core";
import { ContextStorage } from "@stackra/actions/contracts";
import type { CacheKey } from "@stackra/cache";
import { Cache } from "@stackra/cache/contracts";
import { Duration } from "@stackra/contracts";

import { SHARED_CACHE_CONTEXT } from "#core/constants/shared-cache-context.constant";
import { VISIBILITY_HOST } from "#core/constants/visibility-host.constant";

/** Runs `work` on the bound cache in the shared namespace, or answers undefined with none bound or on its failure. */
async function shared<T>(work: (cache: Cache) => Promise<T>): Promise<T | undefined> {
  const { resolver } = VISIBILITY_HOST;
  if (resolver === undefined || !resolver.has(Cache)) return undefined;
  const cache = resolver.get(Cache);
  try {
    return resolver.has(ContextStorage)
      ? await resolver.get(ContextStorage).run(SHARED_CACHE_CONTEXT, () => work(cache))
      : await work(cache);
  } catch {
    // A cache outage turns into a read from the database, never a failed read.
    return undefined;
  }
}

/**
 * The ORM's result cache on the bound `Cache`.
 *
 * @example
 * await MikroORM.init({ ...options, resultCache: { adapter: EntityResultCacheAdapter } });
 */
export class EntityResultCacheAdapter implements CacheAdapter {
  /** The stored result under `name` (`null` for a stored miss), or undefined. */
  get<T>(name: string): Promise<T | undefined> {
    return shared((cache) => cache.get<T>(name as CacheKey));
  }

  /** Stores `data` under `name` for `expiration` milliseconds; without a positive expiration it stores nothing. */
  async set(name: string, data: unknown, _origin: string, expiration?: number): Promise<void> {
    if (expiration === undefined || expiration <= 0) return;
    await shared((cache) => cache.put(name as CacheKey, data, Duration.seconds(expiration / 1000)));
  }

  /** Drops `name` and every key it covers. */
  async remove(name: string): Promise<void> {
    await shared((cache) => cache.forget(name as CacheKey));
  }

  /** Does nothing: the shared cache is never cleared whole from one service; rows leave by change or lifetime. */
  clear(): void {}
}
