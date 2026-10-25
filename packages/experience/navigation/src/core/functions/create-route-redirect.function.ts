/**
 * Stackra file contract:
 * Purpose: `createRouteRedirect(to, params?)`, the value behind `ctx.redirect`: `{ redirect, params }` with the
 *          non-enumerable brand, so a test compares it with `toEqual({ redirect: Routes.sign_in, params })`.
 * Boundary: internal; frozen data, nothing resolved yet.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16).
 */
import { ROUTE_REDIRECT } from "#core/constants/route-redirect-brand.constant";
import type { HrefParams } from "#core/types/href-params.type";
import type { RouteRedirect } from "#core/types/route-redirect.type";
import type { RouteTarget } from "#core/types/route-target.type";

/**
 * A redirect to `to`.
 *
 * @example
 * createRouteRedirect(Routes.sign_in, { resume: true }); // { redirect: Routes.sign_in, params: { resume: true } }
 */
export function createRouteRedirect(to: RouteTarget, params?: HrefParams): RouteRedirect {
  const redirect = { redirect: to, params };
  Object.defineProperty(redirect, ROUTE_REDIRECT, { value: true });
  return Object.freeze(redirect) as RouteRedirect;
}
