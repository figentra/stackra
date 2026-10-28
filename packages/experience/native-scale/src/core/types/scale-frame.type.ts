/**
 * Stackra file contract:
 * Purpose: `ScaleFrame`, the full legal-for-trade reading a native scale driver answers on `frame()`: the net weight
 *          in grams and as displayed (value and unit), whether it settled, whether it is net, and the tare in use.
 * Boundary: a type only. It never comes from a mock: only a driver reading a real scale line builds one, and the
 *           `Scale` port's `ScaleReading` (grams and `isStable`) is derived from it unchanged. A till charges by
 *           weight only on `isStable`; the legal-for-trade certificate is the scale's, not this package's.
 * Runtime: isomorphic
 * Governing contract: ADR 0478 (decision 5); ADR 0253; ADR 0449 (decision 3).
 */

/** A scale's full reading. */
export interface ScaleFrame {
  /** The net weight in grams. */
  readonly grams: number;

  /** The weight as the scale displayed it, in `unit`. */
  readonly value: number;

  /** The unit the scale displayed (`g`, `kg`, `lb`, `oz`). */
  readonly unit: string;

  /** True when the scale marked the weight settled. */
  readonly isStable: boolean;

  /** True for a net weight, false for a gross one, null when the protocol does not say. */
  readonly isNet: boolean | null;

  /** The tare in grams, or null when the protocol or the scale did not report one. */
  readonly tareGrams: number | null;
}
