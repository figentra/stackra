/**
 * Stackra file contract:
 * Purpose: `JobLink`, one job to queue as part of a chain or a batch: the action class and its input.
 * Boundary: a type only; `QueueService.chain` and `QueueService.batch` take a list of them. The input is
 *           JSON-serialisable, the action's input fields.
 * Runtime: isomorphic
 * Governing contract: ADR 0148 (decision 1: batches and chains).
 */
import type { Action } from "@stackra/actions";
import type { AnyClass } from "@stackra/container";

/** An action and its input. */
export interface JobLink {
  /** The action the job runs. */
  readonly type: AnyClass<Action>;

  /** The action's input. */
  readonly input: unknown;
}
