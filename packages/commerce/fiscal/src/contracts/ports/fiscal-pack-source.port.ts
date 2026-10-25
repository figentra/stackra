/**
 * Stackra file contract:
 * Purpose: `FiscalPackSource`, the port through which the package reads the fiscal section of a market pack on a date.
 * Boundary: an abstract class that is its own token, key `fiscal.FiscalPackSource`. The market-pack loader (no home
 *           yet, config-model CAP-market-pack) or a host's settings read answers it; this package ships no driver and
 *           names no market. A leaf file.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 2); ADR 0363 (decision 3); ADR 0260 (decision 9: host data through a port).
 */
import { Port } from "@stackra/contracts";

import type { MarketFiscalSection } from "#contracts/types/market-fiscal-section.type";

/**
 * Answers what a market's pack says about fiscal documents on a date, overlays resolved.
 *
 * @example
 * export class MarketPackFiscalDriver extends Driver(FiscalPackSource) {
 *   async section(market: string, on: Date) { return this.packs.valueOf(market, "fiscal", on); }
 * }
 */
export abstract class FiscalPackSource extends Port {
  /** Type-only port key. */
  declare readonly "~key": "fiscal.FiscalPackSource";

  /** The fiscal section in force for `market` on `on`; `null` when the pack has none or the market is unknown. */
  abstract section(market: string, on: Date): Promise<MarketFiscalSection | null>;
}
