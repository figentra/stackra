/**
 * Stackra file contract:
 * Purpose: `ReplicaOptions`, a query's `replica:` declaration as a client reads it (ADR 0338 decision 3): what read
 *          model it copies, how old a record may be, how many it keeps, and the scope dimension that limits it to the
 *          device's own slice.
 * Boundary: a type only, copied by gen from the producer's manifest onto the generated query class
 *           (`queryRef(key, { replica })`). Both bounds are required: a replica without `window` and `limit` fails at
 *           boot (`registerReplicas`), as gen refuses it.
 * Runtime: isomorphic
 * Governing contract: ADR 0338 (decision 3); ADR 0343 (decision 4: the legal entity is the transfer boundary).
 */

/**
 * A replica declaration.
 *
 * @example
 * { of: "sales.sale", window: "30d", limit: 5000, scope: "legalEntityId" }
 */
export interface ReplicaOptions {
  /** The read model the replica copies (`sales.sale`). */
  readonly of: string;

  /** How old a record may be, by its `at` time, as a duration (`"30d"`). */
  readonly window: string;

  /** The most records kept; the newest win. */
  readonly limit: number;

  /** The field that limits the replica to the device's slice (`"legalEntityId"`); every record carries it. */
  readonly scope?: string;
}
