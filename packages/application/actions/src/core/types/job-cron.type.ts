/**
 * Stackra file contract:
 * Purpose: `JobCron`, the `job.cron` sub-option of an action: the schedule `@stackra/scheduler` dispatches it on,
 *          once per scope or once for the platform, with a fixed input.
 * Boundary: a type only; the scheduler reads it from the manifest. Gen checks `input` against the action's input
 *           schema (`cron_input_invalid`). Which scopes a per-scope run covers is the scheduler's `CronScopes` driver
 *           (tenancy lists its tenant nodes), so the option names no scope level (ADR 0323).
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 28 and 30); owner decision 2026-10-24 (job, queue and cron are typed
 *                     sub-options of `Action({...})`); ADR 0323 and ADR 0327 (scopes, not tenants).
 */

/** A cron schedule of a job action. */
export interface JobCron {
  /** A five-field cron expression in UTC (`"*\/5 * * * *"`). */
  readonly schedule: string;

  /** One run per scope the scheduler lists at each tick, each in its scope, instead of one for the platform. */
  readonly perScope?: boolean;

  /** The input every scheduled run gets. */
  readonly input?: object;
}
