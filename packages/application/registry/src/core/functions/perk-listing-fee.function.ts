/**
 * Stackra file contract:
 * Purpose: `perkListingFee`, the listing-fee hook OS billing calls each period for a perk listing: the flat fee of the
 *          listing's fee schedule in force on the period's first day (the latest `effectiveFrom` at or before it), or
 *          null for a free listing.
 * Boundary: pure. The fee is the schedule's `fixedMinor`; its rate is ignored, since a listing has no gross. A listing
 *           that names a schedule with no version in force is a `RangeError`: billing never guesses a fee.
 * Runtime: isomorphic
 * Governing contract: ADR 0393 (decision 1); ADR 0355 (decision 8: fee-schedule records); owner M3-7, OS-130;
 *                     STA-1383 (MoneyAmount).
 */
import type { FeeSchedule } from "#core/schemas/fee-schedule.schema";
import type { PerkListing } from "#core/schemas/perk-listing.schema";
import type { PerkListingCharge } from "#core/types/perk-listing-charge.type";

/**
 * The listing fee of `listing` for the period starting `periodStart` (an ISO date).
 *
 * @throws RangeError when the listing's fee schedule has no version in force on that day.
 * @example
 * perkListingFee(listing, feeSchedules, "2026-11-01"); // { partner, listing, feeSchedule: "perk-listing", currency: "AED", amountMinor: 50_000 }
 */
export function perkListingFee(
  listing: Pick<PerkListing, "key" | "partner" | "feeSchedule">,
  schedules: readonly Pick<FeeSchedule, "key" | "currency" | "fixedMinor" | "effectiveFrom">[],
  periodStart: string,
): PerkListingCharge | null {
  if (listing.feeSchedule === null) return null;
  let found: (typeof schedules)[number] | undefined;
  for (const schedule of schedules)
    if (
      schedule.key === listing.feeSchedule &&
      schedule.effectiveFrom <= periodStart &&
      (found === undefined || schedule.effectiveFrom > found.effectiveFrom)
    )
      found = schedule;
  if (found === undefined)
    throw new RangeError(
      `perkListingFee: no ${listing.feeSchedule} fee schedule in force on ${periodStart} for ${listing.key}`,
    );
  return Object.freeze({
    partner: listing.partner,
    listing: listing.key,
    feeSchedule: found.key,
    amount: Object.freeze({ minor: found.fixedMinor, currency: found.currency }),
  });
}
