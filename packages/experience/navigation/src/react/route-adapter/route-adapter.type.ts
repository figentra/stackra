/**
 * Stackra file contract:
 * Purpose: `RouteAdapter`, what `routeAdapter` returns: the `loader`, `meta` and page renderer a framework-mode route
 *          module delegates its exports to.
 * Boundary: a type only. The loader answers `{ data, seo }` for a route (the page receives `data`, `meta` reads `seo`)
 *           and the layout's data as it is for a layout.
 * Runtime: isomorphic
 * Governing contract: ADR 0165 (framework mode); ADR 0301.
 */
import type { ReactElement } from "react";
import type { MetaDescriptor } from "react-router";

import type { RouterArgs } from "#react/route-run/route-base-of.function";

/** The delegates of one route module. */
export interface RouteAdapter {
  /** The module's `loader`. */
  loader(args: RouterArgs): Promise<unknown>;

  /** The module's `meta`: the resolved head as tags. */
  meta(args: { readonly loaderData?: unknown; readonly data?: unknown }): MetaDescriptor[];

  /** The module's page, from its loader data and params. */
  render(props: {
    readonly loaderData: unknown;
    readonly params: Readonly<Record<string, string | undefined>>;
  }): ReactElement | null;
}
