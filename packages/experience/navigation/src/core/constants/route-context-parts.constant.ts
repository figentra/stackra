/**
 * Stackra file contract:
 * Purpose: `ROUTE_CONTEXT_PARTS`, the parts other packages contributed to every route context.
 * Boundary: internal process state; written by `contributeRouteContext`, read by `createRouteContext`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 17 and 23).
 */
import type { RouteContextPart } from "#core/types/route-context-part.type";

/** The contributed parts, in contribution order. */
export const ROUTE_CONTEXT_PARTS = new Set<RouteContextPart>();
