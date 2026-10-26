/**
 * Stackra file contract:
 * Purpose: `perkEligible`, whether a perk listing is shown to a tenant: approved, and listed for the tenant's pack and
 *          product.
 * Boundary: pure; never throws. Nothing here names a pack or a product.
 * Runtime: isomorphic
 * Governing contract: ADR 0393 (decision 1); owner M3-7.
 */
import { ReviewState } from "#core/enums/review-state.enum";
import type { PerkListing } from "#core/schemas/perk-listing.schema";

/**
 * Whether `listing` is shown in `pack` for `product`.
 *
 * @example
 * listings.filter((listing) => perkEligible(listing, tenant.pack, "commerce"));
 */
export function perkEligible(
  listing: Pick<PerkListing, "state" | "packs" | "products">,
  pack: string,
  product: string,
): boolean {
  return (
    listing.state === ReviewState.Approved &&
    listing.packs.includes(pack) &&
    listing.products.includes(product)
  );
}
