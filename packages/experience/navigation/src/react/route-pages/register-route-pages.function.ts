/**
 * Stackra file contract:
 * Purpose: `registerRoutePages(pages)`, how the panel, settings and experience packages give navigation the components
 *          it renders for panel, resource, settings-page and document routes.
 * Boundary: writes `ROUTE_PAGES`; a later registration of a kind replaces it. Returns the disposer that removes the
 *           kinds it registered (if still its own).
 * Runtime: browser
 * Governing contract: ADR 0307; ADR 0164; ADR 0110.
 */
import type { RoutePages } from "#react/route-pages/route-pages.type";
import { ROUTE_PAGES } from "#react/route-pages/route-pages.constant";

/**
 * Registers page components by kind.
 *
 * @example
 * registerRoutePages({ panel: PanelShell, resource: ResourcePage });
 */
export function registerRoutePages(pages: Partial<RoutePages>): () => void {
  Object.assign(ROUTE_PAGES, pages);
  return () => {
    for (const kind of Object.keys(pages) as (keyof RoutePages)[])
      if (ROUTE_PAGES[kind] === pages[kind]) Reflect.deleteProperty(ROUTE_PAGES, kind);
  };
}
