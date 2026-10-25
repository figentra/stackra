/**
 * Stackra file contract:
 * Purpose: `HydrateRouteOptions`, what `hydrateRoute` takes: the wiring, the one route and its layout, the locale the
 *          page was prerendered for, and the contexts to mount.
 * Boundary: a type only; gen writes the values in each prerendered page's hydration entry.
 * Runtime: browser
 * Governing contract: ADR 0295 (decision 10); ADR 0297 (prerender).
 */
import type { Wiring } from "@stackra/container";

import type { HydrateRoutePart } from "#browser/types/hydrate-route-part.type";
import type { AppSections } from "#core/types/app-sections.type";

/** The options of `hydrateRoute`. */
export interface HydrateRouteOptions {
  /** The member's `#stackra/wiring`. */
  readonly wiring: Wiring & AppSections;

  /** The layout the route renders inside. */
  readonly layout: HydrateRoutePart;

  /** The prerendered route. */
  readonly route: HydrateRoutePart;

  /** The locale the page was prerendered for (`<html lang>`), matched case-insensitively against the configured ones. */
  readonly locale: string;

  /** The context keys to mount, outermost first; the wiring's when absent. */
  readonly contexts?: readonly string[];
}
