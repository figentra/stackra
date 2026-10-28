/**
 * Stackra file contract:
 * Purpose: `TaxTables`, how `ConnectionTaxProviderDriver` reads the market pack's tax engine: the Market's own rate
 *          table for a sale when `market-pack:<code>.tax.engine` is `rates`, or null when it is `provider`.
 * Boundary: a type only; the host implements it over market-pack data (dated values resolved for `request.at`, the
 *           Market from its `MarketContext`). This package reads no pack itself.
 * Runtime: isomorphic
 * Governing contract: ADR 0379 (decision 2: the engine per market is pack data); ADR 0244 (decision 9).
 */
import type { TaxRequest } from "#contracts/types/tax-request.type";
import type { TaxRateTable } from "#core/types/tax-rate-table.type";

/**
 * The Market's tax engine, from pack data.
 *
 * @example
 * const tables: TaxTables = {
 *   table: async (request) => (engineOf(market) === "rates" ? tableOf(market, request.at) : null),
 * };
 */
export interface TaxTables {
  /** The Market's own rate table for `request`, or null when its pack sends tax to a provider. */
  table: (request: TaxRequest) => Promise<TaxRateTable | null>;
}
