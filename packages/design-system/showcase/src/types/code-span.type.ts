/**
 * Stackra file contract:
 * Purpose: `CodeSpan`: one run of a prop description, prose or code, as `codeSpans` returns it.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0060 (RTL; code stays left to right).
 */

/** One run of a description: prose, or the code between a pair of backticks (without them). */
export interface CodeSpan {
  /** The run's text. */
  readonly text: string;
  /** True when the run is code. */
  readonly isCode: boolean;
}
