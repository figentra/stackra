/**
 * Stackra file contract:
 * Purpose: `routeAdapter(Class, { layout, component, keys, t })`, the binding of one route or layout class to a React
 *          Router framework-mode route module: its `loader` builds the route context from the request's context keys
 *          (the layout's data once per request, `query`/`action` over the request's public clients, `env`), runs the
 *          class's loader and resolves the head on the server; its `meta` writes that head; its `render` draws the
 *          page with `{ data, params, search }`.
 * Boundary: delegation only; the class owns every behaviour. The class is built through the container on the first
 *           request, never at import. A route's declared `status` is the page's status. Redirects, responses and
 *           refusals become their router forms; an unexpected error is reported once and rethrown for the boundary.
 * Runtime: isomorphic
 * Governing contract: ADR 0165 (React Router 7 framework mode); ADR 0297; ADR 0301; ADR 0305 (rule 35).
 */
import type { AnyClass } from "@stackra/container";
import { kindOf } from "@stackra/container";
import type { ResolvedSeo } from "@stackra/seo";
import { createElement, useMemo, type ComponentType } from "react";
import { data as routerData, useSearchParams } from "react-router";

import type { Layout } from "#core/bases/layout.base";
import type { Route } from "#core/bases/route.base";
import { instanceOf } from "#core/functions/instance-of.function";
import { isRouteRedirect } from "#core/functions/is-route-redirect.function";
import { isRouteResponse } from "#core/functions/is-route-response.function";
import { loadRoute } from "#core/functions/load-route.function";
import { parseSearch } from "#core/functions/parse-search.function";
import { resolveHref } from "#core/functions/resolve-href.function";
import { routeSeo } from "#react/route-adapter/route-seo.function";
import { seoDescriptors } from "#react/route-adapter/seo-descriptors.function";
import type { RouteAdapter } from "#react/route-adapter/route-adapter.type";
import type { RouteAdapterOptions } from "#react/route-adapter/route-adapter-options.type";
import { layoutDataOf } from "#react/route-run/layout-data-of.function";
import { routeRunOf } from "#react/route-run/route-run-of.function";
import type { RouteRun } from "#react/route-run/route-run.type";
import { toRouterAnswer } from "#react/route-run/to-router-answer.function";
import { toRouterError } from "#react/route-run/to-router-error.function";

/** A page with its route's typing erased: the adapter hands it the `{ data, params, search }` the router holds. */
type ErasedPage = ComponentType<{
  readonly data: unknown;
  readonly params: unknown;
  readonly search: unknown;
}>;

/** A route module's loader data. */
interface RouteModuleData {
  readonly data: unknown;
  readonly seo: ResolvedSeo | null;
}

/** The `seo` of a route module's loader data, if any. */
const seoIn = (value: unknown): ResolvedSeo | null =>
  typeof value === "object" && value !== null && "seo" in value
    ? ((value as RouteModuleData).seo ?? null)
    : null;

/**
 * The route module delegates of `type`.
 *
 * @example
 * const adapter = routeAdapter(ProductRoute, { layout: SiteLayout, component: Product, keys: routeKeys, t: translatorFor });
 * export const loader = (args: Route.LoaderArgs) => adapter.loader(args);
 */
export function routeAdapter(
  type: AnyClass<Route | Layout>,
  options: RouteAdapterOptions,
): RouteAdapter {
  const record = kindOf(type);
  const isLayout = record?.kind === "layout";
  const status = record?.options["status"];
  const component = options.component as ErasedPage | undefined;

  /** The page with `{ data, params, search }`. */
  function RoutePage({
    data,
    params,
  }: {
    readonly data: unknown;
    readonly params: Readonly<Record<string, string | undefined>>;
  }) {
    const [query] = useSearchParams();
    const search = useMemo(() => parseSearch(query, type), [query]);
    return component === undefined ? null : createElement(component, { data, params, search });
  }

  return {
    loader: async (args) => {
      let run: RouteRun | undefined;
      try {
        run = await routeRunOf(type, args, options.keys, options.layout);
        if (isLayout) return await layoutDataOf(type as AnyClass<Layout>, run.base);
        const instance = instanceOf(type, run.container) as Route;
        const result = await loadRoute(type, instance, run.ctx);
        if (isRouteRedirect(result) || result instanceof Response)
          return toRouterAnswer(result, run.ctx.href);
        const data = isRouteResponse(result) ? result.data : result;
        const body: RouteModuleData = {
          data,
          seo: routeSeo(type, instance, run, data, options.t),
        };
        if (isRouteResponse(result))
          return routerData(body, { status: result.status, headers: { ...result.headers } });
        return typeof status === "number" ? routerData(body, { status }) : body;
      } catch (error) {
        throw toRouterError(error, run?.ctx.href ?? resolveHref, run?.reporter);
      }
    },
    meta: (args) => seoDescriptors(seoIn(args.loaderData ?? args.data)),
    render: ({ loaderData, params }) =>
      createElement(RoutePage, {
        data: isLayout ? loaderData : (loaderData as RouteModuleData | undefined)?.data,
        params,
      }),
  };
}
