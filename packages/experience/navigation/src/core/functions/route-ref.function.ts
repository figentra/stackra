/**
 * Stackra file contract:
 * Purpose: `routeRef<typeof X>(key)`, the typed reference gen writes for each route in `#stackra/routes`
 *          (`dashboard: routeRef<typeof DashboardRoute>("dashboard")`).
 * Boundary: builds frozen data; the route class is a type argument only, so a ref never loads a route module. The path
 *           is looked up when the ref is resolved (`registerRoutes`), not here.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 20); registry R-56.
 */
import type { AnyClass } from "@stackra/container";

import type { Route } from "#core/bases/route.base";
import type { RouteRef } from "#core/types/route-ref.type";

/** A route key: `snake_case` segments. */
const ROUTE_KEY = /^[a-z][a-z0-9_]*$/;

/**
 * The reference to the route keyed `name`.
 *
 * @throws RangeError when `name` is not a `snake_case` route key.
 * @example
 * export const Routes = { settings: routeRef<typeof SettingsRoute>("settings") } as const;
 */
export function routeRef<R extends AnyClass<Route>>(name: string): RouteRef<R> {
  if (!ROUTE_KEY.test(name)) throw new RangeError(`Route key "${name}" is not snake_case`);
  return Object.freeze({ name });
}
