/**
 * Stackra file contract:
 * Purpose: `registerJobs`, how gen's generated entry tells the queue which actions it can run and under which locked
 *          key, so a worker in another process than the one that queued a job finds its class by the stored key.
 * Boundary: writes the process-wide `JOB_TYPES`; a later row for a class replaces its earlier key. Takes the same rows
 *           as `registerActions` (only `type` and `key` are read). Checks each row, so a wrong row fails at boot rather
 *           than on the first job.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 10, 20 and 22); ADR 0305 (rule 28); the actions precedent
 *                     (`registerActions`).
 */
import type { Action, ActionRegistration } from "@stackra/actions";
import { kindOf } from "@stackra/container";
import type { AnyClass } from "@stackra/container";

import { JOB_TYPES } from "#core/constants/job-types.constant";

/**
 * Registers the job actions with their locked keys.
 *
 * @throws TypeError when a row's class is not an action, its key is empty, or another class has its key.
 * @example
 * registerJobs([{ type: DeliverMessageAction, key: "messages.message.deliver@1" }]);
 */
export function registerJobs(rows: readonly Pick<ActionRegistration, "type" | "key">[]): void {
  for (const row of rows) {
    if (kindOf(row.type)?.kind !== "action")
      throw new TypeError(`registerJobs: ${row.type.name} is not an action`);
    if (typeof row.key !== "string" || row.key === "")
      throw new TypeError(`registerJobs: ${row.type.name} needs its locked key`);
    const type = row.type as AnyClass<Action>;
    const holder = JOB_TYPES.byKey.get(row.key);
    if (holder !== undefined && holder !== type)
      throw new TypeError(`registerJobs: ${type.name} and ${holder.name} share the key ${row.key}`);
    const previous = JOB_TYPES.keys.get(type);
    if (previous !== undefined) JOB_TYPES.byKey.delete(previous);
    JOB_TYPES.byKey.set(row.key, type);
    JOB_TYPES.keys.set(type, row.key);
  }
}
