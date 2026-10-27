/**
 * Stackra file contract:
 * Purpose: `planPriceListsOf`, the plan price lists a `price-list:<product>` version's rows hold: one row per price,
 *          `{ regionalTier, currency, tier, period, amount }` with `amount` a decimal text, grouped by
 *          `priceListKey`.
 * Boundary: pure; it reads untrusted admin and seed rows, so a malformed row, an unknown period or currency, or a
 *           second price for the same list, tier and period is a `RangeError`.
 * Runtime: isomorphic
 * Governing contract: ADR 0391 (decisions 1 and 5); ADR 0392 (decision 1); config-model section 2.
 */
import { type CatalogueRow, Enum } from "@stackra/contracts";
import { Money } from "@stackra/money";

import { BillingPeriod } from "#core/enums/billing-period.enum";
import { priceListKey } from "#core/functions/price-list-key.function";
import { rowText } from "#core/functions/row-text.function";
import type { PlanPrice } from "#core/types/plan-price.type";
import type { PlanPriceList } from "#core/types/plan-price-list.type";

/**
 * The lists `rows` hold, in first-seen order.
 *
 * @throws RangeError for a malformed or repeated row.
 * @example
 * planPriceListsOf(version.rows).find((list) => list.key === priceListKey("low", "USD"));
 */
export function planPriceListsOf(rows: readonly CatalogueRow[]): readonly PlanPriceList[] {
  const lists = new Map<string, { regionalTier: string; currency: string; prices: PlanPrice[] }>();
  for (const row of rows) {
    const regionalTier = rowText("planPriceListsOf", row, "regionalTier");
    const currency = rowText("planPriceListsOf", row, "currency");
    const tier = rowText("planPriceListsOf", row, "tier");
    const period = rowText("planPriceListsOf", row, "period");
    if (!Enum.values(BillingPeriod).includes(period as BillingPeriod))
      throw new RangeError(`planPriceListsOf: row ${String(row.id)} has unknown period ${period}`);
    const amount = Money.of(rowText("planPriceListsOf", row, "amount"), currency);
    const key = priceListKey(regionalTier, amount.currency);
    const list = lists.get(key) ?? { regionalTier, currency: amount.currency, prices: [] };
    if (list.prices.some((price) => price.tier === tier && price.period === period))
      throw new RangeError(
        `planPriceListsOf: row ${String(row.id)} repeats ${key} ${tier} ${period}`,
      );
    list.prices.push(Object.freeze({ tier, period: period as BillingPeriod, amount }));
    lists.set(key, list);
  }
  return Object.freeze(
    [...lists].map(([key, list]) =>
      Object.freeze({
        key,
        regionalTier: list.regionalTier,
        currency: Money.zero(list.currency).currency,
        prices: Object.freeze(list.prices),
      }),
    ),
  );
}
