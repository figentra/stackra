/**
 * Stackra file contract:
 * Purpose: `SHARED_CACHE_CONTEXT`, the call context the entity cache reads, writes and forgets its entries under: no
 *          call at all, so every `CacheNamespace` driver answers the shared namespace.
 * Boundary: a frozen empty object for `ContextStorage.run`. `EntityResultCacheAdapter` and `CacheInvalidationService`
 *           both use it, so an entry written while a call acts in one scope node is forgotten by the change relay,
 *           which runs in no call. Isolation comes from the key, which carries the tenant and the scope node
 *           (`entityCacheOf`), the same rule as @stackra/actions' query cache.
 * Runtime: isomorphic
 * Governing contract: ADR 0150 (decision 2: keys are scoped); ADR 0305 (rule 31, 2026-10-28 amendment: the shared
 *                     namespace); data-layer gap ca5.
 */

/** The context of no call. */
export const SHARED_CACHE_CONTEXT: object = Object.freeze({});
