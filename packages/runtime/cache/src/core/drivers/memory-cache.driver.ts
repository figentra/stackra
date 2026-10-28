/**
 * Stackra file contract:
 * Purpose: the memory driver of the `Cache` port: entries in process memory, least recently read dropped first past
 *          `CacheConfig.maxEntries`, expiry read from the `Clock`, lifetimes jittered by `CacheConfig.jitter`, tags,
 *          stale-while-revalidate, one `remember` load per key at a time, and metrics through `CacheMetrics`.
 * Boundary: one process only; a value is kept by reference, so a caller treats what it reads as immutable. Each key is
 *           prefixed with the URI-encoded `CacheNamespace.current()` and `/`, so namespaces never share or forget each
 *           other's entries. Dead entries are dropped when read or pushed out by the bound, never by a timer. The
 *           behaviour is `storedCache` over `memoryEntryStore`; `remember`'s `lock` changes nothing here, since no other
 *           instance shares this store.
 * Runtime: isomorphic
 * Governing contract: ADR 0150 (decisions 1, 2 and 4: memory LRU, namespaced keys and tags, single-flight and
 *                     stale-while-revalidate); ADR 0305 (rule 32).
 */
import { Driver } from "@stackra/container";
import type { Clock, Duration } from "@stackra/contracts";

import type { CacheConfig } from "#config/cache.config";
import { Cache } from "#contracts/ports/cache.port";
import type { CacheMetrics } from "#contracts/ports/cache-metrics.port";
import type { CacheNamespace } from "#contracts/ports/cache-namespace.port";
import type { CacheKey } from "#contracts/types/cache-key.type";
import type { CachePutOptions } from "#contracts/types/cache-put-options.type";
import type { CacheRememberOptions } from "#contracts/types/cache-remember-options.type";
import { memoryEntryStore } from "#core/functions/memory-entry-store.function";
import { storedCache } from "#core/functions/stored-cache.function";
import type { CacheOperations } from "#core/types/cache-operations.type";

/**
 * Keeps values in process memory.
 *
 * @example
 * await cache.remember(CacheKey.of(Product, id), Duration.minutes(10), () => this.load(id), {
 *   tags: [CacheKey.of(Category, categoryId)],
 * });
 */
export class MemoryCacheDriver extends Driver(Cache) {
  private readonly cache: CacheOperations;

  /**
   * @param config - the entry bound and the lifetime jitter.
   * @param namespace - the prefix of every key; the shared namespace unless config `cache.namespace` selects another.
   * @param clock - the time source of expiry.
   * @param metrics - where hits, misses, loads and evictions go; config `cache.metrics` picks it (`none` by default).
   */
  constructor(config: CacheConfig, namespace: CacheNamespace, clock: Clock, metrics: CacheMetrics) {
    super();
    this.cache = storedCache(memoryEntryStore(config.maxEntries, clock), namespace, clock, {
      jitter: config.jitter,
      fill: config.fill,
      metrics,
    });
  }

  /** The value stored under `key`, or `undefined` when none is stored or it is no longer fresh. */
  get<T>(key: CacheKey): Promise<T | undefined> {
    return this.cache.get<T>(key);
  }

  /** Stores `value` under `key` for `ttl` with its tags; a zero `ttl` stores nothing. A load in flight is not stored. */
  put<T>(key: CacheKey, value: T, ttl: Duration, options?: CachePutOptions): Promise<void> {
    return this.cache.put(key, value, ttl, options);
  }

  /** The stored value, or the result of `load` stored for `ttl`; concurrent calls for one key share one `load`. */
  remember<T>(
    key: CacheKey,
    ttl: Duration,
    load: () => T | Promise<T>,
    options?: CacheRememberOptions,
  ): Promise<T> {
    return this.cache.remember(key, ttl, load, options);
  }

  /** Drops `key` and every key it covers; a covered load in flight answers its callers but is not stored. */
  forget(key: CacheKey): Promise<void> {
    return this.cache.forget(key);
  }

  /** Drops every entry of this namespace carrying `tag`; a tagged load in flight is not stored. */
  forgetTag(tag: CacheKey): Promise<void> {
    return this.cache.forgetTag(tag);
  }
}
