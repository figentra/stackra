/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./react` entry of @stackra/pricing, the commerce module UI kit's pricing block
 *          (`PricingTable` and its Props) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing; the block depends on @stackra/ui, never the reverse (ADR 0503).
 * Runtime: browser
 * Governing contract: ADR 0503 (module UI kits); ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { PricingTable } from "#react/pricing-table/pricing-table";
export type { PricingTableProps } from "#react/pricing-table/pricing-table.props";
