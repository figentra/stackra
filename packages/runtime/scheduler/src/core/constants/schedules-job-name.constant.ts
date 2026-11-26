/**
 * Stackra file contract:
 * Purpose: `SCHEDULES_JOB_NAME`, the name of the stored per-scope schedules' minute tick: its Encore CronJob id
 *          (`encoreCronJobs`) and the heartbeat job name it beats after each tick (ADR 0184 decision 4), as
 *          `@stackra/infra-observability` plans it.
 * Boundary: a constant, internal to this package; a cron of an action is named by gen's `cronJobId` instead.
 * Runtime: isomorphic
 * Governing contract: ADR 0148 (decisions 4 and 6); ADR 0184 (decision 4); ADR 0294 (decision 20: one formula per
 *                     identity).
 */

/** The stored schedules' tick: CronJob id and heartbeat name. */
export const SCHEDULES_JOB_NAME = "scheduler-schedules";
