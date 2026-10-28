/**
 * Stackra file contract:
 * Purpose: `readJob`, the `JobPlan` of an action class: its recorded `job` option with the queue defaults applied, the
 *          actor kind its jobs run as, and its job key (registering the written key when gen registered none).
 * Boundary: internal to this package; called by `QueueService` when it stores a job and by the worker when it runs one.
 *           `Action({...})` has already checked the queue, timeout, retries, cron and the system-or-job actor; this adds
 *           the checks it leaves to the queue (the backoff code and the dead-letter method).
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 28 and 30); ADR 0148 (decisions 1 and 2); ADR 0294 (decision 20).
 */
import type { Action, ActionOptions } from "@stackra/actions";
import { kindOf } from "@stackra/container";
import type { AnyClass } from "@stackra/container";
import { ActorKind, Backoff, Enum } from "@stackra/contracts";
import { duration } from "@stackra/validation";

import { JOB_DEFAULTS } from "#core/constants/job-defaults.constant";
import { JOB_TYPES } from "#core/constants/job-types.constant";
import { registerJobs } from "#core/functions/register-jobs.function";
import type { JobFairnessOptions } from "#core/types/job-fairness-options.type";
import type { JobPlan } from "#core/types/job-plan.type";

/** Whether `value` is a whole number from `min`. */
const whole = (value: unknown, min: number): value is number =>
  Number.isInteger(value) && (value as number) >= min;

/**
 * The job plan of `type`.
 *
 * @throws TypeError when `type` is not an action, its `onDeadLetter` names no method, or its key is another class's.
 * @throws RangeError when its `backoff` is not a `Backoff` code, its `priority` is not a whole number, its
 *         `scopeConcurrency` or `throttle.perMinute` is not a whole number from 1, or its `throttle.key` is empty.
 * @example
 * readJob(DeliverMessageAction); // { key: "message.deliver", queue: "delivery", retries: 5, deadLetter: true, … }
 */
export function readJob(type: AnyClass<Action>): JobPlan {
  const record = kindOf(type);
  if (record?.kind !== "action")
    throw new TypeError(`${type.name} is not an action: only an action runs as a job`);
  const options = record.options as unknown as Pick<ActionOptions, "key" | "actors" | "job">;
  const job = options.job as (NonNullable<typeof options.job> & JobFairnessOptions) | undefined;
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
  const priority = job?.priority ?? 0;
  if (!Number.isInteger(priority))
    throw new RangeError(`${type.name}: job.priority is a whole number, got ${priority}`);
  const { scopeConcurrency, throttle } = job ?? {};
  if (scopeConcurrency !== undefined && !whole(scopeConcurrency, 1))
    throw new RangeError(
      `${type.name}: job.scopeConcurrency is a whole number from 1, got ${scopeConcurrency}`,
    );
  if (
    throttle !== undefined &&
    (!whole(throttle.perMinute, 1) || typeof throttle.key !== "string" || throttle.key === "")
  )
    throw new RangeError(
      `${type.name}: job.throttle takes a perMinute from 1 and a key, got ${JSON.stringify(throttle)}`,
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
    priority,
    ...(scopeConcurrency === undefined ? {} : { scopeConcurrency }),
    ...(throttle === undefined
      ? {}
      : { throttle: Object.freeze({ perMinute: throttle.perMinute, key: throttle.key }) }),
  });
}
