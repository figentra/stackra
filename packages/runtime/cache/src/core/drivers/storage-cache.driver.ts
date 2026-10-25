/**
 * Stackra file contract:
 * Purpose: the storage driver of the `Cache` port (`driver: "storage"`), for client targets: entries in the `cache`
 *          area of `@stackra/storage` (localStorage on the web, MMKV on mobile), so a cached value survives a reload.
 * Boundary: keys are `cache.` plus the namespaced key, beside the other users of the area. Each value is JSON in an
 *           envelope with its expiry on the `Clock`; the area's own time-to-live only reclaims space. Reads and writes
 *           go to the area's memory copy and persist in the background (`Storage.flush()`). Single-flight is per
 *           process. The `cache` area holds disposable data a reload may rebuild; it is not where secrets go.
 * Runtime: isomorphic
 * Governing contract: ADR 0150 (decisions 1, 2 and 4); ADR 0256 (decision 2: the `cache` area); ADR 0305 (rule 32).
 */
import { Driver } from "@stackra/container";
import type { Clock, Duration } from "@stackra/contracts";
import type { Storage } from "@stackra/storage/contracts";

import { Cache } from "#contracts/ports/cache.port";
import type { CacheNamespace } from "#contracts/ports/cache-namespace.port";
import type { CacheKey } from "#contracts/types/cache-key.type";
import { storedCache } from "#core/functions/stored-cache.function";
import type { CacheOperations } from "#core/types/cache-operations.type";

/** In front of every key this driver writes to the shared `cache` area. */
const PREFIX = "cache.";

/**
 * Keeps values in the client's `cache` storage area.
 *
 * @example
 * // generated wiring, a client target
 * { port: Cache, candidates: { storage: () => import("@stackra/cache").then((m) => m.StorageCacheDriver) } }
 * await cache.remember(CacheKey.of(Product, id), Duration.minutes(10), () => this.load(id));
 */
export class StorageCacheDriver extends Driver(Cache) {
  private readonly cache: CacheOperations;

  /**
   * @param storage - the client storage; this driver uses its `cache` area only.
   * @param namespace - the prefix of every key; the shared namespace unless the tenancy package binds its driver.
   * @param clock - the time source of expiry.
   */
  constructor(storage: Storage, namespace: CacheNamespace, clock: Clock) {
    super();
    const area = storage.cache;
    this.cache = storedCache(
      {
        read: (key) => {
          const text = area.get(PREFIX + key);
          return Promise.resolve(typeof text === "string" ? text : undefined);
        },
        write: (key, text, ttl) => {
          area.set(PREFIX + key, text, { ttl });
          return Promise.resolve();
        },
        delete: (key) => {
          area.delete(PREFIX + key);
          return Promise.resolve();
        },
        keys: (prefix) =>
          Promise.resolve(
            area
              .keys()
              .filter((name) => name.startsWith(PREFIX + prefix))
              .map((name) => name.slice(PREFIX.length)),
          ),
      },
      namespace,
      clock,
    );
  }

  /** The value stored under `key`, or `undefined` when none is stored or it has expired. */
  get<T>(key: CacheKey): Promise<T | undefined> {
    return this.cache.get<T>(key);
  }

  /** Stores `value` under `key` for `ttl`; a zero `ttl` stores nothing. A load in flight for `key` is not stored. */
  put<T>(key: CacheKey, value: T, ttl: Duration): Promise<void> {
    return this.cache.put(key, value, ttl);
  }

  /** The stored value, or the result of `load` stored for `ttl`; concurrent calls for one key share one `load`. */
  remember<T>(key: CacheKey, ttl: Duration, load: () => T | Promise<T>): Promise<T> {
    return this.cache.remember(key, ttl, load);
  }

  /** Drops `key` and every key it covers; a covered load in flight answers its callers but is not stored. */
  forget(key: CacheKey): Promise<void> {
    return this.cache.forget(key);
  }
}
