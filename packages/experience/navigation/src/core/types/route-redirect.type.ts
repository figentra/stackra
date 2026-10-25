/**
 * Stackra file contract:
 * Purpose: `RouteRedirect`, what `ctx.redirect(to, params?)` returns from a loader or a submit: where to go, and the
 *          params and query of the target.
 * Boundary: a type only; made by `ctx.redirect` and nothing else (it carries the brand). The web adapters turn it into
 *           a router redirect to the localised href, the native screen into a navigation, a test reads it as it is.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16).
 */
import type { ROUTE_REDIRECT } from "#core/constants/route-redirect-brand.constant";
import type { HrefParams } from "#core/types/href-params.type";
import type { RouteTarget } from "#core/types/route-target.type";

/** A redirect a route returned or threw. */
export interface RouteRedirect {
  /** Type and runtime brand (non-enumerable). */
  readonly [ROUTE_REDIRECT]: true;

  /** The target: a route ref, a settings page, a path holder or a path. */
  readonly redirect: RouteTarget;

  /** The target's params, its `search` and its `hash`. */
  readonly params?: HrefParams | undefined;
}
