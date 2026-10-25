/**
 * Stackra file contract:
 * Purpose: `ReplicaRef`, what `ReplicaStore` and `useReplica` take: the generated class of a consumed query declared a
 *          replica, read by its static versioned key, its `replica` declaration and the events whose broadcast is its
 *          refresh signal.
 * Boundary: a structural type, so this package never imports `@stackra/clients`: `queryRef(key, { replica })` sets the
 *           statics. A query without `replica` is not one, and is not available offline (ADR 0338 decision 3).
 * Runtime: isomorphic
 * Governing contract: ADR 0338 (decision 3); ADR 0260 (generated client classes); ADR 0315 (live queries).
 */
import type { LiveQueryRef } from "#core/types/live-query-ref.type";
import type { ReplicaOptions } from "#core/types/replica-options.type";

/** A consumed query kept as a bounded replica. */
export interface ReplicaRef extends LiveQueryRef {
  /** The replica declaration. */
  readonly replica: ReplicaOptions;
}
