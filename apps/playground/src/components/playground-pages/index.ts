/**
 * Stackra file contract:
 * Purpose: public surface of the playground-pages component folder: the discovered pages, the function that finds
 *          them and the page tier helpers.
 * Boundary: re-exports only.
 * Runtime: browser
 * Governing contract: ADR 0294 (decision 14).
 */
export { discoverPages } from "./discover-pages.function";
export { PLAYGROUND_PAGES } from "./playground-pages";
export { type DiscoveredPage } from "./discovered-page.type";
export { type ModuleExports } from "./module-exports.type";
export { type PageTier } from "./page-tier";
export { TIER_FILTERS } from "./tier-filters.constant";
export { type TierFilter } from "./tier-filter.type";
export { tierOf } from "./tier-of.function";
export { matchesTier } from "./matches-tier.function";
