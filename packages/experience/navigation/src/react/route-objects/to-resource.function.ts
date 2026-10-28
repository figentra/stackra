/**
 * Stackra file contract:
 * Purpose: `toResource(resource)`, the data routes of a resource under its `base` path: the list at the base, the
 *          create page at `new`, the record at `:id` and its edit page at `:id/edit`, each only when the resource
 *          declares it (`...toResource(Resources.Order)` in the shell).
 * Boundary: reads the resource as data: its `base` and which of the page refs `list`, `create`, `view` and `edit` that
 *           panel's `resource()` gives it; renders the registered `resource` page with the page name (panel's
 *           `ResourcePage` codes), so navigation imports no panel code.
 * Runtime: browser
 * Governing contract: ADR 0307 (resource tables and pages); ADR 0164.
 */
import { createElement } from "react";
import type { RouteObject } from "react-router";

import { RegisteredRoutePage } from "#react/route-pages/registered-route-page";

/**
 * The data routes of `resource`.
 *
 * @example
 * ...toResource(Resources.ProductCollection); // /catalogue/collections, /new, /:id/edit
 */
export function toResource(resource: {
  readonly base: string;
  readonly list?: unknown;
  readonly create?: unknown;
  readonly view?: unknown;
  readonly edit?: unknown;
}): RouteObject[] {
  const base = resource.base.replaceAll(/^\/+|\/+$/g, "");
  const pages = [
    ["list", base],
    ["create", `${base}/new`],
    ["view", `${base}/:id`],
    ["edit", `${base}/:id/edit`],
  ] as const;
  return pages
    .filter(([page]) => resource[page] !== undefined)
    .map(([page, path]) => ({
      path,
      element: createElement(RegisteredRoutePage, { kind: "resource", props: { resource, page } }),
    }));
}
