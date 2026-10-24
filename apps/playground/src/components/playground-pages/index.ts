/**
 * Stackra file contract:
 * Purpose: public surface of the playground-pages component folder: the discovered pages, the function that finds
 *          them and the page tier helpers.
 * Boundary: re-exports only.
 * Runtime: browser
 * Governing contract: ADR 0294 (decision 14).
 */
export {
  discoverPages,
  PLAYGROUND_PAGES,
  type DiscoveredPage,
  type ModuleExports,
} from "./playground-pages";
export { matchesTier, TIER_FILTERS, tierOf, type PageTier, type TierFilter } from "./page-tier";
