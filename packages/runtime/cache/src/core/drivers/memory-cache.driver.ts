/**
 * Stackra file contract:
 * Purpose: the memory driver of the `Cache` port: entries in process memory, least recently read dropped first past
 *          `CacheConfig.maxEntries`, expiry read from the `Clock`, and one `remember` load per key at a time.
 * Boundary: one process only; a value is kept by reference, so a caller treats what it reads as immutable. Each key is
 *           prefixed with the URI-encoded `CacheNamespace.current()` and `/`, so namespaces never share or forget each
 *           other's entries. Expired entries are dropped when read or pushed out by the bound, never by a timer.
 * Runtime: isomorphic
 * Governing contract: ADR 0150 (decisions 1, 2 and 4: memory LRU, namespaced keys, single-flight); ADR 0305 (rule 32).
 */
import { Driver } from "@stackra/container";
import { Clock, Duration } from "@stackra/contracts";

import { CacheConfig } from "#config/cache.config";
import { Cache } from "#contracts/ports/cache.port";
import { CacheNamespace } from "#contracts/ports/cache-namespace.port";
import type { CacheKey } from "#contracts/types/cache-key.type";
import { coversKey } from "#core/functions/covers-key.function";

/** One stored value and the instant, in epoch milliseconds, from which it is no longer served. */
type Entry = { readonly value: unknown; readonly expiresAt: number };

/** One `remember` load in progress; `stale` once a `put` or `forget` covered its key, so its result is not stored. */
type Flight = { promise: Promise<unknown>; stale: boolean };

/** Keeps values in process memory. */
export class MemoryCacheDriver extends Driver(Cache) {
  /** Scoped key to entry, oldest read first (a `Map` keeps insertion order). */
  private readonly entries = new Map<string, Entry>();

  /** Scoped key to the load in progress for it. */
  private readonly flights = new Map<string, Flight>();

  private readonly config: CacheConfig;

  private readonly namespace: CacheNamespace;

  private readonly clock: Clock;

  /**
   * @param config - the entry bound.
   * @param namespace - the prefix of every key; the shared namespace unless the tenancy package binds its driver.
   * @param clock - the time source of expiry.
   */
  constructor(config: CacheConfig, namespace: CacheNamespace, clock: Clock) {
    super();
    this.config = config;
    this.namespace = namespace;
    this.clock = clock;
  }

  /** The value stored under `key`, or `undefined` when none is stored or it has expired. */
  get<T>(key: CacheKey): Promise<T | undefined> {
    return Promise.resolve(this.read(this.scoped(key))?.value as T | undefined);
  }

  /** Stores `value` under `key` for `ttl`; a zero `ttl` stores nothing. A load in flight for `key` is not stored. */
  put<T>(key: CacheKey, value: T, ttl: Duration): Promise<void> {
    const scoped = this.scoped(key);
    this.ground((flightKey) => flightKey === scoped);
    this.write(scoped, value, ttl);
    return Promise.resolve();
  }

  /** The stored value, or the result of `load` stored for `ttl`; concurrent calls for one key share one `load`. */
  remember<T>(key: CacheKey, ttl: Duration, load: () => T | Promise<T>): Promise<T> {
    const scoped = this.scoped(key);
    const entry = this.read(scoped);
    if (entry !== undefined) return Promise.resolve(entry.value as T);
    const running = this.flights.get(scoped);
    if (running !== undefined) return running.promise as Promise<T>;
    const flight: Flight = { promise: Promise.resolve(), stale: false };
    // `then(load)` runs the load after the flight is registered, and turns a synchronous throw into a rejection.
    const promise = Promise.resolve()
      .then(load)
      .then((value) => {
        if (!flight.stale) this.write(scoped, value, ttl);
        return value;
      })
      .finally(() => {
        if (this.flights.get(scoped) === flight) this.flights.delete(scoped);
      });
    flight.promise = promise;
    this.flights.set(scoped, flight);
    return promise;
  }

  /** Drops `key` and every key it covers; a covered load in flight answers its callers but is not stored. */
  forget(key: CacheKey): Promise<void> {
    const scoped = this.scoped(key);
    for (const stored of this.entries.keys()) {
      if (coversKey(scoped, stored)) this.entries.delete(stored);
    }
    this.ground((flightKey) => coversKey(scoped, flightKey));
    return Promise.resolve();
  }

  /** `key` behind the current namespace; encoding the namespace keeps `/` its only separator. */
  private scoped(key: CacheKey): string {
    return `${encodeURIComponent(this.namespace.current())}/${key}`;
  }

  /** The live entry under `scoped`, moved to the newest end; an expired one is dropped. */
  private read(scoped: string): Entry | undefined {
    const entry = this.entries.get(scoped);
    if (entry === undefined) return undefined;
    this.entries.delete(scoped);
    if (entry.expiresAt <= this.clock.now().getTime()) return undefined;
    this.entries.set(scoped, entry);
    return entry;
  }

  /** Stores `value` as the newest entry, then drops the oldest entries past the bound. */
  private write(scoped: string, value: unknown, ttl: Duration): void {
    const lifetime = Duration.toMilliseconds(ttl);
    this.entries.delete(scoped);
    // A zero lifetime, or a forged duration that reads as NaN, stores nothing.
    if (!(lifetime > 0)) return;
    this.entries.set(scoped, { value, expiresAt: this.clock.now().getTime() + lifetime });
    for (const oldest of this.entries.keys()) {
      if (this.entries.size <= this.config.maxEntries) break;
      this.entries.delete(oldest);
    }
  }

  /** Marks the flights `matches` selects stale and forgets them, so the next `remember` loads afresh. */
  private ground(matches: (flightKey: string) => boolean): void {
    for (const [flightKey, flight] of this.flights) {
      if (!matches(flightKey)) continue;
      flight.stale = true;
      this.flights.delete(flightKey);
    }
  }
}
