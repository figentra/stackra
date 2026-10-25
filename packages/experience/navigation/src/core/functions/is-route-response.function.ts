/**
 * Stackra file contract:
 * Purpose: `isRouteResponse(value)`, whether a loader's or a submit's answer (returned or thrown) is a `RouteResponse`.
 * Boundary: checks the brand only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16).
 */
import { ROUTE_RESPONSE } from "#core/constants/route-response-brand.constant";
import type { RouteResponse } from "#core/types/route-response.type";

/**
 * Whether `value` was made by `data`.
 *
 * @example
 * if (isRouteResponse(result)) return routerData(result.data, { status: result.status });
 */
export function isRouteResponse(value: unknown): value is RouteResponse<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { readonly [ROUTE_RESPONSE]?: unknown })[ROUTE_RESPONSE] === true
  );
}
