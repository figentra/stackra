/**
 * Stackra file contract:
 * Purpose: `MarketPackFiscalPackSourceDriver`, the production `FiscalPackSource`: it answers a market's fiscal section
 *          on a date from verified market packs, overlays resolved, reading the pack keys `fiscal.invoice` and
 *          `fiscal.till`.
 * Boundary: the host builds it once at start-up from the packs `fetchPacks` verified and the tenant's resolve options
 *           (pins, accepted statuses). A market the packs do not know answers `null`, as the port says; a key with no
 *           entry in force is a `null` channel. A value of the wrong shape is refused with
 *           `FiscalOptionsInvalidError`. The date is read as its UTC calendar day.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 2) as amended by ADR 0385; ADR 0370 (decisions 3 to 5); ADR 0266.
 */
import { Driver } from "@stackra/container";
import { isRefusal } from "@stackra/errors";
import {
  type MarketPack,
  PackNotFoundError,
  type ResolveOptions,
  type ResolvedPack,
  resolvePack,
  valueOf,
} from "@stackra/market-packs";

import { FiscalPackSource } from "#contracts/ports/fiscal-pack-source.port";
import type { FiscalMandate } from "#contracts/types/fiscal-mandate.type";
import type { MarketFiscalSection } from "#contracts/types/market-fiscal-section.type";
import { FISCAL_MANDATE_SCHEMA } from "#core/constants/fiscal-mandate-schema.constant";
import { FiscalOptionsInvalidError } from "#core/errors/fiscal-options-invalid.error";

/**
 * Reads the fiscal section from market packs.
 *
 * @example
 * const packs = new MarketPackFiscalPackSourceDriver(await fetchPacks(store, hashes, keys), { pins });
 * await packs.section("xx", new Date());
 */
export class MarketPackFiscalPackSourceDriver extends Driver(FiscalPackSource) {
  /** The verified pack versions. */
  private readonly packs: readonly MarketPack[];

  /** Pins and accepted statuses. */
  private readonly options: ResolveOptions;

  /**
   * @param packs - the verified pack versions.
   * @param options - pins and accepted statuses; `live` only when left out.
   */
  constructor(packs: readonly MarketPack[], options: ResolveOptions = {}) {
    super();
    this.packs = packs;
    this.options = options;
  }

  /** The fiscal section in force for `market` on `on`, or `null` for an unknown market. */
  async section(market: string, on: Date): Promise<MarketFiscalSection | null> {
    let resolved: ResolvedPack;
    try {
      resolved = resolvePack(this.packs, market, this.options);
    } catch (error) {
      if (isRefusal(error, PackNotFoundError)) return null;
      throw error;
    }
    const day = on.toISOString().slice(0, 10);
    return {
      invoice: this.mandate(resolved, "fiscal.invoice", day),
      till: this.mandate(resolved, "fiscal.till", day),
    };
  }

  /** The checked mandate under `key` on `day`, or `null` when none is in force. */
  private mandate(resolved: ResolvedPack, key: string, day: string): FiscalMandate | null {
    const value = valueOf(resolved, key, day)?.value;
    if (value === undefined || value === null) return null;
    const parsed = FISCAL_MANDATE_SCHEMA.safeParse(value);
    if (!parsed.success)
      throw FiscalOptionsInvalidError.create({
        driver: key,
        issues: parsed.error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join("; "),
      });
    return parsed.data;
  }
}
