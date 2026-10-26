/**
 * Stackra file contract:
 * Purpose: `redeemPerk`, one redemption of a perk listing: its code, its link, or for a lead perk the listing's lead
 *          fields picked from the tenant's details, only when the tenant admin consented.
 * Boundary: pure. A lead never carries a field the listing does not name, and never leaves without consent (US-62:
 *           sharing an admin's data with a partner is a "share"); a missing detail or no consent is a `RangeError`.
 * Runtime: isomorphic
 * Governing contract: ADR 0393 (decision 1); owner M3-7, US-62.
 */
import { PerkRedemptionKind } from "#core/enums/perk-redemption-kind.enum";
import type { PerkListing } from "#core/schemas/perk-listing.schema";
import type { PerkRedemption } from "#core/types/perk-redemption.type";

/**
 * The redemption of `listing` for a tenant with `details`, once `consented`.
 *
 * @throws RangeError when a lead perk is redeemed without consent or a named detail is missing, or the listing lacks
 *   its code or link.
 * @example
 * redeemPerk(listing, { company: "Acme", country: "AE", adminName: "Rana", adminEmail: "rana@acme.example" }, true);
 */
export function redeemPerk(
  listing: Pick<PerkListing, "key" | "redemption" | "code" | "url" | "leadFields">,
  details: Readonly<Record<string, string>>,
  consented: boolean,
): PerkRedemption {
  if (listing.redemption === PerkRedemptionKind.Code) {
    if (listing.code === null) throw new RangeError(`redeemPerk: ${listing.key} has no code`);
    return Object.freeze({ kind: listing.redemption, code: listing.code });
  }
  if (listing.redemption === PerkRedemptionKind.Link) {
    if (listing.url === null) throw new RangeError(`redeemPerk: ${listing.key} has no url`);
    return Object.freeze({ kind: listing.redemption, url: listing.url });
  }
  if (!consented)
    throw new RangeError(`redeemPerk: ${listing.key} sends a lead only after consent`);
  const lead: Record<string, string> = {};
  for (const field of listing.leadFields) {
    const value = Object.hasOwn(details, field) ? details[field] : undefined;
    if (value === undefined || value.length === 0)
      throw new RangeError(`redeemPerk: ${listing.key} needs the tenant's ${field}`);
    lead[field] = value;
  }
  return Object.freeze({ kind: PerkRedemptionKind.Lead, lead: Object.freeze(lead) });
}
