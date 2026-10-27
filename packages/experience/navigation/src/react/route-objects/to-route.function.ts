/**
 * Stackra file contract:
 * Purpose: `toRoute(RouteClass, { component })`, one route class as a React Router data route: its path (relative, so
 *          it mounts under every locale prefix), its `loader` and `submit` as the router's loader and action through
 *          the route context, and its page rendered with `{ data, params, search }`. A `document:` route with no page
 *          renders the registered document page; a route with neither renders nothing (it only redirects).
 * Boundary: gen writes the calls in the member's route tree; a hand-written route config is banned. The context keys
 *           come from `toRoot` at request time.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16); ADR 0165 (React Router 7); ADR 0110 (documents).
 */
import { kindOf } from "@stackra/container";
import { createElement, useMemo, type ComponentType } from "react";
import {
  useLoaderData,
  useParams,
  useSearchParams,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  type RouteObject,
} from "react-router";

import { parseSearch } from "#core/functions/parse-search.function";
import type { RouteClass } from "#core/types/route-class.type";
import type { RouteProps } from "#core/types/route-props.type";
import { ROUTER_KEYS } from "#react/route-keys/router-keys.constant";
import { RegisteredRoutePage } from "#react/route-pages/registered-route-page";
import { routerPath } from "#react/route-objects/router-path.function";
import { answerRoute } from "#react/route-run/answer-route.function";

/** A page with its route's typing erased: the adapter hands it the `{ data, params, search }` the router holds. */
type ErasedPage = ComponentType<{
  readonly data: unknown;
  readonly params: unknown;
  readonly search: unknown;
}>;

/** The page of a `document:` route without its own page: the registered document page. */
function DocumentRoutePage() {
  const { document } = useLoaderData() as { readonly document: unknown };
  return createElement(RegisteredRoutePage, { kind: "document", props: { document } });
}

/**
 * The data route of `type`.
 *
 * @example
 * toLayout(ShellLayout, { component: Shell }, [toRoute(DashboardRoute, { component: Dashboard }), toRoute(OpenRoute)]);
 */
export function toRoute<R extends RouteClass>(
  type: R,
  options: { readonly component?: ComponentType<RouteProps<R>> } = {},
): RouteObject {
  const recorded = kindOf(type)?.options ?? {};
  const { component } = options;
  let Component: ComponentType | undefined;
  if (component !== undefined)
    Component = function RoutePage() {
      const data = useLoaderData();
      const params = useParams();
      const [query] = useSearchParams();
      const search = useMemo(() => parseSearch(query, type), [query]);
      return createElement(component as ErasedPage, { data, params, search });
    };
  else if (typeof recorded["document"] === "function") Component = DocumentRoutePage;
  return {
    ...routerPath(recorded["path"]),
    loader: (args: LoaderFunctionArgs) => answerRoute(type, "loader", args, ROUTER_KEYS.current),
    action: (args: ActionFunctionArgs) => answerRoute(type, "submit", args, ROUTER_KEYS.current),
    ...(Component === undefined ? {} : { Component }),
    handle: { route: type },
  } as RouteObject;
}
