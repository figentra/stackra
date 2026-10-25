/**
 * Stackra file contract:
 * Purpose: `RouteProps<R>`, the props of a route's page, typed by its route class: `class Dashboard extends
 *          Component<RouteProps<typeof DashboardRoute>>`, so a page needs no props file. `data` is what the loader
 *          returned (redirects left out), `params` and `search` are typed by the route's shapes or path.
 * Boundary: a type only; the page imports its route as a type, so there is no runtime cycle. Exported from `.` only
 *           (registry A3: the template's `./native` import of it moves to `.` in STA-344).
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (class components); ADR 0294 (decisions 14 and 16).
 */
import type { AnyClass } from "@stackra/container";

import type { Route } from "#core/bases/route.base";
import type { LoaderData } from "#core/types/loader-data.type";
import type { ParamsOf } from "#core/types/params-of.type";
import type { SearchOf } from "#core/types/search-of.type";

/** The page props of route class `R`. */
export interface RouteProps<R extends AnyClass<Route>> {
  /** What the route's loader returned. */
  readonly data: LoaderData<InstanceType<R>>;

  /** The path params. */
  readonly params: ParamsOf<InstanceType<R>>;

  /** The query. */
  readonly search: SearchOf<InstanceType<R>>;
}
