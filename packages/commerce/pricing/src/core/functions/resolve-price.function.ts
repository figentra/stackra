/**
 * Stackra file contract:
 * Purpose: `resolvePrice`, the pure price evaluation the OS pricing service and an offline till share: the price list
 *          that applies to an item (currency, Market, sales channel, date), its price by kind (fixed, graduated,
 *          formula), a derived list's factor and price point over its base, and the sources to store with the line.
 * Boundary: pure (ADR 0337 decision 2): the lists are a replica passed in, the time and the rates are arguments.
 *           Matching: a list applies when its currency equals the query's, its Market and channel are null or equal,
 *           `at` is in `[validFrom, validTo)` and it prices the item; the most specific applies (a channel weighs more
 *           than a Market), and a tie goes to the earlier list in the given order, so the caller orders by priority.
 *           No list is `null`: the caller decides what an unpriced item means. A derived list's own price overrides
 *           its base. Refusals are `RangeError`s (a base list missing, in another currency or in a cycle).
 * Runtime: isomorphic
 * Governing contract: ADR 0337 (decisions 1 to 4); ADR 0244 (decisions 2, 3 and 6, and the STA-451 note: channel,
 *                     Market, location and customer); ADR 0205 STA-474 note (the pure evaluation package); the RES-44
 *                     and RES-169 answers (channel price lists).
 */
import type { Money } from "@stackra/money";
import type { RateSnapshot } from "@stackra/money/contracts";

import { PriceKind } from "#core/enums/price-kind.enum";
import { evaluateFormula } from "#core/functions/evaluate-formula.function";
import type { PriceList } from "#core/types/price-list.type";
import type { PriceQuery } from "#core/types/price-query.type";
import type { PriceSource } from "#core/types/price-source.type";
import type { ResolvedPrice } from "#core/types/resolved-price.type";

/** A price before it is named with its sources. */
interface Priced {
  readonly total: Money;
  readonly unitPrice: Money | null;
  readonly kind: PriceKind;
  readonly sources: readonly PriceSource[];
  readonly rates: readonly RateSnapshot[];
}

/** Whether `list` applies to the query's currency, Market, channel and instant. */
function applies(list: PriceList, query: PriceQuery): boolean {
  const at = query.at.getTime();
  return (
    list.currency === query.currency &&
    (list.market === null || list.market === query.market) &&
    (list.channel === null || list.channel === query.channel) &&
    (list.validFrom === null || list.validFrom.getTime() <= at) &&
    (list.validTo === null || at < list.validTo.getTime())
  );
}

/** How specific a list is: a channel weighs more than a Market. */
function specificity(list: PriceList): number {
  return (list.channel === null ? 0 : 2) + (list.market === null ? 0 : 1);
}

/** The price of the query's item on `list`, or null when the list does not price it. */
function priceOn(
  list: PriceList,
  lists: readonly PriceList[],
  query: PriceQuery,
  seen: ReadonlySet<string>,
): Priced | null {
  if (seen.has(list.id))
    throw new RangeError(`resolvePrice: the list ${list.id} derives from itself`);
  const source: PriceSource = { listId: list.id, revision: list.revision };
  const own = list.prices.find((price) => price.itemId === query.itemId);
  if (own !== undefined) {
    if (own.kind === PriceKind.Graduated) {
      const total = own.price.total(query.quantity);
      return { total, unitPrice: null, kind: own.kind, sources: [source], rates: [] };
    }
    let unitPrice: Money;
    let rates: readonly RateSnapshot[] = [];
    if (own.kind === PriceKind.Formula) {
      const evaluated = evaluateFormula(own.formula, query.inputs, query.rates, list.currency);
      unitPrice = evaluated.amount;
      rates = evaluated.rates;
    } else {
      unitPrice = own.amount;
    }
    return {
      total: unitPrice.times(query.quantity),
      unitPrice,
      kind: own.kind,
      sources: [source],
      rates,
    };
  }
  if (list.adjustment === null) return null;
  const { baseListId, factor, rounding, pricePoint } = list.adjustment;
  const base = lists.find((candidate) => candidate.id === baseListId);
  if (base === undefined)
    throw new RangeError(`resolvePrice: the list ${list.id} derives from ${baseListId}, not given`);
  if (base.currency !== list.currency)
    throw new RangeError(`resolvePrice: the list ${list.id} and its base differ in currency`);
  const based = priceOn(base, lists, query, new Set([...seen, list.id]));
  if (based === null) return null;
  const sources = [source, ...based.sources];
  if (based.unitPrice === null)
    return { ...based, total: based.total.times(factor, rounding), sources };
  const adjusted = based.unitPrice.times(factor, rounding);
  const unitPrice = pricePoint === null ? adjusted : pricePoint.apply(adjusted);
  return { ...based, total: unitPrice.times(query.quantity), unitPrice, sources };
}

/**
 * The price of `query.itemId` from the list that applies, or null when no list prices it.
 *
 * @example
 * const line = resolvePrice(replica.priceLists, {
 *   itemId: "var_ring_18k", quantity: 1, currency: "SAR", market: "mkt_ksa", channel: "chn_store",
 *   at: clock.now(), inputs: { weight_grams: 12.5, purity: "0.75" }, rates: cart.rates,
 * });
 * @throws RangeError when the quantity is not a positive finite number, a base list is missing, in another currency
 *   or derives from itself, or a price cannot be evaluated (a formula's rate or input, a graduated fraction).
 */
export function resolvePrice(lists: readonly PriceList[], query: PriceQuery): ResolvedPrice | null {
  if (!Number.isFinite(query.quantity) || query.quantity <= 0)
    throw new RangeError(`resolvePrice: the quantity must be positive, got ${query.quantity}`);
  const candidates = lists
    .map((list, index) => ({ list, index }))
    .filter(({ list }) => applies(list, query))
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
    .sort((a, b) => specificity(b.list) - specificity(a.list) || a.index - b.index);
  for (const { list } of candidates) {
    const priced = priceOn(list, lists, query, new Set());
    if (priced !== null) return priced;
  }
  return null;
}
