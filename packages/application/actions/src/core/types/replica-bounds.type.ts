/**
 * Stackra file contract:
 * Purpose: `ReplicaBounds`, what `ctx.replica` hands a replica query's full fill: the oldest instant and the most rows
 *          the replica holds, from its `window` and `limit`.
 * Boundary: a type only. The fill reads rows newer than `since`, newest first, at most `limit`; the pipeline cuts
 *           anything past `limit`.
 * Runtime: isomorphic
 * Governing contract: ADR 0338 (decision 3: bounded by age and size).
 */

/** The bounds of a full fill. */
export interface ReplicaBounds {
  /** Rows older than this are outside the window. */
  readonly since: Date;

  /** The most rows to return. */
  readonly limit: number;
}
