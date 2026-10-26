/**
 * Stackra file contract:
 * Purpose: `mountRoute(type, options)`, the body of `renderRoute` and `renderLayout`: one React Router stub route whose
 *          loader (and, for a route, action) runs the class through the route context the testing parts fill, whose
 *          element is the page (a route's with `{ data, params, search }`, a layout's as it is, over an empty
 *          outlet), mounted at the input's path with `@stackra/testing/react`'s `render`; the parts' members come back
 *          on the result.
 * Boundary: internal to `./testing` (not exported). The parts run once per mount, so every loader run of the mount (a
 *           revalidation after a submit included) shares one set of fakes; members of a part that answers
 *           asynchronously join the result when it resolves. Redirects, responses and refusals become their router
 *           forms, as in the app. The request URL is the stub's (`http://localhost` and the path).
 * Runtime: browser
 * Governing contract: ADR 0269 (decisions 3 and 6); ADR 0165 (React Router 7).
 */
import type { AnyClass } from "@stackra/container";
import { kindOf } from "@stackra/container";
import { render } from "@stackra/testing/react";
import { createElement, useMemo, type ComponentType } from "react";
import { createRoutesStub, useLoaderData, useParams, useSearchParams } from "react-router";

import type { Layout } from "#core/bases/layout.base";
import type { Route } from "#core/bases/route.base";
import { ROUTE_PAGE_TABLE } from "#core/constants/route-page-table.constant";
import { fillPath } from "#core/functions/fill-path.function";
import { instanceOf } from "#core/functions/instance-of.function";
import { loadRoute } from "#core/functions/load-route.function";
import { parseSearch } from "#core/functions/parse-search.function";
import { resolveHref } from "#core/functions/resolve-href.function";
import type { RouteClass } from "#core/types/route-class.type";
import type { RouteContext } from "#core/types/route-context.type";
import { toRouterAnswer } from "#react/route-run/to-router-answer.function";
import { toRouterError } from "#react/route-run/to-router-error.function";
import { contextOf } from "#testing/functions/context-of.function";
import { contributionsOf } from "#testing/functions/contributions-of.function";
import type { RenderRouteOptions } from "#testing/types/render-route-options.type";
import type { RenderRouteResult } from "#testing/types/render-route-result.type";

/** The empty outlet under a mounted layout. */
const EmptyOutlet = () => null;

/**
 * Mounts `type` with its page under a router stub.
 *
 * @example
 * const { tenancy } = mountRoute(ProfileRoute, { path: "/profile", session });
 */
export function mountRoute(
  type: AnyClass<Route | Layout>,
  options: RenderRouteOptions,
): RenderRouteResult {
  const { component, providers, wrapper, ...input } = options;
  const record = kindOf(type);
  const isLayout = record?.kind === "layout";
  const pattern = typeof record?.options["path"] === "string" ? record.options["path"] : "/";
  const page = (component ?? ROUTE_PAGE_TABLE.get(type as RouteClass)) as
    | ComponentType<object>
    | undefined;
  const contribution = contributionsOf(type, input);

  /** One loader or submit run of the mount, answered in its router form. */
  const answer = async (
    member: "loader" | "submit",
    request: Request,
    params: Readonly<Record<string, unknown>>,
  ): Promise<unknown> => {
    let ctx: RouteContext<Route> | undefined;
    try {
      const merged = await contribution;
      ctx = contextOf(type, { ...input, params: { ...input.params, ...params } }, request, merged);
      const instance = (merged.instance ?? instanceOf(type, input.container)) as Route;
      const value =
        member === "loader" ? await loadRoute(type, instance, ctx) : await instance.submit(ctx);
      return toRouterAnswer(value, ctx.href);
    } catch (error) {
      throw toRouterError(error, ctx?.href ?? resolveHref);
    }
  };

  /** The route's page with `{ data, params, search }`. */
  function RoutePage() {
    const data: unknown = useLoaderData();
    const params = useParams();
    const [query] = useSearchParams();
    const search = useMemo(() => parseSearch(query, type), [query]);
    return page === undefined ? null : createElement(page, { data, params, search });
  }

  const Stub = createRoutesStub([
    isLayout
      ? {
          path: "/",
          loader: ({ request, params }) => answer("loader", request, params),
          ...(page === undefined ? {} : { Component: page }),
          children: [{ path: "*", Component: EmptyOutlet }],
          handle: { layout: type },
        }
      : {
          path: pattern,
          loader: ({ request, params }) => answer("loader", request, params),
          action: ({ request, params }) => answer("submit", request, params),
          Component: RoutePage,
          handle: { route: type },
        },
  ]);
  const target = new URL(
    input.path ?? (isLayout ? "/" : fillPath(pattern, input.params)),
    "http://localhost/",
  );
  for (const [name, value] of Object.entries(input.search ?? {}))
    target.searchParams.set(name, value);
  const view = render(
    createElement(Stub, { initialEntries: [`${target.pathname}${target.search}`] }),
    {
      ...(providers === undefined ? {} : { providers }),
      ...(wrapper === undefined ? {} : { wrapper }),
    },
  ) as RenderRouteResult;
  if (contribution instanceof Promise)
    void contribution.then(
      ({ context }) => Object.assign(view, context),
      () => undefined, // the loader awaits the same promise and surfaces the error
    );
  else Object.assign(view, contribution.context);
  return view;
}
