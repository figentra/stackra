/**
 * Stackra file contract:
 * Purpose: the Valkey driver of the `Cache` port (`driver: "valkey"`), for services: entries on a Valkey (Redis
 *          protocol) server shared by every instance of the member, so a value cached by one instance serves all.
 * Boundary: the server is the `CACHE_VALKEY_URL` secret; every key is `cache.valkey.keyPrefix` plus the namespaced
 *           key. Each value is JSON in an envelope with its expiry on the `Clock`, written with `PX` so the server
 *           reclaims it. `forget` walks `SCAN MATCH` over the covered prefix, so it needs one endpoint, not cluster
 *           mode. Single-flight is per process. A command is retried once, then rejects: an unreachable server fails
 *           the cache call instead of queueing it.
 * Runtime: node
 * Governing contract: ADR 0150 (decisions 1, 2 and 4); ADR 0173 (secrets by name); ADR 0305 (rule 32).
 */
import { Driver } from "@stackra/container";
import type { Clock } from "@stackra/contracts";
import { Duration } from "@stackra/contracts";
import Valkey from "iovalkey";

import type { CacheConfig } from "#config/cache.config";
import { Cache } from "#contracts/ports/cache.port";
import type { CacheNamespace } from "#contracts/ports/cache-namespace.port";
import type { CacheKey } from "#contracts/types/cache-key.type";
import { storedCache } from "#core/functions/stored-cache.function";
import type { CacheOperations } from "#core/types/cache-operations.type";

/** Keys `SCAN` looks at per round trip. */
const SCAN_COUNT = 500;

/** `text` with the glob characters of `MATCH` escaped, so it matches only itself. */
function literal(text: string): string {
  return text.replaceAll(/[*?[\]\\]/g, "\\$&");
}

/**
 * Keeps values on a Valkey server.
 *
 * @example
 * // runway.yaml (staging): config.cache: { driver: valkey, valkey: { keyPrefix: "commerce:" } }
 * await cache.remember(CacheKey.of(Product, id), Duration.minutes(10), () => this.load(id));
 */
export class ValkeyCacheDriver extends Driver(Cache) {
  /** The client every call goes through. */
  readonly client: Valkey;

  private readonly cache: CacheOperations;

  /**
   * @param config - the server (`valkeyUrl`, the `CACHE_VALKEY_URL` secret) and the key prefix (`valkey.keyPrefix`).
   * @param namespace - the prefix of every key; the shared namespace unless config `cache.namespace` selects another.
   * @param clock - the time source of expiry.
   * @throws TypeError when the `CACHE_VALKEY_URL` secret is not set.
   */
  constructor(config: CacheConfig, namespace: CacheNamespace, clock: Clock) {
    super();
    if (config.valkeyUrl === "")
      throw new TypeError(
        "The valkey cache driver needs a server: set the CACHE_VALKEY_URL secret",
      );
    const prefix = config.valkey.keyPrefix;
    const client = new Valkey(config.valkeyUrl, { maxRetriesPerRequest: 1 });
    this.client = client;
    this.cache = storedCache(
      {
        read: async (key) => (await client.get(prefix + key)) ?? undefined,
        write: async (key, text, ttl) => {
          await client.set(prefix + key, text, "PX", Math.ceil(Duration.toMilliseconds(ttl)));
        },
        delete: async (key) => {
          await client.del(prefix + key);
        },
        keys: async (start) => {
          const names = new Set<string>();
          let cursor = "0";
          do {
            const [next, batch] = await client.scan(
              cursor,
              "MATCH",
              `${literal(prefix + start)}*`,
              "COUNT",
              SCAN_COUNT,
            );
            // SCAN may return a key twice; the set keeps one.
            for (const name of batch) names.add(name.slice(prefix.length));
            cursor = next;
          } while (cursor !== "0");
          return [...names];
        },
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
