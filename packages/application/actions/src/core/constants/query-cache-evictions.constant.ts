/**
 * Stackra file contract:
 * Purpose: `QUERY_CACHE_EVICTIONS`, which cached queries each event class makes stale, from their
 *          `cache.invalidateOn`.
 * Boundary: a module-level registry written only by `registerCachedQueries` (gen calls it from
 *           `#stackra/registrations`) and read by `QueryCacheEvictorListener`.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rule 31); ADR 0150 (decision 3: event-driven invalidation).
 */
import type { AnyClass } from "@stackra/container";

/** Event class to the queries it makes stale. */
export const QUERY_CACHE_EVICTIONS = new Map<AnyClass, AnyClass[]>();
