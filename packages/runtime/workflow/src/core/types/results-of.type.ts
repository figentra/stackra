/**
 * Stackra file contract:
 * Purpose: `ResultsOf<W>`, the stored result of every step of workflow `W` by step name: what `run.results.<step>`
 *          reads in a later step, an undo or `output`.
 * Boundary: a type only. A result is stored as JSON with the run, so a later step reads its fields as plain data (a
 *           `Date` comes back as its ISO text); a step skipped by its `when`, or not reached yet, has no result.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 18: `run.results.<step>`); ADR 0102 (decision 1: results kept in the journal).
 */
import type { StepName } from "#core/types/step-name.type";

/**
 * The step results of `W`.
 *
 * @example
 * type R = ResultsOf<CreateOrderWorkflow>["price"]; // PricedOrder
 */
export type ResultsOf<W> = {
  readonly [K in StepName<W>]: W[K] extends (...args: never[]) => Promise<infer R> ? R : never;
};
