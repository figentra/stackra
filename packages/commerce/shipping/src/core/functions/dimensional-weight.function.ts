/**
 * Stackra file contract:
 * Purpose: `dimensionalWeight`, the weight a carrier bills a box's volume as: length × width × height divided by the
 *          carrier's dimensional factor, in whole grams rounded up.
 * Boundary: pure and exact in integers until the one division. The factor (cubic centimetres per kilogram) is the
 *           carrier's and comes from its connector or rate card, never from code; with millimetres and grams,
 *           `grams = mm³ / factor`. A bad parcel or factor is a `RangeError`.
 * Runtime: isomorphic
 * Governing contract: ADR 0369 (decision 6); ADR 0363 (decision 1).
 */
import type { Parcel } from "#contracts/types/parcel.type";

/** True for a whole number of units above zero that is safe in a double. */
function isPositiveWhole(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0;
}

/**
 * The volumetric weight of `parcel` in grams.
 *
 * @param parcel - the box; dimensions and weight are positive whole numbers.
 * @param factor - the carrier's cubic centimetres per kilogram; positive and finite.
 * @example
 * dimensionalWeight({ lengthMm: 400, widthMm: 300, heightMm: 200, weightG: 2_500 }, factor);
 * @throws RangeError when a dimension or the weight is not a positive whole number, the volume is past the safe
 *   integer limit, or the factor is not positive and finite.
 */
export function dimensionalWeight(parcel: Parcel, factor: number): number {
  const { lengthMm, widthMm, heightMm, weightG } = parcel;
  for (const [name, value] of Object.entries({ lengthMm, widthMm, heightMm, weightG }))
    if (!isPositiveWhole(value))
      throw new RangeError(
        `dimensionalWeight: ${name} must be a positive whole number, got ${value}`,
      );
  if (!Number.isFinite(factor) || factor <= 0)
    throw new RangeError(
      `dimensionalWeight: the factor must be positive and finite, got ${factor}`,
    );
  const volume = lengthMm * widthMm * heightMm;
  if (!Number.isSafeInteger(volume))
    throw new RangeError(
      `dimensionalWeight: the volume ${volume} mm³ is past the safe integer limit`,
    );
  return Math.ceil(volume / factor);
}
