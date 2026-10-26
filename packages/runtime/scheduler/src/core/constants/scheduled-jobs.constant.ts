/**
 * Stackra file contract:
 * Purpose: `SCHEDULED_JOBS`, the job actions this process can dispatch, both ways: by locked key for a stored
 *          schedule that names one, and the key of each class for `SchedulerService` when it ticks a cron or stores a
 *          schedule.
 * Boundary: process-wide and internal: written by `registerScheduledJobs` (gen's entry, with the locked keys) and read
 *           by `SchedulerService`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 20 and 22: locked identities); ADR 0305 (rule 28: the job's name is the
 *                     action's key); annotated, not inferred, so the declaration emit
 *                     names `Action` rather than the unexported `ActionBase` (STA-1220).
 */
import type { Action } from "@stackra/actions";
import type { AnyClass } from "@stackra/container";

/** The registered job actions. */
export const SCHEDULED_JOBS: Readonly<{
  byKey: Map<string, AnyClass<Action>>;
  keys: Map<AnyClass<Action>, string>;
}> = Object.freeze({
  /** Key to action class. */
  byKey: new Map<string, AnyClass<Action>>(),

  /** Action class to key, in registration order. */
  keys: new Map<AnyClass<Action>, string>(),
});
