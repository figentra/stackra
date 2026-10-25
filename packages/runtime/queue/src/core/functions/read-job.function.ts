/**
 * Stackra file contract:
 * Purpose: `readJob`, the `JobPlan` of an action class: its recorded `job` option with the queue defaults applied, the
 *          actor kind its jobs run as, and its job key (registering the written key when gen registered none).
 * Boundary: internal to this package; called by `QueueService` when it stores a job and by the worker when it runs one.
 *           `Action({...})` has already checked the queue, timeout, retries, cron and the system-or-job actor; this adds
 *           the checks it leaves to the queue (the backoff code and the dead-letter method).
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 28 and 30); ADR 0148 (decision 1); ADR 0294 (decision 20).
 */
import type { Action, ActionOptions } from "@stackra/actions";
import { kindOf } from "@stackra/container";
import type { AnyClass } from "@stackra/container";
import { ActorKind, Enum } from "@stackra/contracts";
import { duration } from "@stackra/validation";

import { JOB_DEFAULTS } from "#core/constants/job-defaults.constant";
import { JOB_TYPES } from "#core/constants/job-types.constant";
import { Backoff } from "#core/enums/backoff.enum";
import { registerJobs } from "#core/functions/register-jobs.function";
import type { JobPlan } from "#core/types/job-plan.type";

/**
 * The job plan of `type`.
 *
 * @throws TypeError when `type` is not an action, its `onDeadLetter` names no method, or its key is another class's.
 * @throws RangeError when its `backoff` is not a `Backoff` code.
 * @example
 * readJob(DeliverMessageAction); // { key: "message.deliver", queue: "delivery", retries: 5, deadLetter: true, … }
 */
export function readJob(type: AnyClass<Action>): JobPlan {
  const record = kindOf(type);
  if (record?.kind !== "action")
    throw new TypeError(`${type.name} is not an action: only an action runs as a job`);
  const options = record.options as unknown as Pick<ActionOptions, "key" | "actors" | "job">;
  const { job } = options;
  const backoff = (job?.backoff ?? JOB_DEFAULTS.backoff) as Backoff;
  if (!Enum.values(Backoff).includes(backoff))
    throw new RangeError(
      `${type.name}: job.backoff takes a Backoff code, got ${JSON.stringify(backoff)}`,
    );
  const onDeadLetter = job?.onDeadLetter;
  const prototype = type.prototype as unknown as Readonly<Record<string, unknown>>;
  if (onDeadLetter !== undefined && typeof prototype[onDeadLetter] !== "function")
    throw new TypeError(
      `${type.name}: job.onDeadLetter names "${onDeadLetter}", which is not a method of the action`,
    );
  let key = JOB_TYPES.keys.get(type);
  if (key === undefined) {
    key = options.key;
    registerJobs([{ type, key }]);
  }
  return Object.freeze({
    key,
    declared: job !== undefined,
    actor: options.actors.includes(ActorKind.Job) ? ActorKind.Job : ActorKind.System,
    queue: job?.queue ?? JOB_DEFAULTS.queue,
    unique: job?.unique === true,
    timeout: job?.timeout === undefined ? JOB_DEFAULTS.timeout : duration(job.timeout),
    retries: job?.retries ?? JOB_DEFAULTS.retries,
    backoff,
    deadLetter: job?.deadLetter === true,
    ...(onDeadLetter === undefined ? {} : { onDeadLetter }),
  });
}
