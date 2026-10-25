/**
 * Stackra file contract:
 * Purpose: `CronJobDeclaration`, one Encore CronJob gen emits for a SaaS service: its id, title and five-field UTC
 *          schedule, and what its endpoint does: `fire` the cron action of `key`, or, without a key, tick the stored
 *          per-scope schedules.
 * Boundary: a type only, plain data: gen writes `new CronJob(name, { title, schedule, endpoint })` from it, and the
 *           endpoint calls `SchedulerService.fire(key)` or `tick(undefined, { crons: false })`. This package never
 *           imports `encore.dev`.
 * Runtime: isomorphic
 * Governing contract: ADR 0148 (decisions 4 and 6); ADR 0266 (decision 4.6: the Encore CronJob in SaaS); ADR 0078
 *                     (decision 8).
 */

/** One Encore CronJob. */
export interface CronJobDeclaration {
  /** The CronJob id: lowercase letters, digits and hyphens (`orders-order-expire-unpaid-1`). */
  readonly name: string;

  /** What the Encore dashboard shows. */
  readonly title: string;

  /** Five cron fields, in UTC. */
  readonly schedule: string;

  /** The locked key of the cron action the endpoint fires; absent for the stored schedules' minute tick. */
  readonly key?: string;
}
