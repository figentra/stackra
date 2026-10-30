/**
 * Stackra file contract:
 * Purpose: public surface of the playground-pages component folder: the discovered pages, and the function that finds
 *          them.
 * Boundary: re-exports only.
 * Runtime: browser
 * Governing contract: ADR 0294 (decision 14).
 */
export { discoverPages } from "./discover-pages.function";
export { PLAYGROUND_PAGES } from "./playground-pages";
export { type DiscoveredPage } from "./discovered-page.type";
export { type ModuleExports } from "./module-exports.type";
export { routePath } from "./route-path.function";
