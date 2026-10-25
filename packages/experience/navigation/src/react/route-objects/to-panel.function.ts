/**
 * Stackra file contract:
 * Purpose: `toPanel(PanelClass)`, a panel as one data route at its `path` with everything below it: the panel's own
 *          shell, registered by the panel package, with the resources, documents and settings pages its area lists.
 * Boundary: reads the panel's recorded `path` through `kindOf`; renders the registered `panel` page
 *           (`registerRoutePages`), so navigation imports no panel code.
 * Runtime: browser
 * Governing contract: ADR 0307 (panel v3.1); ADR 0164 (console panels).
 */
import type { AnyClass } from "@stackra/container";
import { kindOf } from "@stackra/container";
import { createElement } from "react";
import type { RouteObject } from "react-router";

import { RegisteredRoutePage } from "#react/route-pages/registered-route-page";

/**
 * The data route of `panel`.
 *
 * @throws TypeError when the panel records no path.
 * @example
 * toPanel(CustomerPortalPanel); // /portal/*
 */
export function toPanel(panel: AnyClass): RouteObject {
  const path = kindOf(panel)?.options["path"];
  if (typeof path !== "string") throw new TypeError(`${panel.name} records no path to mount`);
  return {
    path: `${path.replace(/^\/+|\/+$/g, "")}/*`,
    element: createElement(RegisteredRoutePage, { kind: "panel", props: { panel } }),
  };
}
