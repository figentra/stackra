/**
 * Stackra file contract:
 * Purpose: `toSettingsPage(page)`, the data route of a generated settings page at `/settings/<key-kebab>`
 *          (`...toSettingsPage(SettingsPages.orders)` is `/settings/orders`).
 * Boundary: renders the registered `settings` page with the page, so navigation imports no settings form; the same
 *           path `resolveHref` gives a link to the page.
 * Runtime: browser
 * Governing contract: ADR 0307 (rule 24: gen generates the settings page).
 */
import type { SettingsPage } from "@stackra/settings";
import { createElement } from "react";
import type { RouteObject } from "react-router";

import { resolveHref } from "#core/functions/resolve-href.function";
import { RegisteredRoutePage } from "#react/route-pages/registered-route-page";

/**
 * The data routes of `page`.
 *
 * @example
 * ...toSettingsPage(SettingsPages.messages); // /settings/messages
 */
export function toSettingsPage(page: SettingsPage): RouteObject[] {
  return [
    {
      path: resolveHref(page).replace(/^\/+/, ""),
      element: createElement(RegisteredRoutePage, { kind: "settings", props: { page } }),
    },
  ];
}
