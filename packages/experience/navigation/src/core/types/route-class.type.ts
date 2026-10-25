/**
 * Stackra file contract:
 * Purpose: `RouteClass<O>`, the class `Route({...})` returns, and the type of any route class (`typeof DashboardRoute`
 *          satisfies `RouteClass`).
 * Boundary: a type only, one abstract construct signature with no parameters, so `class X extends Route({...})` calls
 *           `super()` while its own constructor takes its dependencies.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 25: a kind factory returns an exported, named class type).
 */
import type { Route } from "#core/bases/route.base";
import type { RouteOptions } from "#core/types/route-options.type";

/** A route class declared with options `O`. */
export type RouteClass<O extends RouteOptions = RouteOptions> = abstract new (
  ...args: never[]
) => Route<O>;
