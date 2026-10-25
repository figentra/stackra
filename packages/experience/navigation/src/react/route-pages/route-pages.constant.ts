/**
 * Stackra file contract:
 * Purpose: `ROUTE_PAGES`, the page components other packages registered for the routes `toPanel`, `toResource`,
 *          `toSettingsPage` and document routes build.
 * Boundary: internal process state; written by `registerRoutePages`, read when such a route renders.
 * Runtime: browser
 * Governing contract: ADR 0307; ADR 0110.
 */
import type { RoutePages } from "#react/route-pages/route-pages.type";

/** The registered pages. */
export const ROUTE_PAGES: { -readonly [Kind in keyof RoutePages]?: RoutePages[Kind] } = {};
