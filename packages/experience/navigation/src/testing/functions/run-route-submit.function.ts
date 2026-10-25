/**
 * Stackra file contract:
 * Purpose: `runRouteSubmit(Class, input?)`, a route's `submit` run once in a test: a POST request carrying `input.form`,
 *          the context built as `runRouteLoader` builds it (testing parts, `services`, the input's other members), and
 *          the raw answer back as `result` (field errors, data, or a redirect) beside the fakes the run used.
 * Boundary: test only; no router and no network. A submit that throws rejects. The instance comes from a testing part,
 *           else `input.container`, else `new`.
 * Runtime: node
 * Governing contract: ADR 0269 (decisions 3 and 6); ADR 0294 (decision 16); the template's submit tests.
 */
import type { AnyClass } from "@stackra/container";

import type { Route } from "#core/bases/route.base";
import { instanceOf } from "#core/functions/instance-of.function";
import { contextOf } from "#testing/functions/context-of.function";
import { contributionsOf } from "#testing/functions/contributions-of.function";
import { requestOf } from "#testing/functions/request-of.function";
import type { RouteLoaderRun } from "#testing/types/route-loader-run.type";
import type { RouteSubmitInput } from "#testing/types/route-submit-input.type";

/**
 * Runs the `submit` of `type` once.
 *
 * @example
 * const { result } = await runRouteSubmit(ContactRoute, { form: { email: "nope" }, clients: [marketing] });
 * expect(result).toMatchObject({ status: 400 });
 */
export async function runRouteSubmit(
  type: AnyClass<Route>,
  input: RouteSubmitInput = {},
): Promise<RouteLoaderRun & { readonly result: unknown }> {
  const { form, ...rest } = input;
  const contribution = await contributionsOf(type, rest);
  const request = requestOf(rest, {
    method: "POST",
    ...(form === undefined ? {} : { body: new URLSearchParams(form) }),
  });
  const ctx = contextOf(type, rest, request, contribution);
  const instance = (contribution.instance ?? instanceOf(type, rest.container)) as Route;
  const result: unknown = await instance.submit(ctx);
  return { ...contribution.context, result };
}
