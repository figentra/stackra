/**
 * Stackra file contract:
 * Purpose: `loadRoute(type, instance, ctx)`, one run of a route's or layout's loader: `instance.loader(ctx)` awaited,
 *          and for a route with a `document:` and no data of its own, `{ document }` resolved through the registered
 *          `DocumentResolver` (the coded class without one).
 * Boundary: internal to the adapters; redirects and responses are returned or thrown as the loader gave them, for the
 *           adapter to translate. The adapter builds the instance (`instanceOf`), so `meta` runs on the same one.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16); ADR 0110 (documents).
 */
import type { AnyClass } from "@stackra/container";
import { kindOf } from "@stackra/container";

import type { Layout } from "#core/bases/layout.base";
import type { Route } from "#core/bases/route.base";
import { ROUTE_DOCUMENTS } from "#core/constants/route-documents.constant";
import type { RouteContext } from "#core/types/route-context.type";

/**
 * The loader's answer for `ctx`.
 *
 * @example
 * const result = await loadRoute(ShellLayout, instanceOf(ShellLayout, container), ctx);
 */
export async function loadRoute(
  type: AnyClass<Route | Layout>,
  instance: Route | Layout,
  ctx: RouteContext<Route>,
): Promise<unknown> {
  const result: unknown = await (instance as Route).loader(ctx);
  const document = kindOf(type)?.options["document"];
  if (result !== null || typeof document !== "function") return result;
  const resolve = ROUTE_DOCUMENTS.resolve;
  return {
    document: resolve === null ? document : await resolve(document as AnyClass, ctx),
  };
}
