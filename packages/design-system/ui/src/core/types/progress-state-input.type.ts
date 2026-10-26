/**
 * Stackra file contract:
 * Purpose: `ProgressStateInput`: the inputs of `progressStateOf`, the value, its range, the caller's text and the
 *          locale.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0312; WCAG
 *          2.2 SC 4.1.2.
 */
/** The inputs of `progressStateOf`: the value, its range, the caller's text and the locale. */
export interface ProgressStateInput {
  /** The value, or `undefined` for an indeterminate indicator. */
  readonly value: number | undefined;
  /** The value that means nothing done. */
  readonly minValue: number;
  /** The value that means done. */
  readonly maxValue: number;
  /** The caller's own text for the value, used in place of the percentage. */
  readonly valueLabel: string | undefined;
  /** The BCP 47 locale the percentage is written in. */
  readonly locale: string;
}
