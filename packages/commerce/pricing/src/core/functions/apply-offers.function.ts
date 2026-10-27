/**
 * Stackra file contract:
 * Purpose: `applyOffers`, the outcome of the applied offers for one month of a subscription: each percentage in force
 *          that month taken off the price in turn, and the credit grants, module grants and free migration in force.
 * Boundary: pure; it applies offers `stackOffers` already let through. A benefit with `months` runs for months 0 to
 *           `months - 1` of the subscription; null runs while the offer holds. Percentages compound (50% then 20% is
 *           60% off), each rounded with the caller's `Rounding`.
 * Runtime: isomorphic
 * Governing contract: ADR 0393 (decision 2); owner M3-6, RV-52; ADR 0220 (decision 3: one explicit rounding).
 */
import { Rounding } from "@stackra/contracts";
import { type Money } from "@stackra/money";

import { OfferBenefitKind } from "#core/enums/offer-benefit-kind.enum";
import type { CatalogueOffer } from "#core/types/catalogue-offer.type";
import type { OfferOutcome } from "#core/types/offer-outcome.type";

/**
 * The outcome of `offers` on `price` in month `month` (0 for the first) of the subscription.
 *
 * @throws RangeError when `month` is not a whole number at or above zero.
 * @example
 * applyOffers(Money.of("100.00", "USD"), stack.applied, 0).price.toDecimal(); // "50.00" for 5,000 basis points
 */
export function applyOffers(
  price: Money,
  offers: readonly CatalogueOffer[],
  month: number,
  rounding: Rounding = Rounding.HalfEven,
): OfferOutcome {
  if (!Number.isSafeInteger(month) || month < 0)
    throw new RangeError(`applyOffers: month is a whole number from 0, got ${month}`);
  let discounted = price;
  const credits: OfferOutcome["credits"][number][] = [];
  const modules: string[] = [];
  let freeMigration = false;
  for (const offer of offers)
    for (const benefit of offer.benefits) {
      if (benefit.kind === OfferBenefitKind.FreeMigration) {
        freeMigration = true;
        continue;
      }
      if (benefit.months !== null && month >= benefit.months) continue;
      if (benefit.kind === OfferBenefitKind.Percent)
        discounted = discounted.times(String((10_000 - benefit.basisPoints) / 10_000), rounding);
      else if (benefit.kind === OfferBenefitKind.CreditGrant) credits.push(benefit);
      else if (!modules.includes(benefit.module)) modules.push(benefit.module);
    }
  return Object.freeze({
    price: discounted,
    credits: Object.freeze(credits),
    modules: Object.freeze(modules),
    freeMigration,
  });
}
