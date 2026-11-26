/**
 * Stackra file contract:
 * Purpose: `ReplicaPosition`, one reading of how far a replica has replayed the primary: when the reading started and
 *          the newest commit the replica had replayed then, both in this process's epoch milliseconds.
 * Boundary: a type only; `replicaPositionOf` builds it from the probe row and `replicaIsFresh` judges it. A server that
 *           is not a standby (the primary itself behind a replica url) has replayed everything (`Infinity`); a standby
 *           whose replay point is unknown has replayed nothing usable (`-Infinity`).
 * Runtime: isomorphic
 * Governing contract: ADR 0057 (decision 6: read replica); data-layer gap scale-performance 11 (stackra-307,
 *                     STA-1464: the lag guard).
 */

/** A replica's replay point at one moment. */
export interface ReplicaPosition {
  /** When the reading started, in epoch milliseconds. */
  readonly measuredAt: number;

  /** The newest commit the replica had replayed at `measuredAt`, in epoch milliseconds (or `±Infinity`). */
  readonly replayedThrough: number;
}
