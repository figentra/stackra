/**
 * Stackra file contract:
 * Purpose: `encoreCronJobs()`, the Encore CronJob driver of the scheduler: the CronJobs a SaaS service runs, one per
 *          registered action whose `job` option has a `cron` (its own schedule, its endpoint firing that action) and
 *          one every minute for the stored per-scope schedules. On-prem runs `SchedulerService.run` instead.
 * Boundary: pure over the process-wide `SCHEDULED_JOBS` that `registerScheduledJobs` filled; gen calls it at build
 *           and emits each row, so the CronJobs and the dispatch never disagree. Encore runs one invocation of a
 *           CronJob at a time across instances, so `fire` takes no lock; the per-scope schedules keep the tick's lock
 *           and watermarks. Two keys that map to one id are refused. The id is gen's `cronJobId`, the one formula
 *           both sides call (ADR 0294 decision 20).
 * Runtime: isomorphic
 * Governing contract: ADR 0148 (decisions 4 and 6); ADR 0266 (decision 4.6); ADR 0294 (decision 22: locked keys).
 */
import type { ActionOptions } from "@stackra/actions";
import { kindOf } from "@stackra/container";
import { cronJobId } from "@stackra/gen";

import { SCHEDULED_JOBS } from "#core/constants/scheduled-jobs.constant";
import type { CronJobDeclaration } from "#core/types/cron-job-declaration.type";

/** The id of the stored schedules' minute tick. */
const SCHEDULES = "scheduler-schedules";

/**
 * The CronJobs of this process.
 *
 * @throws TypeError when two keys map to one CronJob id.
 * @example
 * for (const job of encoreCronJobs()) emit(`new CronJob("${job.name}", { title: "${job.title}", schedule: "${job.schedule}", endpoint })`);
 */
export function encoreCronJobs(): readonly CronJobDeclaration[] {
  const jobs: CronJobDeclaration[] = [];
  const seen = new Map<string, string>([[SCHEDULES, "(stored schedules)"]]);
  for (const [type, key] of SCHEDULED_JOBS.keys) {
    const cron = (kindOf(type)?.options as unknown as Pick<ActionOptions, "job"> | undefined)?.job
      ?.cron;
    if (cron === undefined) continue;
    const name = cronJobId(key);
    const holder = seen.get(name);
    if (holder !== undefined)
      throw new TypeError(
        `encoreCronJobs: ${key} and ${holder} both map to the CronJob id ${name}`,
      );
    seen.set(name, key);
    jobs.push(Object.freeze({ name, title: key, schedule: cron.schedule, key }));
  }
  jobs.push(
    Object.freeze({ name: SCHEDULES, title: "Stored per-scope schedules", schedule: "* * * * *" }),
  );
  return jobs;
}
