/**
 * Stackra file contract:
 * Purpose: the storage driver of the `Cache` port (`driver: "storage"`), for client targets: entries in the `cache`
 *          area of `@stackra/storage` (localStorage on the web, MMKV on mobile), so a cached value survives a reload.
 * Boundary: keys are `cache.` plus the namespaced key, beside the other users of the area; a tag's members are empty
 *           marker keys under `cache.#`. Each value is JSON with its expiry on the `Clock`; the area's own time-to-live
 *           only reclaims space. `forget` lists the area's keys by prefix. Reads and writes go to the area's memory
 *           copy and persist in the background (`Storage.flush()`). Single-flight is per process and `lock` changes
 *           nothing here. The `cache` area holds disposable data a reload may rebuild; it is not where secrets go.
 * Runtime: isomorphic
 * Governing contract: ADR 0150 (decisions 1, 2 and 4); ADR 0256 (decision 2: the `cache` area); ADR 0305 (rule 32).
 */
import type { Clock, Duration } from "@stackra/contracts";
import type { Storage } from "@stackra/storage/contracts";

import type { Cache } from "#contracts/ports/cache.port";
import type { CacheMetrics } from "#contracts/ports/cache-metrics.port";
import type { CacheNamespace } from "#contracts/ports/cache-namespace.port";
import { StoredCacheDriver } from "#core/drivers/stored-cache.driver";
import { markerSets } from "#core/functions/marker-sets.function";
import { textEntryStore } from "#core/functions/text-entry-store.function";

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
export class StorageCacheDriver extends StoredCacheDriver<Cache> {
  /**
   * @param storage - the client storage; this driver uses its `cache` area only.
   * @param namespace - the prefix of every key; the shared namespace unless config `cache.namespace` selects another.
   * @param clock - the time source of expiry.
   * @param metrics - where hits, misses, loads and evictions go; config `cache.metrics` picks it (`none` by default).
   */
  constructor(storage: Storage, namespace: CacheNamespace, clock: Clock, metrics: CacheMetrics) {
    const area = storage.cache;
    const write = (key: string, text: string, ttl: Duration): Promise<void> => {
      area.set(PREFIX + key, text, { ttl });
      return Promise.resolve();
    };
    const remove = (key: string): Promise<void> => {
      area.delete(PREFIX + key);
      return Promise.resolve();
    };
    const keys = (prefix: string): Promise<readonly string[]> =>
      Promise.resolve(
        area
          .keys()
          .filter((name) => name.startsWith(PREFIX + prefix))
          .map((name) => name.slice(PREFIX.length)),
      );
    super(
      textEntryStore({
        read: (key) => {
          const text = area.get(PREFIX + key);
          return Promise.resolve(typeof text === "string" ? text : undefined);
        },
        write,
        delete: remove,
        keys,
        ...markerSets({ write, delete: remove, keys }),
      }),
      namespace,
      clock,
      { metrics },
    );
  }
}
