/**
 * Stackra file contract:
 * Purpose: `ROUTE_TABLE`, the member's route classes by route key, which `resolveHref` reads to turn a `RouteRef` into
 *          its path and a menu reads for a route's title.
 * Boundary: internal process state, written only by `registerRoutes` (the generated entry's call).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 20: route keys are derived and locked in the manifest).
 */
import type { RouteClass } from "#core/types/route-class.type";

/** Route key → route class. */
export const ROUTE_TABLE = new Map<string, RouteClass>();
