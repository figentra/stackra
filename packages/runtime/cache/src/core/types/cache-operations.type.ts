/**
 * Stackra file contract:
 * Purpose: `CacheOperations`, the calls of the `Cache` port as `storedCache` returns them, for a driver to
 *          delegate to (`add` only over a store with an atomic `create`).
 * Boundary: a type only, internal to the package.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rule 32); ADR 0150 (decisions 2 and 4).
 */
import type { Cache } from "#contracts/ports/cache.port";

/** `get`, `put`, `remember`, `forget`, `forgetTag` and `flush` of a cache, and `add` when its store has one. */
export type CacheOperations = Pick<
  Cache,
  "get" | "put" | "remember" | "forget" | "forgetTag" | "flush"
> &
  Partial<Pick<Cache, "add">>;
