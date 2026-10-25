/**
 * Stackra file contract:
 * Purpose: the `TaxProvider` port: the tax of a sale. A market whose own table is enough (VAT) answers through the rate
 *          table (`taxByRates`); a market that needs a provider (US sales tax) answers through a provider driver. Which
 *          one a market uses is the market pack's tax provider key, never code.
 * Boundary: an abstract class that is its own token, keyed `pricing.TaxProvider`. Provider drivers live with the OS
 *           integrations connectors; this package ships the `memory` driver over a rate table. A leaf file.
 * Runtime: isomorphic
 * Governing contract: ADR 0244 (decisions 1 and 9: tax on the Market, in pricing); the OS-109 answer; ADR 0294
 *                     (decisions 15, 16 and 17).
 */
import { Port } from "@stackra/contracts";

import type { TaxQuote } from "#contracts/types/tax-quote.type";
import type { TaxRequest } from "#contracts/types/tax-request.type";

/**
 * Taxes a sale.
 *
 * @example
 * const quote = await tax.quote({ currency: "USD", at, destination, lines, pricesIncludeTax: false });
 */
export abstract class TaxProvider extends Port {
  /** Type-only port key, so `DriverName<TaxProvider>` narrows to this port's drivers. */
  declare readonly "~key": "pricing.TaxProvider";

  /**
   * The tax of every line.
   *
   * @throws RangeError when a line's class has no rate for the destination; a missing rate is never a zero.
   */
  abstract quote(request: TaxRequest): Promise<TaxQuote>;
}
