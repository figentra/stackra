/**
 * Stackra file contract:
 * Purpose: `layoutDataOf(layout, base)`, what a layout's loader resolved for this request, run once per request and
 *          shared by the layout's own route and every route below it.
 * Boundary: internal. A redirect (as React Router's, to the localised href) or a `Response` the layout answers is
 *           thrown, so no child loads after it; a `RouteResponse` is unwrapped to its data.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16).
 */
import type { AnyClass } from "@stackra/container";

import type { Layout } from "#core/bases/layout.base";
import { createRouteContext } from "#core/functions/create-route-context.function";
import { instanceOf } from "#core/functions/instance-of.function";
import { isRouteRedirect } from "#core/functions/is-route-redirect.function";
import { isRouteResponse } from "#core/functions/is-route-response.function";
import { loadRoute } from "#core/functions/load-route.function";
import { LAYOUT_RUNS } from "#react/route-run/layout-runs.constant";
import type { RouteRun } from "#react/route-run/route-run.type";
import { toRouterAnswer } from "#react/route-run/to-router-answer.function";

/**
 * The data of `layout` for the request in `base`.
 *
 * @throws Response the layout's redirect or response.
 * @example
 * const { site } = (await layoutDataOf(SiteLayout, run.base)) as { site: ResolvedSite };
 */
export function layoutDataOf(layout: AnyClass<Layout>, base: RouteRun["base"]): Promise<unknown> {
  const runs = LAYOUT_RUNS.get(base.request) ?? new Map<AnyClass, Promise<unknown>>();
  LAYOUT_RUNS.set(base.request, runs);
  const known = runs.get(layout);
  if (known !== undefined) return known;
  const run = (async () => {
    const ctx = createRouteContext({ ...base, type: layout });
    let result: unknown;
    try {
      result = await loadRoute(layout, instanceOf(layout, base.container), ctx);
    } catch (error) {
      throw isRouteRedirect(error) ? toRouterAnswer(error, ctx.href) : error;
    }
    if (isRouteRedirect(result)) throw toRouterAnswer(result, ctx.href);
    if (result instanceof Response) throw result;
    return isRouteResponse(result) ? result.data : result;
  })();
  runs.set(layout, run);
  return run;
}
