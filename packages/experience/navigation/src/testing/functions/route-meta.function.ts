/**
 * Stackra file contract:
 * Purpose: `routeMeta(Class, input)`, the head the web adapter writes for a route's data, as React Router meta
 *          descriptors: the route's static `seo` and its `meta(ctx)` through the SEO chain of `@stackra/seo` (canonical,
 *          hreflang alternates, Open Graph, JSON-LD), with the layout's data (`site`) from the input's members.
 * Boundary: test only; runs the same `routeSeo` and `seoDescriptors` as `routeAdapter`. The chain reads `SeoConfig`
 *           from a container, so `input.container` is required; no testing part runs, because `meta` reads no
 *           service.
 * Runtime: node
 * Governing contract: ADR 0269 (decisions 3 and 6); ADR 0301 (decisions 4 to 7); the template's route tests.
 */
import type { AnyClass } from "@stackra/container";
import type { MetaDescriptor } from "react-router";

import type { Route } from "#core/bases/route.base";
import { createRouteContext } from "#core/functions/create-route-context.function";
import { instanceOf } from "#core/functions/instance-of.function";
import { routeSeo } from "#react/route-adapter/route-seo.function";
import { seoDescriptors } from "#react/route-adapter/seo-descriptors.function";
import { requestOf } from "#testing/functions/request-of.function";
import type { RouteMetaInput } from "#testing/types/route-meta-input.type";

/** The input names that configure the head; every other member is layout data. */
const OPTIONS = new Set([
  "url",
  "path",
  "search",
  "params",
  "locale",
  "layoutData",
  "container",
  "services",
  "data",
  "t",
]);

/**
 * The meta descriptors of `type` for `input.data`.
 *
 * @throws TypeError when `input.container` is missing.
 * @example
 * const descriptors = routeMeta(ProductRoute, { data, site: SITE, path: "/ar/store/demo-tee", container });
 * expect(descriptors).toContainEqual({ tagName: "link", rel: "canonical", href: "https://www.acme.example/ar/store/demo-tee" });
 */
export function routeMeta(type: AnyClass<Route>, input: RouteMetaInput): MetaDescriptor[] {
  const { container, t = (key: string) => key } = input;
  if (container === undefined)
    throw new TypeError(
      "routeMeta needs input.container with SeoConfig (and I18nConfig for the alternates)",
    );
  const layoutData: Record<string, unknown> =
    typeof input.layoutData === "object" && input.layoutData !== null
      ? { ...(input.layoutData as Record<string, unknown>) }
      : {};
  for (const [member, value] of Object.entries(input))
    if (!OPTIONS.has(member)) layoutData[member] = value;
  const request = requestOf(input);
  const ctx = createRouteContext({
    type,
    request,
    params: input.params,
    container,
    locale: input.locale,
    layoutData,
  });
  const run = { ctx, container, reporter: undefined, layoutData, base: { request, container } };
  return seoDescriptors(
    routeSeo(type, instanceOf(type, container) as Route, run, input.data, () => t),
  );
}
