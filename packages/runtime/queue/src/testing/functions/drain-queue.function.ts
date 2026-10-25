/**
 * Stackra file contract:
 * Purpose: `drainQueue(queue?)`, runs every job of the testing app compiled last that is due now (of one queue, or of
 *          all), through the real pipeline, until none is due.
 * Boundary: test only. A job that fails with attempts left waits for its backoff, so a drain runs it once; `runJob`
 *           runs every attempt. A job that the drained jobs queue meanwhile runs in the same drain.
 * Runtime: node
 * Governing contract: ADR 0269 (testing helpers); ADR 0148 (decision 1).
 */
import type { JobRun } from "#core/index";
import { CURRENT_QUEUE } from "#testing/constants/current-queue.constant";

/**
 * Drains the current testing app's queue.
 *
 * @returns every attempt made, in order.
 * @throws Error before any testing app compiled.
 * @example
 * await run(SendMessageAction, input, { as, idempotencyKey: "k1" });
 * await drainQueue(); // runs DeliverMessageAction
 */
export async function drainQueue(queue?: string): Promise<readonly JobRun[]> {
  const current = CURRENT_QUEUE.value;
  if (current === undefined)
    throw new Error(
      "No testing app: compile one with createTestingModule(Root).compile() before calling drainQueue()",
    );
  return current.worker.drain(queue);
}
