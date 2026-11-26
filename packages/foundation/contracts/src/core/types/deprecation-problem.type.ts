/**
 * Stackra file contract:
 * Purpose: `DeprecationProblem`, what `deprecationProblem` finds wrong with a deprecation: a malformed value, or a sunset
 *          inside the deprecation window.
 * Boundary: a type only. The codes are gen's refusal codes, so `@Deprecated` and `stackra gen` name a mistake the same way.
 * Runtime: isomorphic
 * Governing contract: ADR 0131 (decision 4); ADR 0136 (decision 4); ADR 0177 (decision 6); ADR 0231 (snake_case codes);
 *                     STA-2836.
 */

/** One problem of a deprecation. */
export interface DeprecationProblem {
  /** `deprecation_invalid` for a malformed value, `deprecation_window_short` for a sunset inside the window. */
  readonly code: "deprecation_invalid" | "deprecation_window_short";

  /** What is wrong, naming the value and the earliest sunset when that is the problem. */
  readonly message: string;
}
