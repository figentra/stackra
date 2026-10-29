/**
 * Stackra file contract:
 * Purpose: the Valkey driver of the `Cache` port (`driver: "valkey"`), for services: entries on a Valkey (Redis
 *          protocol) server shared by every instance of the member, so a value cached by one instance serves all, with
 *          tags, stale-while-revalidate and, through `CacheLock`, one load across instances.
 * Boundary: the server is the `CACHE_VALKEY_URL` secret; every key is `cache.valkey.keyPrefix` plus the namespaced
 *           key. Each value is JSON with its expiry on the `Clock`, written with `PX` so the server reclaims it. A set
 *           (the keys a key covers, the keys carrying a tag) is a sorted set at `<keyPrefix>#<set>`, each member scored
 *           with the instant its entry may go: an add drops the members already past it and keeps the set alive as
 *           long as its longest member, so `forget` and `forgetTag` read one set and never `SCAN`. No command touches
 *           two keys, so the keys may live on different cluster slots. Single-flight is per process. A command is
 *           retried once, then rejects: an unreachable server fails the cache call instead of queueing it.
 * Runtime: node
 * Governing contract: ADR 0150 (decisions 1, 2 and 4); ADR 0173 (secrets by name); ADR 0305 (rule 32).
 */
import type { Clock } from "@stackra/contracts";
import { Duration } from "@stackra/contracts";
import Valkey from "iovalkey";

import type { CacheConfig } from "#config/cache.config";
import type { Cache } from "#contracts/ports/cache.port";
import type { CacheLock } from "#contracts/ports/cache-lock.port";
import type { CacheMetrics } from "#contracts/ports/cache-metrics.port";
import type { CacheNamespace } from "#contracts/ports/cache-namespace.port";
import { StoredCacheDriver } from "#core/drivers/stored-cache.driver";
import { textEntryStore } from "#core/functions/text-entry-store.function";

/** Between the key prefix and a set's name; `encodeURIComponent` never leaves it in a namespace, so no entry key has it. */
const SET_MARK = "#";

/**
 * Keeps values on a Valkey server.
 *
 * @example
 * // runway.yaml (staging): config.cache: { driver: valkey, lock: locks, valkey: { keyPrefix: "commerce:" } }
 * await cache.remember(CacheKey.of(Product, id), Duration.minutes(10), () => this.load(id), { lock: true });
 */
export class ValkeyCacheDriver extends StoredCacheDriver<Cache> {
  /** The client every call goes through. */
  readonly client: Valkey;

  /**
   * @param config - the server (`valkeyUrl`, the `CACHE_VALKEY_URL` secret), the key prefix (`valkey.keyPrefix`), the
   *   lifetime jitter and the cross-instance fill wait.
   * @param namespace - the prefix of every key; the shared namespace unless config `cache.namespace` selects another.
   * @param clock - the time source of expiry.
   * @param lock - guards a `remember(..., { lock: true })` fill across instances; config `cache.lock` picks it.
   * @param metrics - where hits, misses, loads and evictions go; config `cache.metrics` picks it.
   * @throws TypeError when the `CACHE_VALKEY_URL` secret is not set.
   */
  constructor(
    config: CacheConfig,
    namespace: CacheNamespace,
    clock: Clock,
    lock: CacheLock,
    metrics: CacheMetrics,
  ) {
    if (config.valkeyUrl === "")
      throw new TypeError(
        "The valkey cache driver needs a server: set the CACHE_VALKEY_URL secret",
      );
    const prefix = config.valkey.keyPrefix;
    const setKey = (set: string): string => prefix + SET_MARK + set;
    const client = new Valkey(config.valkeyUrl, { maxRetriesPerRequest: 1 });
    super(
      textEntryStore({
        read: async (key) => (await client.get(prefix + key)) ?? undefined,
        write: async (key, text, ttl) => {
          await client.set(prefix + key, text, "PX", Math.ceil(Duration.toMilliseconds(ttl)));
        },
        delete: async (key) => {
          await client.del(prefix + key);
        },
        add: async (set, member, ttl) => {
          const name = setKey(set);
          const lifetime = Math.ceil(Duration.toMilliseconds(ttl));
          const now = clock.now().getTime();
          // GT keeps the later instant when a key is written again.
          await client.zadd(name, "GT", now + lifetime, member);
          await Promise.all([
            client.zremrangebyscore(name, "-inf", now),
            // NX gives a new set its lifetime; GT extends it for a longer member.
            client.pexpire(name, lifetime, "NX"),
            client.pexpire(name, lifetime, "GT"),
          ]);
        },
        members: (set) => client.zrange(setKey(set), 0, -1),
        clear: async (set) => {
          await client.del(setKey(set));
        },
      }),
      namespace,
      clock,
      { jitter: config.jitter, fill: config.fill, lock, metrics },
    );
    this.client = client;
  }
}
