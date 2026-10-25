/**
 * Stackra file contract:
 * Purpose: `runJob(Action, input, options?)`, runs one job of the testing app compiled last to its end: it queues the
 *          action as `ctx.dispatch` would and runs every attempt at once, without waiting for the backoff, until the job
 *          is done, dead-lettered or dropped.
 * Boundary: test only, through the real pipeline and the app's queue driver; the attempts, the timeout, the dead letter
 *           and the `onDeadLetter` call are the worker's, unchanged. Other jobs due at the same instants run too, as
 *           `drainQueue` would run them. A failed job resolves; a bug outside an attempt rejects.
 * Runtime: node
 * Governing contract: ADR 0269 (testing helpers); ADR 0148 (decision 1).
 */
import type { Action, CallInput, OutputOf } from "@stackra/actions";
import type { AnyClass } from "@stackra/container";

import { JobOutcome } from "#core/index";
import type { JobRun, PushOptions } from "#core/index";
import { CURRENT_QUEUE } from "#testing/constants/current-queue.constant";
import type { JobResult } from "#testing/types/job-result.type";

/**
 * Runs `type` with `input` as a job until its last attempt.
 *
 * @param options - the caller, scope or Idempotency-Key, as `QueueService.push` takes them.
 * @throws Error before any testing app compiled, or when a unique job of the same scope already waits or runs.
 * @example
 * const job = await runJob(DeliverMessageAction, { messageId, html: "<p>x</p>", text: "x" });
 * expect(job).toDeadLetter({ attempts: 6 });
 */
export async function runJob<C extends AnyClass<Action>>(
  type: C,
  input: CallInput<InstanceType<C>>,
  options: PushOptions = {},
): Promise<JobResult<OutputOf<InstanceType<C>>>> {
  const current = CURRENT_QUEUE.value;
  if (current === undefined)
    throw new Error(
      "No testing app: compile one with createTestingModule(Root).compile() before calling runJob()",
    );
  const id = await current.queue.push(type, input, options);
  if (id === undefined)
    throw new Error(`${type.name}: a unique job of the same scope already waits or runs`);
  const runs: JobRun[] = [];
  let at: Date | undefined;
  for (;;) {
    // oxlint-disable-next-line no-await-in-loop -- each attempt runs at the time the one before scheduled it
    const mine = (await current.worker.drain(undefined, at)).filter((run) => run.job.id === id);
    runs.push(...mine);
    const last = mine.at(-1);
    if (last === undefined) throw new Error(`Job ${id} of ${type.name} was not reserved`);
    if (last.outcome !== JobOutcome.Retried)
      return Object.freeze({
        id,
        outcome: last.outcome,
        attempts: last.job.attempts,
        output: last.output as OutputOf<InstanceType<C>> | undefined,
        error: last.error,
        runs: Object.freeze(runs),
      });
    at = last.retryAt;
  }
}
