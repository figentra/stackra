/**
 * Stackra file contract:
 * Purpose: `TickOptions`, what one `SchedulerService.tick` evaluates: every cron of an action and every stored
 *          schedule (the default, the on-prem timer), or the stored schedules only (SaaS, where each cron of an action
 *          has its own Encore CronJob that calls `fire`).
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0148 (decisions 4 and 6: Encore CronJob in SaaS, a timer on-prem).
 */

/** The parts of a tick. */
export interface TickOptions {
  /** Whether the tick evaluates the crons of actions; `true` when absent. */
  readonly crons?: boolean;
}
