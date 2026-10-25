/**
 * Stackra file contract:
 * Purpose: `packLabel`, the name a refusal or a launch gate gives one pack version: `market@version`, or
 *          `market/section@version` for a product section.
 * Boundary: pure and internal.
 * Runtime: isomorphic
 * Governing contract: ADR 0370 (decisions 2 and 8).
 */
import type { MarketPack } from "#core/types/market-pack.type";

/**
 * The label of `pack`.
 *
 * @example
 * packLabel({ market: "eu-de", section: "shop", version: "2.1.0", … }); // "eu-de/shop@2.1.0"
 */
export function packLabel(pack: Pick<MarketPack, "market" | "section" | "version">): string {
  return `${pack.market}${pack.section === undefined ? "" : `/${pack.section}`}@${pack.version}`;
}
