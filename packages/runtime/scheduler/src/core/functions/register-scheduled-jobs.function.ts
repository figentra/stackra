/**
 * Stackra file contract:
 * Purpose: `registerScheduledJobs`, how gen's generated entry tells the scheduler which job actions it dispatches and
 *          under which locked key: each action whose `job` option has a `cron`, which every tick evaluates, and each
 *          job action a stored schedule may name.
 * Boundary: writes the process-wide `SCHEDULED_JOBS`; a later row for a class replaces its earlier key. Takes the same
 *           rows as `registerJobs` of @stackra/queue (only `type` and `key` are read) and checks each, so a wrong row
 *           or a cron that does not parse fails at boot rather than on a tick.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 10, 20 and 22); ADR 0305 (rules 28 and 30); the queue precedent
 *                     (`registerJobs`).
 */
import type { Action, ActionOptions, ActionRegistration } from "@stackra/actions";
import { kindOf } from "@stackra/container";
import type { AnyClass } from "@stackra/container";

import { SCHEDULED_JOBS } from "#core/constants/scheduled-jobs.constant";
import { parseCron } from "#core/functions/parse-cron.function";

/**
 * Registers the job actions the scheduler dispatches, with their locked keys.
 *
 * @throws TypeError when a row's class is not an action, declares no `job` option, its key is empty, or another class
 *         has its key.
 * @throws InvalidCronError when an action's `job.cron.schedule` does not parse.
 * @example
 * registerScheduledJobs([{ type: ExpireUnpaidOrdersAction, key: "orders.order.expire_unpaid@1" }]);
 */
export function registerScheduledJobs(
  rows: readonly Pick<ActionRegistration, "type" | "key">[],
): void {
  for (const row of rows) {
    const record = kindOf(row.type);
    if (record?.kind !== "action")
      throw new TypeError(`registerScheduledJobs: ${row.type.name} is not an action`);
    const { job } = record.options as unknown as Pick<ActionOptions, "job">;
    if (job === undefined)
      throw new TypeError(
        `registerScheduledJobs: ${row.type.name} declares no job option, so nothing runs it on a schedule`,
      );
    if (typeof row.key !== "string" || row.key === "")
      throw new TypeError(`registerScheduledJobs: ${row.type.name} needs its locked key`);
    if (job.cron !== undefined) parseCron(job.cron.schedule);
    const type = row.type as AnyClass<Action>;
    const holder = SCHEDULED_JOBS.byKey.get(row.key);
    if (holder !== undefined && holder !== type)
      throw new TypeError(
        `registerScheduledJobs: ${type.name} and ${holder.name} share the key ${row.key}`,
      );
    const previous = SCHEDULED_JOBS.keys.get(type);
    if (previous !== undefined) SCHEDULED_JOBS.byKey.delete(previous);
    SCHEDULED_JOBS.byKey.set(row.key, type);
    SCHEDULED_JOBS.keys.set(type, row.key);
  }
}
