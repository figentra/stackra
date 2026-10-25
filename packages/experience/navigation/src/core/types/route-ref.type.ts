/**
 * Stackra file contract:
 * Purpose: `RouteRef<R>`, a typed reference to one route by its key: what `#stackra/routes` holds (`Routes.settings`)
 *          and every link, redirect, menu and document names a route with, so no caller imports a route class or
 *          writes a path or a locale prefix.
 * Boundary: a type only; made by `routeRef`. `name` is the route key (`quick_order`), also usable as an element id.
 *           `R` is type-only: the route classes are imported as types, so a ref never loads a route module.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 20: the route key is derived from the folder); registry R-56 (no raw route
 *                     strings).
 */
import type { AnyClass } from "@stackra/container";

import type { Route } from "#core/bases/route.base";

/** A reference to the route class `R`. */
export interface RouteRef<R extends AnyClass<Route> = AnyClass<Route>> {
  /** The route key, `snake_case` of the route's folder. */
  readonly name: string;

  /** Type-only: the route class, never present at run time. */
  readonly "~route"?: R;
}
