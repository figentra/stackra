/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./node` entry of @stackra/market-packs (the root module), until `stackra gen` writes
 *          the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0418.
 */
export { MarketPacksModule } from "#node/market-packs.module";
