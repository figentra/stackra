/**
 * Stackra file contract:
 * Purpose: `StoredCacheDriver`, the base every `Cache` driver of this package extends: it builds `storedCache` over the
 *          `CacheEntryStore` its subclass passes and answers the five port methods from it.
 * Boundary: abstract and internal to the package: a driver is a subclass whose own constructor takes the dependencies
 *           (gen reads them there) and passes its store, namespace, clock and settings to `super`. It holds no store of
 *           its own. A subclass names its port as the type argument (`extends StoredCacheDriver<Cache>`): gen reads a
 *           driver's port from its own heritage, and a bare `extends StoredCacheDriver` would leave it out of the
 *           manifest's candidates.
 * Runtime: isomorphic
 * Governing contract: ADR 0150 (decisions 1, 2 and 4); ADR 0305 (rule 32).
 */
import { Driver } from "@stackra/container";
import type { Clock, Duration } from "@stackra/contracts";

import { Cache } from "#contracts/ports/cache.port";
import type { CacheNamespace } from "#contracts/ports/cache-namespace.port";
import type { CacheKey } from "#contracts/types/cache-key.type";
import type { CachePutOptions } from "#contracts/types/cache-put-options.type";
import type { CacheRememberOptions } from "#contracts/types/cache-remember-options.type";
import { storedCache } from "#core/functions/stored-cache.function";
import type { CacheEntryStore } from "#core/types/cache-entry-store.type";
import type { CacheOperations } from "#core/types/cache-operations.type";
import type { StoredCacheSettings } from "#core/types/stored-cache-settings.type";

/**
 * The shared base of this package's cache drivers.
 *
 * @example
 * export class MemoryCacheDriver extends StoredCacheDriver<Cache> {
 *   constructor(config: CacheConfig, namespace: CacheNamespace, clock: Clock, metrics: CacheMetrics) {
 *     super(memoryEntryStore(config.maxEntries, clock), namespace, clock, { metrics });
 *   }
 * }
 */
export abstract class StoredCacheDriver<P extends Cache> extends Driver(Cache) {
  /** The port this driver serves, as its subclass names it; a type only, never set. */
  declare protected readonly port?: P;

  /** The cache calls over the subclass's store. */
  private readonly cache: CacheOperations;

  /**
   * @param store - where the entries and sets live.
   * @param namespace - the prefix of every key.
   * @param clock - the time source of expiry.
   * @param settings - the lifetime jitter, the fill wait, the fill lock and the metrics port.
   */
  protected constructor(
    store: CacheEntryStore,
    namespace: CacheNamespace,
    clock: Clock,
    settings: Partial<StoredCacheSettings>,
  ) {
    super();
    this.cache = storedCache(store, namespace, clock, settings);
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
