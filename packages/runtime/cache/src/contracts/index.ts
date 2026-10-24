/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/cache, the leaf entry of its ports, until
 *          `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The leaf: it imports no other entry of this package. `Cache` is
 *           exported here only, never from `.` (ADR 0294 decision 15; registry conflict A3).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { Cache } from "#contracts/ports/cache.port";
export { CacheNamespace } from "#contracts/ports/cache-namespace.port";
