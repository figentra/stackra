/**
 * Stackra file contract:
 * Purpose: `PLAYGROUND_PAGES`, every page of the playground, found from the route folders by `discoverPages` over two
 *          `import.meta.glob` maps: the route modules, eager, and the page modules, lazy.
 * Boundary: the page list only; the pairing and the checks are `discoverPages`'s.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0294 (decision 14, rule R7); ADR 0295 (decision 7).
 */
import type { ModuleExports } from "#src/components/playground-pages/module-exports.type";
import { discoverPages } from "#src/components/playground-pages/discover-pages.function";

/** Every page of the playground, found from the route folders. */
export const PLAYGROUND_PAGES = discoverPages(
  import.meta.glob<ModuleExports>("../../routes/*/*.route.ts", { eager: true }),
  // The pages load lazily: a page module is fetched when its route renders, not with the app.
  import.meta.glob<ModuleExports>("../../routes/*/*.tsx"),
);
