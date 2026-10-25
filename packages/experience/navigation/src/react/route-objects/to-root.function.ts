/**
 * Stackra file contract:
 * Purpose: `toRoot({ prefixes, keys? }, children)`, the whole React Router data-route tree of a client-rendered app:
 *          the route tree mounted once per locale prefix (`/` for the default locale, `/en-us`, `/ar`, `/ar-sa`), each
 *          mount under a root error boundary that keeps its home link in that mount, all under the app-wide one.
 * Boundary: gen writes the call with `#stackra/i18n`'s `prefixes`. `keys` are the request's context keys the loaders
 *           read (the container, the reporter); without them a route context has no container. One data router per
 *           process: a later call replaces the keys.
 * Runtime: browser
 * Governing contract: ADR 0297 (decision 4: lowercase locale prefixes); ADR 0305 (rule 35); ADR 0324.
 */
import { createElement } from "react";
import type { RouteObject } from "react-router";

import { RootErrorBoundary } from "#react/root-error-boundary/root-error-boundary";
import type { RouteKeys } from "#react/route-keys/route-keys.type";
import { ROUTER_KEYS } from "#react/route-keys/router-keys.constant";

/**
 * The root of the route tree.
 *
 * @throws RangeError when a prefix is neither empty nor a lowercase `/tag`.
 * @example
 * export const routes: RouteObject[] = toRoot({ prefixes }, [toLayout(ShellLayout, { component: Shell }, [...])]);
 */
export function toRoot(
  options: { readonly prefixes: Readonly<Record<string, string>>; readonly keys?: RouteKeys },
  children: readonly RouteObject[],
): RouteObject[] {
  ROUTER_KEYS.current = options.keys ?? null;
  const mounts = Object.values(options.prefixes).map((prefix): RouteObject => {
    if (prefix !== "" && !/^\/[a-z0-9-]+$/.test(prefix))
      throw new RangeError(`A locale prefix is empty or a lowercase "/tag", not "${prefix}"`);
    return {
      path: prefix === "" ? "/" : prefix,
      ErrorBoundary: () => createElement(RootErrorBoundary, { prefix }),
      children: [...children],
    };
  });
  return [{ ErrorBoundary: () => createElement(RootErrorBoundary), children: mounts }];
}
