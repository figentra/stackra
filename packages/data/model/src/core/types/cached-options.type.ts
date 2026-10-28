/**
 * Stackra file contract:
 * Purpose: `CachedOptions`, what `Cached({...})` takes: how long a row read by its id stays in the entity cache.
 * Boundary: a type only, read by @stackra/database's `CrudService` through `cacheTtlOf`. The value is the model
 *           author's configuration, never computed.
 * Runtime: isomorphic
 * Governing contract: ADR 0150 (decision 5: a second-level cache, as a model trait after ADR 0305 rule 33); data-layer
 *                     gap ca5.
 */
import type { Duration } from "@stackra/contracts";

/** The entity cache of a model. */
export interface CachedOptions {
  /** How long a row read by its id is served from the cache before it is read again; longer than zero. */
  readonly ttl: Duration;
}
