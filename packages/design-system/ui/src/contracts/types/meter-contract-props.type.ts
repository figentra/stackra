/**
 * Stackra file contract:
 * Purpose: `MeterContractProps`, the props every runtime's `Meter` takes: one value on a known scale (storage used,
 *          a score, a fill level) coloured by where it sits against `low`, `high` and `optimum`.
 * Boundary: types only; a meter shows a measure, not progress (use ProgressBar for a task that finishes).
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371 (wave A, owner request 2026-10-29).
 */

/** Props shared by the web and native `Meter`. */
export interface MeterContractProps {
  /** The measure. */
  readonly value: number;
  /** The scale's start; defaults to 0. */
  readonly minValue?: number | undefined;
  /** The scale's end; defaults to 100. */
  readonly maxValue?: number | undefined;
  /** Where the low part of the scale ends. */
  readonly low?: number | undefined;
  /** Where the high part of the scale starts. */
  readonly high?: number | undefined;
  /** The best value: its part is green, the next part amber, the far part red. Defaults to the middle. */
  readonly optimum?: number | undefined;
  /** The visible name, which is also the spoken one. */
  readonly label: string;
  /** How the value is written; defaults to a percent of the scale. */
  readonly formatOptions?: Intl.NumberFormatOptions | undefined;
  /** Words to show and say instead of the number, for example "8.2 of 10 GB". */
  readonly valueLabel?: string | undefined;
}
