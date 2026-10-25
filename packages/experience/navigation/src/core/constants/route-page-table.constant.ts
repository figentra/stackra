/**
 * Stackra file contract:
 * Purpose: `ROUTE_PAGE_TABLE`, the page bound to each route class in gen's route table (`{ home: { route: HomeRoute,
 *          page: Home } }`), which `renderRoute` of `./testing` mounts when a test names only the route.
 * Boundary: internal process state, written only by `registerRoutes`. The page is kept as given (`.` imports no React);
 *           the reader casts it to its component type.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 14 and 20: a page is bound to its route by name).
 */
import type { RouteClass } from "#core/types/route-class.type";

/** Route class → its page component. */
export const ROUTE_PAGE_TABLE = new Map<RouteClass, unknown>();
