/**
 * Stackra file contract:
 * Purpose: `renderRoute(route, options?)`, a route mounted in a web test: its loader and submit run through the route
 *          context the testing parts fill, its page renders with `{ data, params, search }` under a React Router stub
 *          at the route's path (or `options.path`), and the result carries the parts' fakes.
 * Boundary: test only; built on `@stackra/testing/react`'s `render`, so the providers are the caller's (`providers`,
 *           `wrapper`). The route is a class or a `Routes.<key>` ref that `registerRoutes` registered; the page is
 *           `options.component`, else the one gen's route table bound. Only the route's own loader runs: pass the
 *           layout's data as `layoutData`. The loader resolves after the first paint, so read the page with `findBy`.
 * Runtime: browser (vitest, jsdom)
 * Governing contract: ADR 0269 (decisions 3 and 6); ADR 0294 (decisions 14 and 16).
 */
import { ROUTE_TABLE } from "#core/constants/route-table.constant";
import type { RouteClass } from "#core/types/route-class.type";
import type { RouteRef } from "#core/types/route-ref.type";
import { mountRoute } from "#testing/functions/mount-route.function";
import type { RenderRouteOptions } from "#testing/types/render-route-options.type";
import type { RenderRouteResult } from "#testing/types/render-route-result.type";

/**
 * Mounts `route` with its page.
 *
 * @throws RangeError when `route` is a ref no `registerRoutes` call registered.
 * @example
 * const { realtime } = renderRoute(Routes.dashboard, { providers: [I18nTestProvider], session });
 * expect(await screen.findByText("Today's revenue")).toBeTruthy();
 */
export function renderRoute(
  route: RouteRef | RouteClass,
  options: RenderRouteOptions = {},
): RenderRouteResult {
  if (typeof route === "function") return mountRoute(route, options);
  const type = ROUTE_TABLE.get(route.name);
  if (type === undefined)
    throw new RangeError(
      `renderRoute: no route is registered as "${route.name}"; register gen's route table with registerRoutes`,
    );
  return mountRoute(type, options);
}
