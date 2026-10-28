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
import { Driver } from "@stackra/container";
import type { Clock } from "@stackra/contracts";
import { Duration } from "@stackra/contracts";
import Valkey from "iovalkey";

import type { CacheConfig } from "#config/cache.config";
import { Cache } from "#contracts/ports/cache.port";
import type { CacheLock } from "#contracts/ports/cache-lock.port";
import type { CacheMetrics } from "#contracts/ports/cache-metrics.port";
import type { CacheNamespace } from "#contracts/ports/cache-namespace.port";
import type { CacheKey } from "#contracts/types/cache-key.type";
import type { CachePutOptions } from "#contracts/types/cache-put-options.type";
import type { CacheRememberOptions } from "#contracts/types/cache-remember-options.type";
import { storedCache } from "#core/functions/stored-cache.function";
import { textEntryStore } from "#core/functions/text-entry-store.function";
import type { CacheOperations } from "#core/types/cache-operations.type";

/** Between the key prefix and a set's name; `encodeURIComponent` never leaves it in a namespace, so no entry key has it. */
const SET_MARK = "#";

/**
 * Keeps values on a Valkey server.
 *
 * @example
 * // runway.yaml (staging): config.cache: { driver: valkey, lock: locks, valkey: { keyPrefix: "commerce:" } }
 * await cache.remember(CacheKey.of(Product, id), Duration.minutes(10), () => this.load(id), { lock: true });
 */
export class ValkeyCacheDriver extends Driver(Cache) {
  /** The client every call goes through. */
  readonly client: Valkey;

  private readonly cache: CacheOperations;

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
    super();
    if (config.valkeyUrl === "")
      throw new TypeError(
        "The valkey cache driver needs a server: set the CACHE_VALKEY_URL secret",
      );
    const prefix = config.valkey.keyPrefix;
    const setKey = (set: string): string => prefix + SET_MARK + set;
    const client = new Valkey(config.valkeyUrl, { maxRetriesPerRequest: 1 });
    this.client = client;
    this.cache = storedCache(
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

  /** Drops `key` and every key it covers, read from its index set; a covered load in flight is not stored. */
  forget(key: CacheKey): Promise<void> {
    return this.cache.forget(key);
  }

  /** Drops every entry of this namespace carrying `tag`; a tagged load in flight is not stored. */
  forgetTag(tag: CacheKey): Promise<void> {
    return this.cache.forgetTag(tag);
  }
}
