/**
 * Stackra file contract:
 * Purpose: `SitemapHref`, the link builder a sitemap source receives: a route ref (and its params) to a site path.
 * Boundary: a type only; the route context's `href` is passed in. The parameters are checked bivariantly (a method
 *           signature), so the navigation package's narrower `href(route: RouteRef, ...)` is accepted here without
 *           this package depending on it.
 * Runtime: isomorphic
 * Governing contract: ADR 0301 (decision 2); ADR 0294 (decision 14: routes by ref).
 */

/** Builds a site path from a route ref and its params. */
export type SitemapHref = {
  call: (route: object, params?: Readonly<Record<string, unknown>>) => string;
}["call"];
