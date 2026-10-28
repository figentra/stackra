/**
 * Stackra file contract:
 * Purpose: `CacheOperations`, the five calls of the `Cache` port as `storedCache` returns them, for a driver to
 *          delegate to.
 * Boundary: a type only, internal to the package.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rule 32); ADR 0150 (decisions 2 and 4).
 */
import type { Cache } from "#contracts/ports/cache.port";

/** `get`, `put`, `remember`, `forget` and `forgetTag` of a cache. */
export type CacheOperations = Pick<Cache, "get" | "put" | "remember" | "forget" | "forgetTag">;
