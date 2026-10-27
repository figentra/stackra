/**
 * Stackra file contract:
 * Purpose: `TaxGateway`, what a tax provider's Connection implements (ADR 0379 decision 3): quote a sale and, where the
 *          provider keeps transactions, record a finalised sale and void a recorded one.
 * Boundary: a type only, vendor-free. The Stripe Tax, Avalara and TaxJar Connections that implement it are OS
 *           integrations code (ADR 0443 decision 7); `ConnectionTaxProviderDriver` reaches them through
 *           `ProviderResolver`. A provider that keeps no transactions leaves `record` and `void` out.
 * Runtime: isomorphic
 * Governing contract: ADR 0379 (decisions 3 and 5, amendment 2026-10-26); ADR 0443 (decisions 7 and 8).
 */
import type { TaxQuote } from "#contracts/types/tax-quote.type";
import type { TaxRequest } from "#contracts/types/tax-request.type";

/**
 * A tax provider's Connection.
 *
 * @example
 * class StripeTaxConnection extends Connection implements TaxGateway { … } // in OS integrations
 */
export interface TaxGateway {
  /**
   * The tax of every line; `source` is the provider's own reference of the calculation.
   *
   * @throws RangeError when the provider cannot tax a line; a missing rate is never a zero.
   */
  quote(request: TaxRequest): Promise<TaxQuote>;

  /** Records the finalised sale `quote` under the caller's `reference`; answers the provider's transaction id. */
  record?(quote: TaxQuote, reference: string): Promise<string>;

  /** Voids (reverses) the recorded transaction `transaction`. */
  void?(transaction: string): Promise<void>;
}
