/**
 * Stackra file contract:
 * Purpose: `ScaleReading`, one weight read from a scale: the weight in whole grams and whether the scale had settled.
 * Boundary: a type only. Grams whatever the scale's display unit, so a caller never converts; a caller that charges by
 *           weight waits for `isStable`.
 * Runtime: isomorphic
 * Governing contract: ADR 0253 (peripherals: scales).
 */

/** A weight on the scale. */
export interface ScaleReading {
  /** The net weight in whole grams. */
  readonly grams: number;

  /** True when the scale reports the weight as settled. */
  readonly isStable: boolean;
}
