/**
 * Stackra file contract:
 * Purpose: `isRouteRedirect(value)`, whether a loader's or a submit's answer (returned or thrown) is a redirect made by
 *          `ctx.redirect`.
 * Boundary: checks the brand only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16).
 */
import { ROUTE_REDIRECT } from "#core/constants/route-redirect-brand.constant";
import type { RouteRedirect } from "#core/types/route-redirect.type";

/**
 * Whether `value` was made by `ctx.redirect`.
 *
 * @example
 * if (isRouteRedirect(result)) throw redirect(ctx.href(result.redirect, result.params));
 */
export function isRouteRedirect(value: unknown): value is RouteRedirect {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { readonly [ROUTE_REDIRECT]?: unknown })[ROUTE_REDIRECT] === true
  );
}
