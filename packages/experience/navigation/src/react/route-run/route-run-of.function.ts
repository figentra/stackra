/**
 * Stackra file contract:
 * Purpose: `routeRunOf(type, args, keys, layout?)`, a load or submit prepared from React Router's arguments: the
 *          request's shared inputs (`routeBaseOf`), the layout's data (one run per request), and the route's context
 *          over them.
 * Boundary: internal to `./react`. Without keys the context has no container (its config, platform and caller members
 *           throw when used).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16); ADR 0297 (web runtime); ADR 0260 (decision 4).
 */
import type { AnyClass } from "@stackra/container";
import { kindOf } from "@stackra/container";

import type { Layout } from "#core/bases/layout.base";
import { createRouteContext } from "#core/functions/create-route-context.function";
import type { RouteKeys } from "#react/route-keys/route-keys.type";
import { layoutDataOf } from "#react/route-run/layout-data-of.function";
import { routeBaseOf, type RouterArgs } from "#react/route-run/route-base-of.function";
import type { RouteRun } from "#react/route-run/route-run.type";

/**
 * The prepared run of `type` for one request.
 *
 * @throws Response the layout's redirect or response.
 * @example
 * const run = await routeRunOf(ProductRoute, args, routeKeys, SiteLayout);
 */
export async function routeRunOf(
  type: AnyClass,
  args: RouterArgs,
  keys: RouteKeys | null,
  layout?: AnyClass<Layout>,
): Promise<RouteRun> {
  const { base, container, reporter } = routeBaseOf(args, keys);
  const owner = layout ?? kindOf(type)?.options["layout"];
  const layoutData =
    typeof owner === "function" ? await layoutDataOf(owner as AnyClass<Layout>, base) : undefined;
  return {
    ctx: createRouteContext({ ...base, type, layoutData }),
    container,
    reporter,
    layoutData,
    base,
  };
}
