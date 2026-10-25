/**
 * Stackra file contract:
 * Purpose: `EvaluateOptions`, what an evaluation takes beside the condition and the facts: the current time, and the
 *          revision the explanation names.
 * Boundary: a type only. The engine reads no clock (ADR 0331 decision 6): `now` is the caller's, so the same facts,
 *           time and revision always give the same result.
 * Runtime: isomorphic
 * Governing contract: ADR 0331 (decisions 5 and 6).
 */

/** The options of `evaluate`. */
export interface EvaluateOptions {
  /** The current time, as the caller decides it (the action's start, a scheduled tick). */
  readonly now: Date;

  /** The rule set revision the condition is; left out for a condition that is not a stored revision. */
  readonly revision?: number;
}
