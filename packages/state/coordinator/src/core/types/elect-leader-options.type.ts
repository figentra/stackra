/**
 * Stackra file contract:
 * Purpose: `ElectLeaderOptions`, the optional second argument of `electLeader` and third of `withTabLock`: force a
 *          method, or change the heartbeat of the BroadcastChannel fallback.
 * Boundary: a type only. Both fields are optional; the defaults are the best available method and one second.
 * Runtime: isomorphic
 * Governing contract: ADR 0084 (the coordinator row); ADR 0294 (decision 26: `Duration`).
 */
import type { Duration } from "@stackra/contracts";

import type { ElectionMethod } from "#core/enums/election-method.enum";

/** How to run one leader election. */
export interface ElectLeaderOptions {
  /** The method to use; by default Web Locks, else a BroadcastChannel, else memory, whichever exists first. */
  readonly method?: ElectionMethod;

  /**
   * How often a BroadcastChannel leader announces itself; the others take over after three missed beats. Ignored by
   * the other methods. Default `Duration.seconds(1)`.
   */
  readonly heartbeat?: Duration;
}
