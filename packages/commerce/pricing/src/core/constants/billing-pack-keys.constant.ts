/**
 * Stackra file contract:
 * Purpose: `BILLING_PACK_KEYS`, the market-pack entry keys OS billing reads for a billing country: its regional price
 *          tier, its price currency, its collection currency, the rate source that converts between them, and the
 *          contracting entity and billing seller of its invoices.
 * Boundary: key names only; every value is dated market-pack data (`market-pack:<code>`, `from` and `until` per
 *           entry), so a new local company or a currency switch is a pack entry, not a release.
 * Runtime: isomorphic
 * Governing contract: ADR 0392 (decisions 1 to 3); ADR 0370 (decision 5); owner R3-SO-14, R3-SO-15, US-144.
 */

/** The billing entry keys of a market pack. */
export const BILLING_PACK_KEYS = Object.freeze({
  /** The regional price tier (`low`) the country's prices come from. */
  regionalTier: "billing.regional_tier",
  /** The currency the price list is in (`USD`). */
  priceCurrency: "billing.price_currency",
  /** The currency the customer pays in (`EGP`). */
  collectionCurrency: "billing.collection_currency",
  /** The `RateSource` driver key that converts price to collection currency; needed when the two differ. */
  rateSource: "billing.rate_source",
  /** The legal entity the customer contracts with (`figentra-ae`). */
  contractingEntity: "billing.contracting_entity",
  /** The entity named as seller on the invoice (`figentra-ae`). */
  billingSeller: "billing.billing_seller",
});
