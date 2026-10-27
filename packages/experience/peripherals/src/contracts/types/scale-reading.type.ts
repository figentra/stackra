/**
 * Stackra file contract:
 * Purpose: `ScaleReading`, one weight read from a scale: the weight in grams and whether the scale had settled.
 * Boundary: a type only. Grams whatever the scale's display unit, so a caller never converts; whole grams on a retail
 *           scale, fractions on a precision scale (its `ScalePreset.division`). A caller that charges by weight waits
 *           for `isStable`.
 * Runtime: isomorphic
 * Governing contract: ADR 0253 (peripherals: scales); ADR 0449 (decision 3: the precision preset).
 */

/** A weight on the scale. */
export interface ScaleReading {
  /** The net weight in grams, to the scale's division (`1250`, or `12.34` on a precision scale). */
  readonly grams: number;

  /** True when the scale reports the weight as settled. */
  readonly isStable: boolean;
}
