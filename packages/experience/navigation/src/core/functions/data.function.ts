/**
 * Stackra file contract:
 * Purpose: `data(value, init?)`, data with an HTTP status and headers, returned or thrown from a loader or a submit
 *          (`throw data({ code: "site_not_found" }, { status: 404 })`); also behind `ctx.data`, `ctx.fieldErrors` and
 *          `ctx.notFound`.
 * Boundary: builds a frozen `RouteResponse` carrying the non-enumerable brand; the adapters turn it into React
 *           Router's own `data()`. `isRouteResponse` is the adapters' check.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16); ADR 0140.
 */
import { ROUTE_RESPONSE } from "#core/constants/route-response-brand.constant";
import type { RouteResponse } from "#core/types/route-response.type";
import type { RouteResponseInit } from "#core/types/route-response-init.type";

/**
 * `value` with `init`'s status (200 by default) and headers.
 *
 * @throws RangeError when the status is not an HTTP status.
 * @example
 * return ctx.data({ formError: I18n.leads.refusals.rate_limited }, { status: 422 });
 */
export function data<V>(value: V, init: RouteResponseInit = {}): RouteResponse<V> {
  const status = init.status ?? 200;
  if (!Number.isInteger(status) || status < 100 || status > 599)
    throw new RangeError(`A route response status is an HTTP status, not ${String(status)}`);
  const response = { data: value, status, headers: Object.freeze({ ...init.headers }) };
  Object.defineProperty(response, ROUTE_RESPONSE, { value: true });
  return Object.freeze(response) as RouteResponse<V>;
}
