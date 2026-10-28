/**
 * Stackra file contract:
 * Purpose: `SHARED_CACHE_CONTEXT`, the call context the query cache reads and forgets its entries under: no call at
 *          all, so every `CacheNamespace` driver answers the shared namespace.
 * Boundary: a frozen empty object for `ContextStorage.run`. The pipeline's cache step and `QueryCacheEvictorListener`
 *           both use it, so an entry written while a call acts in one scope node is forgotten by an event that names
 *           only the tenant. Isolation comes from the key, which carries the tenant, the scope node or the caller
 *           (`queryCacheKey`); `handle` itself still runs in the call's own context.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rule 31); ADR 0150 (decision 2).
 */

/** The context of no call. */
export const SHARED_CACHE_CONTEXT: object = Object.freeze({});
