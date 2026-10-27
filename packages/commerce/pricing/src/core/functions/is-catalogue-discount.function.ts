/**
 * Stackra file contract:
 * Purpose: `isCatalogueDiscount`, whether a proposed plan-catalogue change is a discount that needs a second approver
 *          (OS-381): every offer version is one, and a price-list version is one when it lowers or drops any price the
 *          version in force holds.
 * Boundary: pure; the admin calls it to set `CatalogueProposal.discount`, so the flag never comes from the person
 *           proposing. Other record kinds are not discounts. Malformed price-list rows are a `RangeError` from
 *           `planPriceListsOf`.
 * Runtime: isomorphic
 * Governing contract: ADR 0391 (decision 4); owner OS-381.
 */
import type { CatalogueRow } from "@stackra/contracts";

import { planPriceListsOf } from "#core/functions/plan-price-lists-of.function";

/**
 * Whether replacing `current` with `next` in a record of `kind` is a discount.
 *
 * @example
 * isCatalogueDiscount("price-list", inForce?.rows ?? [], proposedRows); // true when any price falls
 */
export function isCatalogueDiscount(
  kind: string,
  current: readonly CatalogueRow[],
  next: readonly CatalogueRow[],
): boolean {
  if (kind === "offer") return true;
  if (kind !== "price-list") return false;
  const proposed = planPriceListsOf(next);
  return planPriceListsOf(current).some((list) =>
    list.prices.some((price) => {
      const replacement = proposed
        .find((held) => held.key === list.key)
        ?.prices.find((held) => held.tier === price.tier && held.period === price.period);
      return replacement === undefined || replacement.amount.minor < price.amount.minor;
    }),
  );
}
