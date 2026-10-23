/**
 * Stackra file contract:
 * Purpose: public surface of the playground-pages component folder: the discovered pages and the function that finds
 *          them.
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
