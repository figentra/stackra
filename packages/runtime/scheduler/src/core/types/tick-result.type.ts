/**
 * Stackra file contract:
 * Purpose: `TickResult`, what one `SchedulerService.tick` did: whether this runner held the tick, how many jobs it
 *          stored, and the stored schedules it could not evaluate.
 * Boundary: a type only. A skipped schedule names an action this process does not know (removed or renamed) or holds a
 *           cron or time zone the runtime refuses; its watermark stays, so it catches up within the window once fixed.
 * Runtime: isomorphic
 * Governing contract: ADR 0148 (decisions 4 and 5).
 */
import type { PublicId } from "@stackra/contracts";

/** The outcome of one tick. */
export interface TickResult {
  /** `false` when another runner held the tick, so this one did nothing. */
  readonly ran: boolean;

  /** Jobs stored; a push skipped because a unique job of the same scope waits or runs is not counted. */
  readonly pushed: number;

  /** Stored schedules this tick could not evaluate. */
  readonly skipped: readonly PublicId<"sch">[];
}
