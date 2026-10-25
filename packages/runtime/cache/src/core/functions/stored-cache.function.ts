/**
 * Stackra file contract:
 * Purpose: `storedCache`, the `Cache` behaviour every driver over an outside store shares (the storage `cache` area,
 *          Valkey, Workers KV): keys behind the URI-encoded namespace and `/`, each value kept in a JSON envelope with
 *          the instant it expires on the `Clock`, one `remember` load per key at a time in this process, and `forget`
 *          of a key and every key it covers.
 * Boundary: internal to the package; a driver hands it a `CacheStore` and delegates the four port methods. The
 *           envelope's instant decides what is served, as in the memory driver; the store's own expiry only reclaims
 *           space. Stored text that is not an envelope reads as absent. Single-flight is per process, not across
 *           instances. A store failure rejects the call: nothing falls back to the load or swallows the error.
 * Runtime: isomorphic
 * Governing contract: ADR 0150 (decisions 1, 2 and 4); ADR 0305 (rule 32).
 */
import type { Clock } from "@stackra/contracts";
import { Duration } from "@stackra/contracts";

import type { CacheNamespace } from "#contracts/ports/cache-namespace.port";
import type { CacheKey } from "#contracts/types/cache-key.type";
import { coversKey } from "#core/functions/covers-key.function";
import type { CacheOperations } from "#core/types/cache-operations.type";
import type { CacheStore } from "#core/types/cache-store.type";

/** What a store holds as text: the value and the instant, in epoch milliseconds, from which it is no longer served. */
type Envelope = { readonly value: unknown; readonly expiresAt: number };

/** One `remember` load in progress; `stale` once a `put` or `forget` covered its key, so its result is not stored. */
type Flight = { promise: Promise<unknown>; stale: boolean };

/** The envelope in `text`, or `undefined` when the text is not one (stored text is untrusted). */
function envelopeOf(text: string): Envelope | undefined {
  try {
    const entry = JSON.parse(text) as Partial<Envelope> | null;
    return typeof entry === "object" && entry !== null && typeof entry.expiresAt === "number"
      ? (entry as Envelope)
      : undefined;
  } catch {
    return undefined;
  }
}

/**
 * The `Cache` calls over `store`, scoped by `namespace` and expiring on `clock`.
 *
 * @example
 * this.cache = storedCache(store, namespace, clock);
 * get<T>(key: CacheKey): Promise<T | undefined> {
 *   return this.cache.get<T>(key);
 * }
 */
export function storedCache(
  store: CacheStore,
  namespace: CacheNamespace,
  clock: Clock,
): CacheOperations {
  /** Scoped key to the load in progress for it. */
  const flights = new Map<string, Flight>();

  /** `key` behind the current namespace; encoding the namespace keeps `/` its only separator. */
  const scoped = (key: CacheKey): string => `${encodeURIComponent(namespace.current())}/${key}`;

  /** Marks the flights `matches` selects stale and forgets them, so the next `remember` loads afresh. */
  const ground = (matches: (flightKey: string) => boolean): void => {
    for (const [flightKey, flight] of flights) {
      if (!matches(flightKey)) continue;
      flight.stale = true;
      flights.delete(flightKey);
    }
  };

  /** The live envelope under `key`. */
  const read = async (key: string): Promise<Envelope | undefined> => {
    const text = await store.read(key);
    const entry = text === undefined ? undefined : envelopeOf(text);
    return entry !== undefined && entry.expiresAt > clock.now().getTime() ? entry : undefined;
  };

  /** Stores `value` under `key` for `ttl`; a zero lifetime stores nothing and drops what was there. */
  const write = (key: string, value: unknown, ttl: Duration): Promise<void> => {
    const lifetime = Duration.toMilliseconds(ttl);
    // A zero lifetime, or a forged duration that reads as NaN, stores nothing.
    if (!(lifetime > 0)) return store.delete(key);
    const expiresAt = clock.now().getTime() + lifetime;
    return store.write(key, JSON.stringify({ value, expiresAt }), ttl);
  };

  return {
    async get<T>(key: CacheKey): Promise<T | undefined> {
      return (await read(scoped(key)))?.value as T | undefined;
    },

    put<T>(key: CacheKey, value: T, ttl: Duration): Promise<void> {
      const target = scoped(key);
      ground((flightKey) => flightKey === target);
      return write(target, value, ttl);
    },

    remember<T>(key: CacheKey, ttl: Duration, load: () => T | Promise<T>): Promise<T> {
      const target = scoped(key);
      const running = flights.get(target);
      if (running !== undefined) return running.promise as Promise<T>;
      const flight: Flight = { promise: Promise.resolve(), stale: false };
      // The read joins the flight too, so concurrent misses share one read and one load.
      const promise = read(target)
        .then(async (entry) => {
          if (entry !== undefined) return entry.value as T;
          const value = await load();
          if (!flight.stale) await write(target, value, ttl);
          return value;
        })
        .finally(() => {
          if (flights.get(target) === flight) flights.delete(target);
        });
      flight.promise = promise;
      flights.set(target, flight);
      return promise;
    },

    async forget(key: CacheKey): Promise<void> {
      const target = scoped(key);
      ground((flightKey) => coversKey(target, flightKey));
      const stored = await store.keys(target);
      await Promise.all(
        stored.filter((name) => coversKey(target, name)).map((name) => store.delete(name)),
      );
    },
  };
}
