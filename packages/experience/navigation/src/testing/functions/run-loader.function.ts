/**
 * Stackra file contract:
 * Purpose: `runLoader(Class, input?)`, a route's or layout's loader run once in a test: the registered testing parts
 *          fake their context members (and one may build the instance with its dependencies), the input's other
 *          members pass to the context as given, and the raw answer comes back as `result` (a redirect is
 *          `{ redirect, params }`), beside the fakes the run used.
 * Boundary: test only; no router, container or network. A loader that throws rejects. Without a part that builds the
 *           instance, the class is built with `new`, so a class with constructor dependencies needs gen's test setup.
 * Runtime: node
 * Governing contract: ADR 0269 (decisions 3 and 6); the template's layout tests.
 */
import type { AnyClass } from "@stackra/container";

import type { Layout } from "#core/bases/layout.base";
import type { Route } from "#core/bases/route.base";
import { createRouteContext } from "#core/functions/create-route-context.function";
import { instanceOf } from "#core/functions/instance-of.function";
import { loadRoute } from "#core/functions/load-route.function";
import { ROUTE_TESTING_PARTS } from "#testing/constants/route-testing-parts.constant";
import type { RouteLoaderInput } from "#testing/types/route-loader-input.type";
import type { RouteLoaderRun } from "#testing/types/route-loader-run.type";

/**
 * Runs the loader of `type` once.
 *
 * @example
 * const { result } = await runLoader(TabsLayout, { session: fakeSession({ status: SessionStatus.SignedOut }) });
 * expect(result).toEqual({ redirect: Routes.sign_in, params: { resume: true } });
 */
export async function runLoader(
  type: AnyClass<Route | Layout>,
  input: RouteLoaderInput = {},
): Promise<RouteLoaderRun & { readonly result: unknown }> {
  const members: Record<string, unknown> = {};
  let instance: object | undefined;
  for (const part of ROUTE_TESTING_PARTS.values()) {
    const contribution = await part({ type, input });
    instance ??= contribution.instance;
    Object.assign(members, contribution.context);
  }
  const { url = "http://localhost/", params, locale, layoutData, ...rest } = input;
  for (const [member, value] of Object.entries(rest))
    if (!Object.hasOwn(members, member)) members[member] = value;
  const ctx = createRouteContext({
    type,
    request: new Request(url),
    params,
    locale,
    layoutData,
    members,
  });
  const result = await loadRoute(type, (instance ?? instanceOf(type)) as Route | Layout, ctx);
  return { ...members, result };
}
