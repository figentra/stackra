/**
 * Stackra file contract:
 * Purpose: `QueryCache`, a query's `cache` option: how long its result may be served from cache and which integration
 *          events make it stale.
 * Boundary: a type only. Clients and the live-query invalidation channel read it from the manifest (a query with
 *           `invalidateOn` is live, owner decision R-25). The key is per principal; the tenant and site scopes of ADR
 *           0305 rule 31 wait for the owner's call on tenant vocabulary (R-59), so they are not here.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 31 to 33); ADR 0297 as amended.
 */
import type { AnyClass } from "@stackra/container";
import type { Event } from "@stackra/events";

/** A query's cache profile. */
export interface QueryCache {
  /** How long a result is served, as a duration (`"5m"`). */
  readonly ttl: string;

  /** The events after which a cached result is stale. */
  readonly invalidateOn?: readonly AnyClass<Event>[];
}
