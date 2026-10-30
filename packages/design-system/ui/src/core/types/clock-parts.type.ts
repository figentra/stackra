/**
 * Stackra file contract:
 * Purpose: `ClockParts`, a duration split into whole days, hours, minutes and seconds.
 * Boundary: a type only, in its own file.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); STA-1371.
 */

/** A duration in parts. */
export interface ClockParts {
  readonly days: number;
  readonly hours: number;
  readonly minutes: number;
  readonly seconds: number;
}
