/**
 * Stackra file contract:
 * Purpose: `MemoryTaxProviderDriver`, the `TaxProvider` driver that taxes from a rate table held in memory: the
 *          `memory` candidate of tests and local runs, and the shape a market's own-table driver takes.
 * Boundary: no network; `taxByRates` does the arithmetic. `table` is what the next quote uses (a test sets market-pack
 *           rows on it); `requests` records every request in order. The constructor takes nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0266 (memory drivers first); ADR 0269 (fakes are real drivers); the OS-109 answer.
 */
import { Driver } from "@stackra/container";
import { Rounding } from "@stackra/contracts";

import { TaxProvider } from "#contracts/ports/tax-provider.port";
import type { TaxQuote } from "#contracts/types/tax-quote.type";
import type { TaxRequest } from "#contracts/types/tax-request.type";
import { taxByRates } from "#core/functions/tax-by-rates.function";
import type { TaxRateTable } from "#core/types/tax-rate-table.type";

/**
 * Tax from a table in memory.
 *
 * @example
 * const tax = new MemoryTaxProviderDriver();
 * tax.table = { source: "test", rounding: Rounding.HalfUp, rates: [{ jurisdiction: "sa", taxClass: "standard", rate: "0.15" }] };
 * await tax.quote(request);
 */
export class MemoryTaxProviderDriver extends Driver(TaxProvider) {
  /** Every request, in order. */
  readonly requests: TaxRequest[] = [];

  /** The rows the next quote uses; empty, so every class refuses until a test sets rows. */
  table: TaxRateTable = { source: "memory", rounding: Rounding.HalfEven, rates: [] };

  /** Records the request and taxes it from `table`. */
  async quote(request: TaxRequest): Promise<TaxQuote> {
    this.requests.push(request);
    return taxByRates(request, this.table);
  }
}
