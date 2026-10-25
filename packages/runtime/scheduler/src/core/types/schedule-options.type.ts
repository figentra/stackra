/**
 * Stackra file contract:
 * Purpose: `ScheduleOptions`, the second argument of `SchedulerService.schedule`: the scope, the cron, its time zone,
 *          the input of every run and the missed-run policy.
 * Boundary: a type only. `scope` is the authenticated scope of the caller that saves the schedule, never request
 *           input; `cron` and `timeZone` may be the caller's input and are checked (`invalid_cron`,
 *           `invalid_time_zone`).
 * Runtime: isomorphic
 * Governing contract: ADR 0148 (decision 5); ADR 0327 and ADR 0323 (`ScopeRef`).
 */
import type { ScopeRef } from "@stackra/contracts";

import type { Misfire } from "#contracts/index";

/** How a schedule is stored; `I` is the action's input. */
export interface ScheduleOptions<I = object> {
  /** The scope every run is pushed with. */
  readonly scope: ScopeRef;

  /** A five-field cron expression, read in `timeZone`. */
  readonly cron: string;

  /** An IANA time zone (`Asia/Dubai`); `UTC` when absent. */
  readonly timeZone?: string;

  /** The input every run gets; `{}` when absent. */
  readonly input?: I;

  /** What a tick does with runs it missed; `SchedulerConfig.misfire` when absent. */
  readonly misfire?: Misfire;
}
