/**
 * Stackra file contract:
 * Purpose: `RouteChoice`, what `routeModel` answers: the route and the region it is served from, with whether the call
 *          leaves the tenant's region and must be disclosed; or a refusal when nothing may take the call.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0360 (decision 14: disclosure of a named fallback jurisdiction).
 */
import type { ModelRoute } from "#core/types/model-route.type";

/** The routing answer. */
export type RouteChoice =
  | {
      /** A route was found. */
      readonly kind: "routed";
      /** The route taken. */
      readonly route: ModelRoute;
      /** The region it is served from. */
      readonly region: string;
      /** Whether the call leaves the tenant's region, which the caller discloses. */
      readonly disclosed: boolean;
    }
  | {
      /** No route may take the call. */
      readonly kind: "refused";
      /** `class_closed` when the data class has no enabled provider, otherwise `no_route`. */
      readonly reason: "no_route" | "class_closed";
    };
