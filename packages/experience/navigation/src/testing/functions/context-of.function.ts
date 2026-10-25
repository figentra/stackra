/**
 * Stackra file contract:
 * Purpose: `contextOf(type, input, request, contribution)`, the route context of one run in a test, built by the same
 *          `createRouteContext` every adapter uses: the input's params, locale, layout data and container, and the
 *          merged members of the testing parts.
 * Boundary: internal to `./testing` (not exported).
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); ADR 0294 (decisions 16 and 17).
 */
import type { AnyClass } from "@stackra/container";

import type { Route } from "#core/bases/route.base";
import { createRouteContext } from "#core/functions/create-route-context.function";
import type { RouteContext } from "#core/types/route-context.type";
import type { RouteLoaderInput } from "#testing/types/route-loader-input.type";
import type { RouteTestingContribution } from "#testing/types/route-testing-contribution.type";

/**
 * The context of one run of `type`.
 *
 * @example
 * const ctx = contextOf(SignInRoute, input, requestOf(input), await contributionsOf(SignInRoute, input));
 */
export function contextOf(
  type: AnyClass,
  input: RouteLoaderInput,
  request: Request,
  contribution: RouteTestingContribution,
): RouteContext<Route> {
  return createRouteContext({
    type,
    request,
    params: input.params,
    container: input.container,
    locale: input.locale,
    layoutData: input.layoutData,
    members: contribution.context,
  });
}
