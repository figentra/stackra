/**
 * Stackra file contract:
 * Purpose: `RouteTable`, what `routeModel` routes over: the route rows, the region rules and the data-class rules.
 * Boundary: a type only; all of it data the ai service loads from the product's settings and the tenant's own rows.
 * Runtime: isomorphic
 * Governing contract: ADR 0156 (decision 2); ADR 0360 (decisions 14 and 15).
 */
import type { DataClassRule } from "#core/types/data-class-rule.type";
import type { ModelRoute } from "#core/types/model-route.type";
import type { RegionRule } from "#core/types/region-rule.type";

/** The routing data. */
export interface RouteTable {
  /** The product's rows, in preference (failover) order. */
  readonly routes: readonly ModelRoute[];

  /** The rule of each data region. */
  readonly regions: readonly RegionRule[];

  /** The rule of each data class that has one. */
  readonly dataClasses: readonly DataClassRule[];
}
