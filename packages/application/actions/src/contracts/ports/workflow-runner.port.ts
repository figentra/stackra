/**
 * Stackra file contract:
 * Purpose: the `WorkflowRunner` port behind `ctx.run(Workflow, input)` and `ctx.signal(Signal, payload, correlation)`:
 *          an action hands multi-step work to a durable workflow and returns its output, or wakes a parked step.
 * Boundary: an abstract class that is its own token. `@stackra/workflow` implements it (journal, steps,
 *           compensation); this package never imports it (workflow depends on actions). Calling `ctx.run` in an app
 *           that binds none is an error naming the package.
 * Runtime: isomorphic
 * Governing contract: ADR 0101 (action first, a workflow behind the same key when needed); ADR 0136 (decision 2).
 */
import type { AnyClass } from "@stackra/container";
import { Port } from "@stackra/contracts";

import type { CallDescriptor } from "#contracts/types/call-descriptor.type";

/**
 * Starts workflows and delivers signals.
 *
 * @example
 * export class JournalWorkflowRunnerDriver extends Driver(WorkflowRunner) {
 *   run(workflow: AnyClass, input: unknown, call: CallDescriptor): Promise<unknown> {
 *     return this.engine.start(workflow, input, { parent: call.callId, actor: call.actor });
 *   }
 * }
 */
export abstract class WorkflowRunner extends Port {
  /** Runs `workflow` with `input` on behalf of `call` and resolves to its output; rejects with its refusal. */
  abstract run(workflow: AnyClass, input: unknown, call: CallDescriptor): Promise<unknown>;

  /** Delivers `payload` as a `signal` to the run that waits on `correlation` (held when no run waits yet). */
  abstract signal(
    signal: AnyClass,
    payload: object,
    correlation: object | undefined,
    call: CallDescriptor,
  ): Promise<void>;
}
