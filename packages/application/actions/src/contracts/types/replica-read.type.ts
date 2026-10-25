/**
 * Stackra file contract:
 * Purpose: `ReplicaRead`, what `ReplicaLog.read` answers for a position it still holds: the visible changes after it, the
 *          position to resume from and whether more remain.
 * Boundary: a type only. `position` covers every entry the read passed, including those outside the caller's scope, so
 *           the next read never revisits them.
 * Runtime: isomorphic
 * Governing contract: ADR 0338 (decision 3).
 */
import type { ReplicaChange } from "#contracts/types/replica-change.type";

/** One page of a replica's changes. */
export interface ReplicaRead {
  /** The visible changes, oldest first. */
  readonly changes: readonly ReplicaChange[];

  /** The position of the last entry read, the next read's start. */
  readonly position: number;

  /** Whether the log holds entries after `position`. */
  readonly more: boolean;
}
