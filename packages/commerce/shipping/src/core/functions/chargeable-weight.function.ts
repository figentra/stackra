/**
 * Stackra file contract:
 * Purpose: `chargeableWeight`, the weight a carrier bills: the greater of the actual and the dimensional weight,
 *          rounded up to the carrier's billing increment.
 * Boundary: pure. The factor and the increment are the carrier's data from its connector or rate card; the increment
 *           defaults to one gram (no rounding beyond `dimensionalWeight`'s). A bad increment is a `RangeError`.
 * Runtime: isomorphic
 * Governing contract: ADR 0369 (decision 6); ADR 0363 (decision 1).
 */
import type { Parcel } from "#contracts/types/parcel.type";
import { dimensionalWeight } from "#core/functions/dimensional-weight.function";

/**
 * The billed weight of `parcel` in grams.
 *
 * @param parcel - the box.
 * @param factor - the carrier's cubic centimetres per kilogram.
 * @param incrementG - the carrier's billing step in grams; a positive whole number, 1 by default.
 * @example
 * chargeableWeight(parcel, card.factor, card.incrementG);
 * @throws RangeError as `dimensionalWeight` does, or when `incrementG` is not a positive whole number.
 */
export function chargeableWeight(parcel: Parcel, factor: number, incrementG = 1): number {
  if (!Number.isSafeInteger(incrementG) || incrementG <= 0)
    throw new RangeError(
      `chargeableWeight: the increment must be a positive whole number of grams, got ${incrementG}`,
    );
  const billed = Math.max(parcel.weightG, dimensionalWeight(parcel, factor));
  return Math.ceil(billed / incrementG) * incrementG;
}
