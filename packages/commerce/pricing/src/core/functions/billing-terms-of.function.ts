/**
 * Stackra file contract:
 * Purpose: `billingTermsOf`, a billing country's `BillingTerms` from the market-pack values in force on the invoice
 *          date (`@stackra/market-packs`' `valuesOn`), with the invoice series of its billing seller in that market.
 * Boundary: pure; it reads the values structurally, so this package needs no market-pack dependency. A missing or
 *           non-text value, an invalid currency, or currencies that differ with no rate source is a `RangeError`:
 *           billing never guesses a seller or a currency. The series changes with the seller's dated entry, so a new
 *           local company starts its own gapless series from its first day.
 * Runtime: isomorphic
 * Governing contract: ADR 0392 (decisions 1 to 3); ADR 0370 (decision 5); owner R3-SO-14, R3-SO-15, US-144.
 */
import { Money } from "@stackra/money";

import { BILLING_PACK_KEYS } from "#core/constants/billing-pack-keys.constant";
import type { BillingTerms } from "#core/types/billing-terms.type";

/**
 * The terms `values` set for `market`.
 *
 * @throws RangeError when a billing value is missing or invalid.
 * @example
 * billingTermsOf(valuesOn(resolved, "2026-11-01"), "eg");
 * // { regionalTier: "low", priceCurrency: "USD", collectionCurrency: "EGP", rateSource: "cbe", ..., invoiceSeries: "figentra-ae:eg" }
 */
export function billingTermsOf(
  values: ReadonlyMap<string, { readonly value: unknown }>,
  market: string,
): BillingTerms {
  const read = (key: string): string | null => {
    const value = values.get(key)?.value;
    if (value === undefined) return null;
    if (typeof value !== "string" || value.length === 0)
      throw new RangeError(`billingTermsOf: ${key} in ${market} is not text`);
    return value;
  };
  const need = (key: string): string => {
    const value = read(key);
    if (value === null) throw new RangeError(`billingTermsOf: ${market} sets no ${key}`);
    return value;
  };
  const priceCurrency = Money.zero(need(BILLING_PACK_KEYS.priceCurrency)).currency;
  const collectionCurrency = Money.zero(need(BILLING_PACK_KEYS.collectionCurrency)).currency;
  const rateSource = read(BILLING_PACK_KEYS.rateSource);
  if (priceCurrency !== collectionCurrency && rateSource === null)
    throw new RangeError(
      `billingTermsOf: ${market} prices in ${priceCurrency} and collects in ${collectionCurrency} with no ${BILLING_PACK_KEYS.rateSource}`,
    );
  const billingSeller = need(BILLING_PACK_KEYS.billingSeller);
  return Object.freeze({
    regionalTier: need(BILLING_PACK_KEYS.regionalTier),
    priceCurrency,
    collectionCurrency,
    rateSource: priceCurrency === collectionCurrency ? null : rateSource,
    contractingEntity: need(BILLING_PACK_KEYS.contractingEntity),
    billingSeller,
    invoiceSeries: `${billingSeller}:${market}`,
  });
}
