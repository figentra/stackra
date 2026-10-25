/**
 * Stackra file contract:
 * Purpose: `registerRoutes(table)`, the generated entry's call that links each route key to its class, so a `RouteRef`
 *          resolves to its path: it takes gen's `routeTable` (`{ home: { route: HomeRoute, page: Home } }`) or a plain
 *          key-to-class map.
 * Boundary: writes `ROUTE_TABLE` and, for a table entry with a `page`, `ROUTE_PAGE_TABLE`, all or nothing: a key that
 *           is not `snake_case` or a class that does not extend `Route({...})` throws and registers none of the batch.
 *           Registering a key again replaces its class.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 20 and 22).
 */
import { kindOf } from "@stackra/container";

import { ROUTE_PAGE_TABLE } from "#core/constants/route-page-table.constant";
import { ROUTE_TABLE } from "#core/constants/route-table.constant";
import type { RouteClass } from "#core/types/route-class.type";

/** A route key: `snake_case` segments. */
const ROUTE_KEY = /^[a-z][a-z0-9_]*$/;

/**
 * Registers each route class under its key.
 *
 * @throws RangeError when a key is not `snake_case`.
 * @throws TypeError when a class does not extend `Route({...})`.
 * @example
 * registerRoutes(routeTable);
 * registerRoutes({ dashboard: DashboardRoute, sign_in: SignInRoute });
 */
export function registerRoutes(
  table: Readonly<
    Record<string, RouteClass | { readonly route: RouteClass; readonly page?: unknown }>
  >,
): void {
  const entries: [string, RouteClass, unknown][] = [];
  for (const [key, entry] of Object.entries(table)) {
    const type = typeof entry === "function" ? entry : entry.route;
    if (!ROUTE_KEY.test(key)) throw new RangeError(`Route key "${key}" is not snake_case`);
    if (kindOf(type)?.kind !== "route")
      throw new TypeError(`${type.name} does not extend Route({...})`);
    entries.push([key, type, typeof entry === "function" ? undefined : entry.page]);
  }
  for (const [key, type, page] of entries) {
    ROUTE_TABLE.set(key, type);
    if (page !== undefined) ROUTE_PAGE_TABLE.set(type, page);
  }
}
