/**
 * Stackra file contract:
 * Purpose: `RunStepRecord`, one model step of a run: its number, why the model stopped, and the tokens it used.
 * Boundary: a type only, written through the `RunStore`. Counts and reasons only, never text (ADR 0100 decision 9);
 *           token counts feed budgets and usage.
 * Runtime: isomorphic
 * Governing contract: ADR 0100 (decisions 9 and 10: `ai_steps`).
 */

/** One step of a run. */
export interface RunStepRecord {
  /** The run. */
  readonly runId: string;

  /** The step's number in the run, from 0. */
  readonly index: number;

  /** Why the model stopped this step (`stop`, `tool-calls`, `length`). */
  readonly finishReason: string;

  /** The input tokens the step used. */
  readonly inputTokens: number;

  /** The output tokens the step used. */
  readonly outputTokens: number;
}
