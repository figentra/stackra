/**
 * Stackra file contract:
 * Purpose: `answerRoute(type, member, args, keys)`, the body of every loader and action the data-router builders
 *          (`toRoute`, `toLayout`) give React Router: prepare the run, call the route's `loader` or `submit` (or the
 *          layout's shared loader run), and translate the answer or the error.
 * Boundary: internal to `./react`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16); ADR 0165; ADR 0305 (rule 35).
 */
import type { AnyClass } from "@stackra/container";

import type { Layout } from "#core/bases/layout.base";
import type { Route } from "#core/bases/route.base";
import { instanceOf } from "#core/functions/instance-of.function";
import { loadRoute } from "#core/functions/load-route.function";
import { resolveHref } from "#core/functions/resolve-href.function";
import type { RouteKeys } from "#react/route-keys/route-keys.type";
import { layoutDataOf } from "#react/route-run/layout-data-of.function";
import { routeRunOf } from "#react/route-run/route-run-of.function";
import type { RouteRun } from "#react/route-run/route-run.type";
import { toRouterAnswer } from "#react/route-run/to-router-answer.function";
import { toRouterError } from "#react/route-run/to-router-error.function";

/**
 * The router answer of `member` of `type` for one request.
 *
 * @throws the router form of a redirect, a response, a refusal or an unexpected error.
 * @example
 * loader: (args) => answerRoute(DashboardRoute, "loader", args, ROUTER_KEYS.current),
 */
export async function answerRoute(
  type: AnyClass<Route | Layout>,
  member: "loader" | "submit" | "layout",
  args: Parameters<typeof routeRunOf>[1],
  keys: RouteKeys | null,
): Promise<unknown> {
  let run: RouteRun | undefined;
  try {
    run = await routeRunOf(type, args, keys);
    if (member === "layout") return await layoutDataOf(type as AnyClass<Layout>, run.base);
    const instance = instanceOf(type, run.container);
    const result =
      member === "loader"
        ? await loadRoute(type, instance, run.ctx)
        : await (instance as Route).submit(run.ctx);
    return toRouterAnswer(result, run.ctx.href);
  } catch (error) {
    throw toRouterError(error, run?.ctx.href ?? resolveHref, run?.reporter);
  }
}
