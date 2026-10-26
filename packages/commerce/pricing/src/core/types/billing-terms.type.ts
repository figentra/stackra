/**
 * Stackra file contract:
 * Purpose: `BillingTerms`, how OS billing bills a customer in one billing country on one date: the price list it reads
 *          (regional tier, price currency), the currency it collects in and the rate source between them, the
 *          contracting entity and billing seller in force that day, and the invoice series of that entity in that
 *          market.
 * Boundary: a type only; `billingTermsOf` reads it from the pack values in force. The price and collection currencies
 *           are separate on purpose (R3-SO-14: a USD list collected in EGP).
 * Runtime: isomorphic
 * Governing contract: ADR 0392 (decisions 1 to 3); owner R3-SO-14, R3-SO-15.
 */
import type { CurrencyCode } from "@stackra/money";

/** One country's billing terms on one date. */
export interface BillingTerms {
  /** The regional price tier. */
  readonly regionalTier: string;

  /** The currency of the price list. */
  readonly priceCurrency: CurrencyCode;

  /** The currency the customer pays in. */
  readonly collectionCurrency: CurrencyCode;

  /** The rate source key; null when the two currencies are the same. */
  readonly rateSource: string | null;

  /** The legal entity the customer contracts with. */
  readonly contractingEntity: string;

  /** The entity named as seller on the invoice. */
  readonly billingSeller: string;

  /** The gapless numbering series: one per billing seller and market (`figentra-ae:eg`). */
  readonly invoiceSeries: string;
}
