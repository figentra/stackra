/**
 * Stackra file contract:
 * Purpose: `ClockParts`, a duration split into whole days, hours, minutes and seconds.
 * Boundary: a type only, in its own file.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); STA-1371.
 */

/** A duration in parts. */
export interface ClockParts {
  /** Whole days in the duration. */
  readonly days: number;
  /** Hours left after the days. */
  readonly hours: number;
  /** Minutes left after the hours. */
  readonly minutes: number;
  /** Seconds left after the minutes. */
  readonly seconds: number;
}
