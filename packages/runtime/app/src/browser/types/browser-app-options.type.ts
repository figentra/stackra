/**
 * Stackra file contract:
 * Purpose: `BrowserAppOptions`, the object form of the browser `createApp`'s argument: the generated wiring and, for
 *          a client-rendered app, its route tree.
 * Boundary: a type only. A server-rendered app passes the wiring alone (its routes come with the server build).
 * Runtime: browser
 * Governing contract: ADR 0295 (decisions 7 and 8); ADR 0165 (React Router 7).
 */
import type { Wiring } from "@stackra/container";
import type { RouteObject } from "react-router";

import type { AppSections } from "#core/types/app-sections.type";

/** The options of the browser `createApp`. */
export interface BrowserAppOptions {
  /** The member's `#stackra/wiring`. */
  readonly wiring: Wiring & AppSections;

  /** The generated route tree (`routes.tsx`), for `mount`. */
  readonly routes?: RouteObject[];
}
