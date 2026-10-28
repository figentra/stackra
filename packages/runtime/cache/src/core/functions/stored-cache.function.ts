/**
 * Stackra file contract:
 * Purpose: `storedCache`, the `Cache` behaviour every driver shares: keys behind the URI-encoded namespace and `/`,
 *          each entry kept with the instant it stops being fresh (and, with a stale window, the instant it stops being
 *          served) on the `Clock`, lifetimes shortened at random by up to `jitter`, one `remember` load per key at a
 *          time in this process, stale-while-revalidate, one load across instances through `CacheLock`, `forget` of a
 *          key and every key it covers, `forgetTag` of every entry carrying a tag, and hit, miss, load and evict
 *          metrics per key owner.
 * Boundary: internal to the package; a driver hands it a `CacheEntryStore` (`memoryEntryStore`, or `textEntryStore`
 *           over an outside store) and delegates the five port methods. The entry's instants decide what is served;
 *           the store's own expiry only reclaims space. `forget` lists the covered keys when the store can (`keys`),
 *           and otherwise reads the index set every write adds the key to under each key that covers it; nothing scans
 *           the whole store. Single-flight is per process; `lock` adds one across instances, and a caller that loses
 *           the lock reads the store every `fill.poll` for up to `fill.wait`, then loads itself. A failed background
 *           reload leaves the stale entry. A store failure rejects the call; nothing falls back to the load or swallows
 *           the error. A metric that throws is ignored.
 * Runtime: isomorphic
 * Governing contract: ADR 0150 (decisions 1, 2 and 4: drivers, namespaced keys and tags, single-flight and
 *                     stale-while-revalidate); ADR 0297 (decision 3); ADR 0305 (rule 32).
 */
import type { Clock } from "@stackra/contracts";
import { Duration } from "@stackra/contracts";

import type { CacheNamespace } from "#contracts/ports/cache-namespace.port";
import type { CacheKey } from "#contracts/types/cache-key.type";
import type { CacheMetricEvent } from "#contracts/types/cache-metric-event.type";
import type { CachePutOptions } from "#contracts/types/cache-put-options.type";
import type { CacheRememberOptions } from "#contracts/types/cache-remember-options.type";
import { LocalCacheLockDriver } from "#core/drivers/local-cache-lock.driver";
import { NoneCacheMetricsDriver } from "#core/drivers/none-cache-metrics.driver";
import { coversKey } from "#core/functions/covers-key.function";
import { keyAncestors } from "#core/functions/key-ancestors.function";
import { keyOwner } from "#core/functions/key-owner.function";
import type { CacheEntry } from "#core/types/cache-entry.type";
import type { CacheEntryStore } from "#core/types/cache-entry-store.type";
import type { CacheOperations } from "#core/types/cache-operations.type";
import type { StoredCacheSettings } from "#core/types/stored-cache-settings.type";

/**
 * One load in progress (a `remember` fill or a background reload); `stale` once a `put`, `forget` or `forgetTag`
 * covered it, so its result is not stored. `tags` are its namespaced tags.
 */
type Flight = { promise: Promise<unknown>; stale: boolean; readonly tags: ReadonlySet<string> };

/** What one call works on: the namespace prefix read once at its start, and the key behind it. */
type Target = { readonly space: string; readonly key: CacheKey; readonly scoped: string };

/** The fill wait when a driver passes none: five seconds, read every 50 ms. */
const DEFAULT_FILL = Object.freeze({ wait: Duration.seconds(5), poll: Duration.parse("50ms") });

/** The index set of the keys `scoped` covers (stores without `keys` only). */
const coveredSet = (scoped: string): string => `k/${scoped}`;

/** The set of the keys carrying the namespaced tag `scopedTag`. */
const tagSet = (scopedTag: string): string => `t/${scopedTag}`;

/** The lock key of a fill of `at`; it carries the namespace. */
const lockKey = (at: Target): string => `cache.fill:${at.scoped}`;

/** Resolves after `milliseconds`. */
const sleep = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });

/** The milliseconds of `duration`, or zero for none, zero or a forged duration that reads as NaN. */
function millisecondsOf(duration: Duration | undefined): number {
  const milliseconds = duration === undefined ? 0 : Duration.toMilliseconds(duration);
  return milliseconds > 0 ? milliseconds : 0;
}

/**
 * The `Cache` calls over `store`, scoped by `namespace` and expiring on `clock`.
 *
 * @example
 * this.cache = storedCache(textEntryStore(store), namespace, clock, { jitter: config.jitter, fill: config.fill, lock, metrics });
 * get<T>(key: CacheKey): Promise<T | undefined> {
 *   return this.cache.get<T>(key);
 * }
 */
export function storedCache(
  store: CacheEntryStore,
  namespace: CacheNamespace,
  clock: Clock,
  settings: Partial<StoredCacheSettings> = {},
): CacheOperations {
  const jitter = settings.jitter ?? 0;
  const fill = settings.fill ?? DEFAULT_FILL;
  const lock = settings.lock ?? new LocalCacheLockDriver();
  const metrics = settings.metrics ?? new NoneCacheMetricsDriver();
  const random = settings.random ?? Math.random;

  /** Scoped key to the `remember` fill in progress for it. */
  const flights = new Map<string, Flight>();
  /** Scoped key to the background reload of its stale entry. */
  const reloads = new Map<string, Flight>();

  /** `key` behind the current namespace; encoding the namespace keeps `/` its only separator. */
  const target = (key: CacheKey): Target => {
    const space = `${encodeURIComponent(namespace.current())}/`;
    return { space, key, scoped: space + key };
  };

  /** Hands one observation to the metrics port; a metric never changes what the cache answers. */
  const record = (event: CacheMetricEvent, key: string, value: number): void => {
    try {
      metrics.record({ event, owner: keyOwner(key), value });
    } catch {
      // A metrics driver must not throw; if one does, the cache call still answers.
    }
  };

  /** Marks the loads `matches` selects stale and forgets them, so the next `remember` loads afresh. */
  const ground = (matches: (scoped: string, flight: Flight) => boolean): void => {
    for (const running of [flights, reloads])
      for (const [scoped, flight] of running) {
        if (!matches(scoped, flight)) continue;
        flight.stale = true;
        running.delete(scoped);
      }
  };

  /** Whether `entry` is fresh now. */
  const fresh = (entry: CacheEntry | undefined): entry is CacheEntry =>
    entry !== undefined && entry.expiresAt > clock.now().getTime();

  /**
   * Stores `value` at `at` for `ttl` (shortened by the jitter) plus `stale`, in the sets of its tags and, for a store
   * without `keys`, of every key that covers it; a zero lifetime stores nothing and drops what was there. The sets are
   * written first, so an entry is never stored where a `forget` or `forgetTag` cannot find it.
   */
  const write = async (
    at: Target,
    value: unknown,
    ttl: Duration,
    tags: readonly CacheKey[],
    stale: Duration | undefined,
  ): Promise<void> => {
    const lifetime = millisecondsOf(ttl);
    if (lifetime === 0) return store.delete(at.scoped);
    const freshFor = Math.max(1, Math.round(lifetime * (1 - jitter * random())));
    const staleFor = millisecondsOf(stale);
    const keep = Duration.seconds((freshFor + staleFor) / 1000);
    const sets = [
      ...tags.map((tag) => tagSet(at.space + tag)),
      ...(store.keys === undefined
        ? keyAncestors(at.key).map((ancestor) => coveredSet(at.space + ancestor))
        : []),
    ];
    await Promise.all(sets.map((set) => store.add(set, at.scoped, keep)));
    const expiresAt = clock.now().getTime() + freshFor;
    const entry: CacheEntry =
      staleFor > 0 ? { value, expiresAt, staleUntil: expiresAt + staleFor } : { value, expiresAt };
    await store.write(at.scoped, entry, keep);
  };

  /** Runs `load`, recording its time; a synchronous throw becomes a rejection. */
  const timed = async <T>(at: Target, load: () => T | Promise<T>): Promise<T> => {
    const started = clock.now().getTime();
    try {
      return await load();
    } finally {
      record("load", at.key, clock.now().getTime() - started);
    }
  };

  /** Loads `at` and stores the value unless `flight` went stale meanwhile. */
  const loadAndStore = async <T>(
    at: Target,
    ttl: Duration,
    load: () => T | Promise<T>,
    options: CacheRememberOptions,
    flight: Flight,
  ): Promise<T> => {
    const value = await timed(at, load);
    if (!flight.stale) await write(at, value, ttl, options.tags ?? [], options.stale);
    return value;
  };

  /**
   * Fills a miss: here, or with `lock` on the one instance holding the fill lock while the others read the store until
   * its value lands (then load themselves).
   */
  const fillMiss = async <T>(
    at: Target,
    ttl: Duration,
    load: () => T | Promise<T>,
    options: CacheRememberOptions,
    flight: Flight,
  ): Promise<T> => {
    if (options.lock !== true) return loadAndStore(at, ttl, load, options, flight);
    const filled: { result?: { readonly value: T } } = {};
    const ran = await lock.tryWith(lockKey(at), fill.wait, async () => {
      filled.result = { value: await loadAndStore(at, ttl, load, options, flight) };
    });
    if (ran && filled.result !== undefined) return filled.result.value;
    const poll = Math.max(1, millisecondsOf(fill.poll));
    const tries = Math.max(1, Math.ceil(millisecondsOf(fill.wait) / poll));
    for (let attempt = 0; attempt < tries; attempt += 1) {
      // Each read waits for the poll interval: one read per interval until the other instance's value lands.
      await sleep(poll);
      const entry = await store.read(at.scoped);
      if (fresh(entry)) {
        record("hit", at.key, 1);
        return entry.value as T;
      }
    }
    return loadAndStore(at, ttl, load, options, flight);
  };

  /** Starts one background reload of `at`'s stale entry, unless one runs; with `lock`, on one instance only. */
  const reload = <T>(
    at: Target,
    ttl: Duration,
    load: () => T | Promise<T>,
    options: CacheRememberOptions,
  ): void => {
    if (reloads.has(at.scoped)) return;
    const flight: Flight = {
      promise: Promise.resolve(),
      stale: false,
      tags: new Set((options.tags ?? []).map((tag) => at.space + tag)),
    };
    const work = async (): Promise<void> => {
      await loadAndStore(at, ttl, load, options, flight);
    };
    const running = options.lock === true ? lock.tryWith(lockKey(at), fill.wait, work) : work();
    flight.promise = running
      // A failed reload leaves the stale entry; the first call past its window loads again.
      .catch(() => undefined)
      .finally(() => {
        if (reloads.get(at.scoped) === flight) reloads.delete(at.scoped);
      });
    reloads.set(at.scoped, flight);
  };

  return {
    async get<T>(key: CacheKey): Promise<T | undefined> {
      const entry = await store.read(target(key).scoped);
      if (!fresh(entry)) {
        record("miss", key, 1);
        return undefined;
      }
      record("hit", key, 1);
      return entry.value as T;
    },

    put<T>(key: CacheKey, value: T, ttl: Duration, options: CachePutOptions = {}): Promise<void> {
      const at = target(key);
      ground((scoped) => scoped === at.scoped);
      return write(at, value, ttl, options.tags ?? [], undefined);
    },

    remember<T>(
      key: CacheKey,
      ttl: Duration,
      load: () => T | Promise<T>,
      options: CacheRememberOptions = {},
    ): Promise<T> {
      const at = target(key);
      const running = flights.get(at.scoped);
      if (running !== undefined) return running.promise as Promise<T>;
      const flight: Flight = {
        promise: Promise.resolve(),
        stale: false,
        tags: new Set((options.tags ?? []).map((tag) => at.space + tag)),
      };
      // The read joins the flight too, so concurrent misses share one read and one load.
      const promise = store
        .read(at.scoped)
        .then((entry): T | Promise<T> => {
          if (fresh(entry)) {
            record("hit", key, 1);
            return entry.value as T;
          }
          const servesStale =
            entry !== undefined &&
            millisecondsOf(options.stale) > 0 &&
            (entry.staleUntil ?? 0) > clock.now().getTime();
          if (servesStale) {
            record("stale", key, 1);
            reload(at, ttl, load, options);
            return entry.value as T;
          }
          record("miss", key, 1);
          return fillMiss(at, ttl, load, options, flight);
        })
        .finally(() => {
          if (flights.get(at.scoped) === flight) flights.delete(at.scoped);
        });
      flight.promise = promise;
      flights.set(at.scoped, flight);
      return promise;
    },

    async forget(key: CacheKey): Promise<void> {
      const at = target(key);
      ground((scoped) => coversKey(at.scoped, scoped));
      const names =
        store.keys === undefined
          ? new Set([at.scoped, ...(await store.members(coveredSet(at.scoped)))])
          : new Set((await store.keys(at.scoped)).filter((name) => coversKey(at.scoped, name)));
      await Promise.all([...names].map((name) => store.delete(name)));
      if (store.keys === undefined) await store.clear(coveredSet(at.scoped));
      record("evict", key, names.size);
    },

    async forgetTag(tag: CacheKey): Promise<void> {
      const at = target(tag);
      ground((_scoped, flight) => flight.tags.has(at.scoped));
      const set = tagSet(at.scoped);
      const names = new Set(await store.members(set));
      await Promise.all([...names].map((name) => store.delete(name)));
      await store.clear(set);
      record("evict", tag, names.size);
    },
  };
}
