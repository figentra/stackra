/**
 * Stackra file contract:
 * Purpose: `ReplicaSnapshot`, what a screen reads from a replica (`useReplica(RecentSalesQuery)`): the records, newest
 *          first, and the "as of" time of the last refresh, which every screen that reads it shows (ADR 0338
 *          decision 3).
 * Boundary: a type only; frozen, and the same object until the replica changes. `asOf` is `null` until the first fill.
 *           Exported from `./react`, where the reading screens name it.
 * Runtime: isomorphic
 * Governing contract: ADR 0338 (decision 3); ADR 0294 (decision 8).
 */
import type { Json } from "@stackra/contracts";

/**
 * A replica as a screen reads it.
 *
 * @example
 * const { data, asOf } = useReplica(RecentSalesQuery);
 */
export interface ReplicaSnapshot {
  /** The records, newest first. */
  readonly data: readonly Json[];

  /** When the server's answer was true, or `null` before the first fill. */
  readonly asOf: Date | null;
}
