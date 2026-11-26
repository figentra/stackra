/**
 * Stackra file contract:
 * Purpose: `replicaIsFresh`, whether a replica at `position` serves a read at `at` that demands `freshness`: it has
 *          replayed through `after` (the caller's last write), and it is no more than `maxLag` behind at `at`.
 * Boundary: pure; times are epoch milliseconds of this process's clock. A demand with neither field is always met.
 * Runtime: isomorphic
 * Governing contract: ADR 0057 (decision 6: read replica); data-layer gap scale-performance 11 (stackra-307,
 *                     STA-1464: the lag guard).
 */
import { Duration } from "@stackra/contracts";

import type { ReplicaFreshness } from "#core/types/replica-freshness.type";
import type { ReplicaPosition } from "#core/types/replica-position.type";

/**
 * Whether the replica is fresh enough.
 *
 * @param position - the replica's replay point.
 * @param at - when the read happens, in epoch milliseconds.
 * @param freshness - what the read demands.
 * @example
 * replicaIsFresh({ measuredAt: 10_000, replayedThrough: 8_800 }, 10_500, { maxLag: Duration.seconds(2) }); // true
 */
export function replicaIsFresh(
  position: ReplicaPosition,
  at: number,
  freshness: ReplicaFreshness,
): boolean {
  if (freshness.after !== undefined && position.replayedThrough < freshness.after.getTime())
    return false;
  return (
    freshness.maxLag === undefined ||
    at - position.replayedThrough <= Duration.toMilliseconds(freshness.maxLag)
  );
}
