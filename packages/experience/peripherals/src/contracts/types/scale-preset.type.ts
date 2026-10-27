/**
 * Stackra file contract:
 * Purpose: `ScalePreset`, one scale profile of `PeripheralsConfig.scalePresets`: the smallest step the scale reads
 *          (its division) and the most it may weigh, in grams. The shipped `retail` preset reads whole grams up to
 *          15 kg; `precision` reads 0.01 g up to 600 g (jewellery and buy-back weighing).
 * Boundary: a type only. A preset is configuration (ADR 0253 decision 4: presets are profiles); `fitScaleReading`
 *           applies one to a reading. A legal-for-trade certificate is the device's, not this package's.
 * Runtime: isomorphic
 * Governing contract: ADR 0253 (decision 4); ADR 0339 (decision 7); ADR 0449 (decision 3).
 */

/** A scale profile. */
export interface ScalePreset {
  /** The smallest step the scale reads, in grams (`1`, `0.01`). */
  readonly division: number;

  /** The most the scale may weigh, in grams; a heavier reading is refused. */
  readonly capacity: number;
}
