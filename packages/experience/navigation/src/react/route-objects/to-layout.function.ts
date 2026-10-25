/**
 * Stackra file contract:
 * Purpose: `toLayout(LayoutClass, { component }, children)`, one layout class as a pathless React Router data route
 *          around its child routes: its loader is the layout's shared run (once per request, also behind each child's
 *          context), its component the frame with an `Outlet`.
 * Boundary: gen writes the calls; a redirect the layout answers stops the children.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16); ADR 0165.
 */
import type { ComponentType } from "react";
import type { LoaderFunctionArgs, RouteObject } from "react-router";

import type { LayoutClass } from "#core/types/layout-class.type";
import { ROUTER_KEYS } from "#react/route-keys/router-keys.constant";
import { answerRoute } from "#react/route-run/answer-route.function";

/**
 * The data route of `type` around `children`.
 *
 * @example
 * toLayout(PublicLayout, { component: Public }, [toRoute(SignInRoute, { component: SignIn })]);
 */
export function toLayout(
  type: LayoutClass,
  options: { readonly component?: ComponentType },
  children: readonly RouteObject[],
): RouteObject {
  return {
    loader: (args: LoaderFunctionArgs) => answerRoute(type, "layout", args, ROUTER_KEYS.current),
    ...(options.component === undefined ? {} : { Component: options.component }),
    children: [...children],
    handle: { layout: type },
  };
}
