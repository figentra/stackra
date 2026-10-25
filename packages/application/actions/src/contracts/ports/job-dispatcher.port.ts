/**
 * Stackra file contract:
 * Purpose: the `JobDispatcher` port behind `ctx.dispatch(Action, input)`: queues another action as a job, to run on
 *          its declared `job.queue` through the same pipeline as a `Job` actor.
 * Boundary: an abstract class that is its own token. `@stackra/queue` implements it (retries, dead letters, drivers);
 *           this package never imports it (queue depends on actions). A dispatch inside a transaction belongs in
 *           `ctx.afterCommit`. Calling `ctx.dispatch` in an app that binds none is an error naming the package.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rule 28: `job` is a typed surface of the action); ADR 0136 (decision 3: jobs derive
 *                     their own Idempotency-Keys).
 */
import type { AnyClass } from "@stackra/container";
import { Port } from "@stackra/contracts";

import type { CallDescriptor } from "#contracts/types/call-descriptor.type";

/**
 * Queues actions as jobs.
 *
 * @example
 * export class QueueJobDispatcherDriver extends Driver(JobDispatcher) {
 *   async dispatch(action: AnyClass, input: unknown, call: CallDescriptor): Promise<void> {
 *     await this.queues.push(action, input, { origin: call.actor, scope: call.scope, causedBy: call.callId });
 *   }
 * }
 */
export abstract class JobDispatcher extends Port {
  /** Queues `action` with `input`, caused by `call`; resolves once the job is stored. */
  abstract dispatch(action: AnyClass, input: unknown, call: CallDescriptor): Promise<void>;
}
