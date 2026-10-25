/**
 * Stackra file contract:
 * Purpose: `RouteAdapterOptions`, what `routeAdapter` binds once per route module: the route's layout, its page, the
 *          request's context keys and the translator factory the head is written with.
 * Boundary: a type only; gen writes the call in each framework-mode route module.
 * Runtime: isomorphic
 * Governing contract: ADR 0165 (React Router 7 framework mode); ADR 0301 (the SEO chain).
 */
import type { AnyClass } from "@stackra/container";
import type { Locale } from "@stackra/i18n";
import type { ComponentType } from "react";

import type { Layout } from "#core/bases/layout.base";
import type { RouteKeys } from "#react/route-keys/route-keys.type";

/** The bindings of one route module. */
export interface RouteAdapterOptions {
  /** The layout the route renders inside; the route's own `layout` option when left out. */
  readonly layout?: AnyClass<Layout>;

  /** The page, rendered with `{ data, params, search }`. */
  readonly component?: ComponentType<never>;

  /** The request's context keys. */
  readonly keys: RouteKeys;

  /** The translator of a locale, for the head's static title and description and `meta`'s `t`. */
  readonly t: (
    locale: Locale,
  ) => (key: string, values?: Readonly<Record<string, unknown>>) => string;
}
