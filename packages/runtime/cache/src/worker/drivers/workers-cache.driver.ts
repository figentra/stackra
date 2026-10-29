/**
 * Stackra file contract:
 * Purpose: the Workers driver of the `Cache` port (`driver: "workers"`), for a web member on Cloudflare Workers: the
 *          query data the routes cache by profile, in the Workers KV namespace bound under `cache.workers.binding`, so
 *          every isolate and location shares an entry (ADR 0297 decision 3).
 * Boundary: the namespace is found by its binding name when the driver is built; a missing binding fails the boot.
 *           Each value is JSON in an envelope with its expiry on the `Clock`, so a lifetime under KV's 60-second floor
 *           still ends on time; KV's own expiry only reclaims space. `forget` lists KV by prefix; a tag's members
 *           are empty marker keys under `#`, each expiring with its entry. KV is eventually consistent: a write, a
 *           `forget` or a `forgetTag` reaches other locations within about a minute. Single-flight is per isolate;
 *           `CacheLock` (config `cache.lock`) can share a fill. HTML is never cached here (ADR 0297 decision 3).
 * Runtime: worker
 * Governing contract: ADR 0297 (decision 3); ADR 0150 (decisions 1, 2 and 4, amended by ADR 0297); ADR 0305 (rule 32).
 */
import type { Clock } from "@stackra/contracts";
import { Duration } from "@stackra/contracts";

import type { CacheConfig } from "#config/cache.config";
import type { Cache } from "#contracts/ports/cache.port";
import type { CacheLock } from "#contracts/ports/cache-lock.port";
import type { CacheMetrics } from "#contracts/ports/cache-metrics.port";
import type { CacheNamespace } from "#contracts/ports/cache-namespace.port";
import { StoredCacheDriver } from "#core/drivers/stored-cache.driver";
import { markerSets } from "#core/functions/marker-sets.function";
import { textEntryStore } from "#core/functions/text-entry-store.function";
import { workerBinding } from "#worker/functions/worker-binding.function";
import type { WorkersKvNamespace } from "#worker/types/workers-kv-namespace.type";

/** The shortest `expirationTtl` KV accepts, in seconds. */
const KV_MIN_TTL_SECONDS = 60;

/**
 * Keeps values in Workers KV.
 *
 * @example
 * // generated wiring, web worker
 * { port: Cache, candidates: { workers: () => import("@stackra/cache/worker").then((m) => m.WorkersCacheDriver) } }
 */
export class WorkersCacheDriver extends StoredCacheDriver<Cache> {
  /**
   * @param config - the binding name of the KV namespace (`workers.binding`).
   * @param namespace - the prefix of every key; the shared namespace unless config `cache.namespace` selects another.
   * @param clock - the time source of expiry.
   * @param lock - guards a `remember(..., { lock: true })` fill across isolates; config `cache.lock` picks it.
   * @param metrics - where hits, misses, loads and evictions go; config `cache.metrics` picks it.
   * @throws TypeError when the Worker has no KV namespace bound under that name.
   */
  constructor(
    config: CacheConfig,
    namespace: CacheNamespace,
    clock: Clock,
    lock: CacheLock,
    metrics: CacheMetrics,
  ) {
    const { binding } = config.workers;
    const bound = workerBinding(binding) as Partial<WorkersKvNamespace> | undefined;
    if (typeof bound?.get !== "function" || typeof bound.list !== "function")
      throw new TypeError(
        `The workers cache driver needs a KV namespace bound as ${binding}: ` +
          "add it to the Worker or set cache.workers.binding",
      );
    const kv = bound as WorkersKvNamespace;
    const write = (key: string, text: string, ttl: Duration): Promise<void> =>
      kv.put(key, text, {
        expirationTtl: Math.max(KV_MIN_TTL_SECONDS, Math.ceil(Duration.toMilliseconds(ttl) / 1000)),
      });
    const remove = (key: string): Promise<void> => kv.delete(key);
    const keys = async (prefix: string): Promise<readonly string[]> => {
      const names: string[] = [];
      let cursor: string | undefined;
      do {
        const page = await kv.list(cursor === undefined ? { prefix } : { prefix, cursor });
        names.push(...page.keys.map((entry) => entry.name));
        cursor = page.list_complete ? undefined : page.cursor;
      } while (cursor !== undefined);
      return names;
    };
    super(
      textEntryStore({
        read: async (key) => (await kv.get(key, "text")) ?? undefined,
        write,
        delete: remove,
        keys,
        ...markerSets({ write, delete: remove, keys }),
      }),
      namespace,
      clock,
      { jitter: config.jitter, fill: config.fill, lock, metrics },
    );
  }
}
