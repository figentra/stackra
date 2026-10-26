/**
 * Stackra file contract:
 * Purpose: `QueueJobDispatcherDriver`, the `queue` driver of @stackra/actions' `JobDispatcher` port, the work behind
 *          `ctx.dispatch(Action, input)`: it stores the job through `QueueService`, on behalf of the calling actor, in
 *          the call's scope and caused by the call.
 * Boundary: the only driver of the port, so the container takes it whenever this package is installed. The scope is
 *           the descriptor's (the call's `ScopeRef`), so the worker opens the same scope session for the job; a call
 *           with no scope queues a platform job. A dispatch inside the action's transaction joins it on the Postgres
 *           driver; an external effect still belongs in `ctx.afterCommit`. A unique job already waiting or running is
 *           skipped silently.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rule 28: the job surface); ADR 0136 (decision 3); ADR 0142 (drivers behind ports);
 *                     ADR 0327 (decision 6: the call carries its scope).
 */
import type { Action } from "@stackra/actions";
import { JobDispatcher } from "@stackra/actions/contracts";
import type { CallDescriptor } from "@stackra/actions/contracts";
import { Driver } from "@stackra/container";
import type { AnyClass } from "@stackra/container";

import type { QueueService } from "#core/services/queue.service";

/**
 * Queues `ctx.dispatch` calls.
 *
 * @example
 * ctx.afterCommit(() => ctx.dispatch(DeliverMessageAction, { messageId: message.id, html, text }));
 */
export class QueueJobDispatcherDriver extends Driver(JobDispatcher) {
  /** Stores the jobs. */
  private readonly queue: QueueService;

  /**
   * @param queue - the queue service.
   */
  constructor(queue: QueueService) {
    super();
    this.queue = queue;
  }

  /** Queues `action` with `input`, caused by `call`. */
  async dispatch(action: AnyClass, input: unknown, call: CallDescriptor): Promise<void> {
    await this.queue.push(action as AnyClass<Action>, input as never, {
      origin: call.actor,
      ...(call.scope === undefined ? {} : { scope: call.scope }),
      causedBy: call.callId,
    });
  }
}
