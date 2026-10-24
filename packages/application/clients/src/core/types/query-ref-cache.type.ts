/**
 * Stackra file contract:
 * Purpose: `QueryRefCache`, a query ref's `cache` option: the producer's cache time and the events that invalidate the
 *          query's results.
 * Boundary: a type only; `ttl` is the producer's duration text (`5m`), kept for display and never parsed here.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (query `cache`); owner decision R-25 (a query with `invalidateOn` is live).
 */
import type { EventRef } from "#core/types/event-ref.type";

/** The cache declaration of a query. */
export interface QueryRefCache {
  /** How long the producer caches a result (`5m`). */
  readonly ttl?: string;

  /** The events after which every cached result of the query is stale. */
  readonly invalidateOn?: readonly EventRef[];
}
