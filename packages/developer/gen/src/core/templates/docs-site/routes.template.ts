/**
 * Stackra file contract:
 * Purpose: `ROUTES_TEMPLATE`, the `app/routes.ts` of a generated Fumadocs site: the 404 page, the static search index
 *          and one catch-all that serves every page at its path (`index` pages at their folder).
 * Boundary: a constant.
 * Runtime: isomorphic
 * Governing contract: ADR 0514 (decision 1); STA-2026 (page URLs unchanged).
 */

/** The emitted `app/routes.ts`. */
export const ROUTES_TEMPLATE = `import { route, type RouteConfig } from "@react-router/dev/routes";

export default [
  route("404", "routes/not-found.tsx"),
  route("api/search", "routes/search.ts"),
  route("*", "routes/page.tsx"),
] satisfies RouteConfig;
`;
