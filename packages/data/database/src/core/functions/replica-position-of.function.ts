/**
 * Stackra file contract:
 * Purpose: `replicaPositionOf`, a `ReplicaPosition` from the `REPLICA_POSITION_SQL` row read at `measuredAt`: a server
 *          that is not a standby has replayed everything, a standby that has replayed all it received is caught up as
 *          of `measuredAt`, and any other standby has replayed through `measuredAt` less its lag; a standby with no
 *          readable lag (no transaction replayed yet, or no row) has replayed nothing usable.
 * Boundary: pure. `measuredAt` is taken before the statement runs, so the position errs early (a replica is never
 *           judged fresher than it was).
 * Runtime: isomorphic
 * Governing contract: ADR 0057 (decision 6: read replica); data-layer gap scale-performance 11 (stackra-307, STA-1464).
 */
import type { ReplicaPosition } from "#core/types/replica-position.type";

/**
 * The position the probe row tells.
 *
 * @param row - the row of `REPLICA_POSITION_SQL`, or none.
 * @param measuredAt - when the probe started, in epoch milliseconds.
 * @example
 * replicaPositionOf({ standby: true, caught_up: false, lag_ms: 1200 }, 10_000); // { measuredAt: 10000, replayedThrough: 8800 }
 */
export function replicaPositionOf(
  row: Readonly<Record<string, unknown>> | undefined,
  measuredAt: number,
): ReplicaPosition {
  if (row?.["standby"] === false) return { measuredAt, replayedThrough: Number.POSITIVE_INFINITY };
  if (row?.["caught_up"] === true) return { measuredAt, replayedThrough: measuredAt };
  const lag = row?.["lag_ms"];
  const millis = typeof lag === "number" || typeof lag === "string" ? Number(lag) : Number.NaN;
  if (!Number.isFinite(millis)) return { measuredAt, replayedThrough: Number.NEGATIVE_INFINITY };
  return { measuredAt, replayedThrough: measuredAt - Math.max(0, millis) };
}
