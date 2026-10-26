/**
 * Stackra file contract:
 * Purpose: `planPrice`, the price of one plan tier for one period on the list a billing country uses: the list keyed
 *          by the pack's regional tier and price currency.
 * Boundary: pure. A missing list or price is a `RangeError`, never a zero and never another list's price.
 * Runtime: isomorphic
 * Governing contract: ADR 0391 (decision 1); ADR 0392 (decision 1); owner OS-66, R3-SO-14.
 */
import type { Money } from "@stackra/money";

import type { BillingPeriod } from "#core/enums/billing-period.enum";
import { priceListKey } from "#core/functions/price-list-key.function";
import type { BillingTerms } from "#core/types/billing-terms.type";
import type { PlanPriceList } from "#core/types/plan-price-list.type";

/**
 * The price of `tier` per `period` under `terms`.
 *
 * @throws RangeError when no list or no price matches.
 * @example
 * planPrice(lists, billingTermsOf(valuesOn(resolved, today), "eg"), "pro", BillingPeriod.Year);
 */
export function planPrice(
  lists: readonly PlanPriceList[],
  terms: Pick<BillingTerms, "regionalTier" | "priceCurrency">,
  tier: string,
  period: BillingPeriod,
): Money {
  const key = priceListKey(terms.regionalTier, terms.priceCurrency);
  const price = lists
    .find((list) => list.key === key)
    ?.prices.find((held) => held.tier === tier && held.period === period);
  if (price === undefined)
    throw new RangeError(`planPrice: no ${period} price for ${tier} on ${key}`);
  return price.amount;
}
