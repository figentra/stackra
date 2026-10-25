/**
 * Stackra file contract:
 * Purpose: `runRouteLoader(Class, input?)`, a route's or layout's loader run once in a test: the registered testing
 *          parts and the call's `services` fake their context members (and one may build the instance with its
 *          dependencies), the input's other members pass to the context as given, and the raw answer comes back as
 *          `result` (a redirect is `{ redirect, params }`), beside the fakes the run used.
 * Boundary: test only; no router and no network. A loader that throws rejects. Without a part that builds the
 *           instance, the class comes from `input.container` when it binds it, else `new`, so a class with
 *           constructor dependencies needs a container or gen's test setup.
 * Runtime: node
 * Governing contract: ADR 0269 (decisions 3 and 6); the template's route and layout tests.
 */
import type { AnyClass } from "@stackra/container";

import type { Layout } from "#core/bases/layout.base";
import type { Route } from "#core/bases/route.base";
import { instanceOf } from "#core/functions/instance-of.function";
import { loadRoute } from "#core/functions/load-route.function";
import { contextOf } from "#testing/functions/context-of.function";
import { contributionsOf } from "#testing/functions/contributions-of.function";
import { requestOf } from "#testing/functions/request-of.function";
import type { RouteLoaderInput } from "#testing/types/route-loader-input.type";
import type { RouteLoaderRun } from "#testing/types/route-loader-run.type";

/**
 * Runs the loader of `type` once.
 *
 * @example
 * const { result } = await runRouteLoader(TabsLayout, { session: fakeSession({ status: SessionStatus.SignedOut }) });
 * expect(result).toEqual({ redirect: Routes.sign_in, params: { resume: true } });
 */
export async function runRouteLoader(
  type: AnyClass<Route | Layout>,
  input: RouteLoaderInput = {},
): Promise<RouteLoaderRun & { readonly result: unknown }> {
  const contribution = await contributionsOf(type, input);
  const ctx = contextOf(type, input, requestOf(input), contribution);
  const instance = (contribution.instance ?? instanceOf(type, input.container)) as Route | Layout;
  const result = await loadRoute(type, instance, ctx);
  return { ...contribution.context, result };
}
