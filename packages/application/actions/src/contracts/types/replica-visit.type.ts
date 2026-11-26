/**
 * Stackra file contract:
 * Purpose: `ReplicaVisit`, a query the pipeline sends to a replica: the `ReplicaQuery`, the writer whose read-your-writes
 *          window it reads (`<scope>:<actor>`), the call's time and the last write the transport carried, so the driver
 *          can demand a replica that has replayed that writer's last write as well as one within the query's lag.
 * Boundary: a type only; handed to `ReplicaReads.onReplica` once the window is closed.
 * Runtime: isomorphic
 * Governing contract: ADR 0057 (decision 6: read replica); data-layer gap scale-performance 11 (stackra-307, STA-1464).
 */
import type { ReplicaQuery } from "#contracts/types/replica-query.type";

/** A query read on a replica. */
export interface ReplicaVisit extends ReplicaQuery {
  /** Whose read-your-writes window the call reads (`<scope>:<actor>`). */
  readonly writer: string;

  /** When the call started. */
  readonly at: Date;

  /** The caller's last write as the transport carried it (`CallOptions.lastWriteAt`), when it did. */
  readonly lastWriteAt?: Date;
}
