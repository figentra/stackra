/**
 * Stackra file contract:
 * Purpose: `FiscalPackSource`, the port through which the package reads the fiscal section of a market pack on a date.
 * Boundary: an abstract class that is its own token, key `fiscal.FiscalPackSource`. The production driver is
 *           `MarketPackFiscalPackSourceDriver` over `@stackra/market-packs` (pack keys `fiscal.invoice` and
 *           `fiscal.till`); this port names no market. A leaf file.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 2) as amended by ADR 0385; ADR 0363 (decision 3); ADR 0260 (decision 9: host data through a port).
 */
import { Port } from "@stackra/contracts";

import type { MarketFiscalSection } from "#contracts/types/market-fiscal-section.type";

/**
 * Answers what a market's pack says about fiscal documents on a date, overlays resolved.
 *
 * @example
 * const packs: FiscalPackSource = MarketPackFiscalPackSourceDriver.with(verifiedPacks, { pins });
 */
export abstract class FiscalPackSource extends Port {
  /** Type-only port key. */
  declare readonly "~key": "fiscal.FiscalPackSource";

  /** The fiscal section in force for `market` on `on`; `null` when the pack has none or the market is unknown. */
  abstract section(market: string, on: Date): Promise<MarketFiscalSection | null>;
}
