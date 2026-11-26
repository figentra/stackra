/**
 * Stackra file contract:
 * Purpose: `ReplicaFreshness`, how fresh a replica must be for `Database.onReplica` to read there: at most `maxLag`
 *          behind the primary, and replayed through `after` (the caller's last write). A replica that is not fresh
 *          enough is skipped and the work runs on the primary instead (the lag guard).
 * Boundary: a type only. With neither field `onReplica` reads the replica without measuring it.
 * Runtime: isomorphic
 * Governing contract: ADR 0057 (decision 6: read replica); data-layer gap scale-performance 11 (stackra-307,
 *                     STA-1464: the lag guard).
 */
import type { Duration } from "@stackra/contracts";

/** What a replica read demands of the replica. */
export interface ReplicaFreshness {
  /** The most the replica may lag the primary; the work runs on the primary when it lags more. */
  readonly maxLag?: Duration;

  /** A commit the replica must have replayed (the caller's last write); the work runs on the primary until it has. */
  readonly after?: Date;
}
