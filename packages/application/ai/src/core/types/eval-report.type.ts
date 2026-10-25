/**
 * Stackra file contract:
 * Purpose: `EvalReport`, what `runEvals` answers: the cases that passed and failed and the share that passed.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0156 (decision 4); ADR 0100 (decision 12).
 */

/** One suite's result. */
export interface EvalReport {
  /** The names of the cases that passed, in suite order. */
  readonly passed: readonly string[];

  /** The names of the cases that failed or threw, in suite order. */
  readonly failed: readonly string[];

  /** The share that passed, from 0 to 1; 1 for an empty suite. */
  readonly score: number;
}
