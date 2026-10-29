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
import type { Clock } from "@stackra/contracts";

import type { CacheConfig } from "#config/cache.config";
import type { Cache } from "#contracts/ports/cache.port";
import type { CacheMetrics } from "#contracts/ports/cache-metrics.port";
import type { CacheNamespace } from "#contracts/ports/cache-namespace.port";
import { StoredCacheDriver } from "#core/drivers/stored-cache.driver";
import { memoryEntryStore } from "#core/functions/memory-entry-store.function";

/**
 * Keeps values in process memory.
 *
 * @example
 * await cache.remember(CacheKey.of(Product, id), Duration.minutes(10), () => this.load(id), {
 *   tags: [CacheKey.of(Category, categoryId)],
 * });
 */
export class MemoryCacheDriver extends StoredCacheDriver<Cache> {
  /**
   * @param config - the entry bound and the lifetime jitter.
   * @param namespace - the prefix of every key; the shared namespace unless config `cache.namespace` selects another.
   * @param clock - the time source of expiry.
   * @param metrics - where hits, misses, loads and evictions go; config `cache.metrics` picks it (`none` by default).
   */
  constructor(config: CacheConfig, namespace: CacheNamespace, clock: Clock, metrics: CacheMetrics) {
    super(memoryEntryStore(config.maxEntries, clock), namespace, clock, {
      jitter: config.jitter,
      fill: config.fill,
      metrics,
    });
  }
}
