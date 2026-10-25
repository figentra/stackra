/**
 * Stackra file contract:
 * Purpose: `toRouterAnswer(result, href)`, a loader's or submit's answer as React Router expects it: a redirect to the
 *          localised href, a `RouteResponse` as React Router's `data()` with its status and headers, anything else as
 *          it is.
 * Boundary: internal to `./react`; the thrown counterpart is `toRouterError`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16); ADR 0165 (React Router 7).
 */
import { data as routerData, redirect } from "react-router";

import { isRouteRedirect } from "#core/functions/is-route-redirect.function";
import { isRouteResponse } from "#core/functions/is-route-response.function";
import type { HrefParams } from "#core/types/href-params.type";
import type { RouteTarget } from "#core/types/route-target.type";

/**
 * `result` for React Router.
 *
 * @example
 * return toRouterAnswer(await loadRoute(type, instance, ctx), ctx.href);
 */
export function toRouterAnswer(
  result: unknown,
  href: (to: RouteTarget, params?: HrefParams) => string,
): unknown {
  if (isRouteRedirect(result)) return redirect(href(result.redirect, result.params));
  if (isRouteResponse(result))
    return routerData(result.data, { status: result.status, headers: { ...result.headers } });
  return result;
}
