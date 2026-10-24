/**
 * Stackra file contract:
 * Purpose: the `Cache` port: a cached value inside a service, driver or listener, under an explicit key and lifetime.
 * Boundary: an abstract class that is its own token; drivers implement it with `extends Driver(Cache)`. Every driver
 *           prefixes each key with `CacheNamespace.current()`, so two namespaces never share an entry, and runs at
 *           most one `remember` load per key at a time (single-flight). Values are whatever the caller stores; a
 *           network driver serialises them, so store plain data. There is no `@Cached` facet and no `ctx.cache`.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 32 and 33); ADR 0150 (decisions 2 and 4); ADR 0294 (decisions 15, 16 and 17).
 */
import type { Duration } from "@stackra/contracts";
import { Port } from "@stackra/contracts";

import type { CacheKey } from "#contracts/types/cache-key.type";

/**
 * Holds values for a while.
 *
 * @example
 * constructor(cache: Cache) { ... }
 *
 * view(id: PublicId<"prd">, locale: Locale): Promise<ProductView> {
 *   return this.cache.remember(CacheKey.of(Product, id, locale), Duration.minutes(10), () => this.load(id, locale));
 * }
 *
 * ctx.afterCommit(() => this.cache.forget(CacheKey.of(Product, product.id))); // every locale's view
 */
export abstract class Cache extends Port {
  /** The value stored under `key`, or `undefined` when none is stored or it has expired. */
  abstract get<T>(key: CacheKey): Promise<T | undefined>;

  /** Stores `value` under `key` for `ttl`; a zero `ttl` stores nothing. A load in flight for `key` is not stored. */
  abstract put<T>(key: CacheKey, value: T, ttl: Duration): Promise<void>;

  /**
   * The value stored under `key`, or the result of `load`, stored for `ttl`. Concurrent calls for one key share one
   * `load`. A rejected `load` stores nothing and rejects every caller that shared it.
   */
  abstract remember<T>(key: CacheKey, ttl: Duration, load: () => T | Promise<T>): Promise<T>;

  /**
   * Drops `key` and every key it covers: `CacheKey.of(Product, id)` covers `CacheKey.of(Product, id, locale)`. A load in
   * flight for a covered key still answers its callers but is not stored.
   */
  abstract forget(key: CacheKey): Promise<void>;
}
