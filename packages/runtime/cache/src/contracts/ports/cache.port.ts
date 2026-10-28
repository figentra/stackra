/**
 * Stackra file contract:
 * Purpose: the `Cache` port: a cached value inside a service, driver or listener, under an explicit key and lifetime.
 * Boundary: an abstract class that is its own token, keyed `cache.Cache`; drivers implement it with
 *           `extends Driver(Cache)` and config `cache.driver` picks one (`memory`, `storage`, `valkey`, `postgres`,
 *           `workers`).
 *           Every driver prefixes each key with `CacheNamespace.current()`, so two namespaces never share an entry,
 *           and runs at most one `remember` load per key at a time (single-flight). Values are whatever the caller
 *           stores; a network driver serialises them, so store plain data. An entry is dropped by its key, by a key
 *           that covers it, or by one of its tags (`forgetTag`); tags and keys never cross namespaces. `remember` can
 *           serve a stale entry while one caller reloads it, and with `lock` shares one load across instances
 *           (`CacheLock`). There is no `@Cached` facet and no `ctx.cache`.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 32 and 33); ADR 0150 (decisions 2 and 4: keys, tags, single-flight, stale-while-revalidate); ADR 0294 (decisions 15, 16 and 17).
 */
import type { Duration } from "@stackra/contracts";
import { Port } from "@stackra/contracts";

import type { CacheKey } from "#contracts/types/cache-key.type";
import type { CachePutOptions } from "#contracts/types/cache-put-options.type";
import type { CacheRememberOptions } from "#contracts/types/cache-remember-options.type";

/**
 * Holds values for a while.
 *
 * @example
 * constructor(cache: Cache) { ... }
 *
 * view(id: PublicId<"prd">, locale: Locale): Promise<ProductView> {
 *   return this.cache.remember(CacheKey.of(Product, id, locale), Duration.minutes(10), () => this.load(id, locale));
 * }
 *
 * ctx.afterCommit(() => this.cache.forget(CacheKey.of(Product, product.id))); // every locale's view
 * ctx.afterCommit(() => this.cache.forgetTag(CacheKey.of(Category, category.id))); // every entry tagged with it
 */
export abstract class Cache extends Port {
  /** Type-only port key, so `DriverName<Cache>` narrows to this port's drivers. */
  declare readonly "~key": "cache.Cache";

  /** The value stored under `key`, or `undefined` when none is stored or it has expired. */
  abstract get<T>(key: CacheKey): Promise<T | undefined>;

  /**
   * Stores `value` under `key` for `ttl`, tagged with `options.tags`; a zero `ttl` stores nothing. A load in flight
   * for `key` is not stored.
   */
  abstract put<T>(key: CacheKey, value: T, ttl: Duration, options?: CachePutOptions): Promise<void>;

  /**
   * The value stored under `key`, or the result of `load`, stored for `ttl`. Concurrent calls for one key share one
   * `load`. A rejected `load` stores nothing and rejects every caller that shared it. With `options.stale`, an entry
   * past its lifetime but inside the window is answered at once while one background load replaces it; with
   * `options.lock`, one load runs across the instances that share the store.
   */
  abstract remember<T>(
    key: CacheKey,
    ttl: Duration,
    load: () => T | Promise<T>,
    options?: CacheRememberOptions,
  ): Promise<T>;

  /**
   * Drops `key` and every key it covers: `CacheKey.of(Product, id)` covers `CacheKey.of(Product, id, locale)`. A load in
   * flight for a covered key still answers its callers but is not stored.
   */
  abstract forget(key: CacheKey): Promise<void>;

  /**
   * Drops every entry of the current namespace stored with `tag` among its tags. Tags match exactly. A load in flight
   * that carries the tag still answers its callers but is not stored.
   */
  abstract forgetTag(tag: CacheKey): Promise<void>;
}
