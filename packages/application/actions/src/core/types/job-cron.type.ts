/**
 * Stackra file contract:
 * Purpose: `JobCron`, the `job.cron` sub-option of an action: the schedule `@stackra/scheduler` dispatches it on,
 *          once per tenant or once for the platform, with a fixed input.
 * Boundary: a type only; the scheduler reads it from the manifest. Gen checks `input` against the action's input
 *           schema (`cron_input_invalid`).
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 28 and 30); owner decision 2026-10-24 (job, queue and cron are typed
 *                     sub-options of `Action({...})`).
 */

/** A cron schedule of a job action. */
export interface JobCron {
  /** A five-field cron expression in UTC (`"*\/5 * * * *"`). */
  readonly schedule: string;

  /** One run per tenant at each tick instead of one for the platform. */
  readonly perTenant?: boolean;

  /** The input every scheduled run gets. */
  readonly input?: object;
}
