/**
 * Stackra file contract:
 * Purpose: `SliderMark`, one labelled stop under a `Slider`'s track: its value and, optionally, its own words.
 * Boundary: types only; without a label the value is written in the slider's `formatOptions` and the customer's digits.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371 (wave A, owner request 2026-10-29).
 */

/** One mark under a slider's track. */
export interface SliderMark {
  /** Where the mark sits, between the slider's `minValue` and `maxValue`. */
  readonly value: number;
  /** The words under the mark; left out, the value itself is written. */
  readonly label?: string | undefined;
}
