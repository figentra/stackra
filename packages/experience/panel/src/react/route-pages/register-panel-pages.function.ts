/**
 * Stackra file contract:
 * Purpose: `registerPanelPages()`, how a member's generated entry gives navigation the panel's route pages: the `panel`
 *          page `toPanel` renders (the panel's shell).
 * Boundary: calls navigation's `registerRoutePages`; returns its disposer. Registers only what exists: the `resource`
 *           page `toResource` renders is not built yet, so a resource route still names its missing registration.
 * Runtime: browser
 * Governing contract: ADR 0307 (panel v3.1); ADR 0164; the actions precedent (`registerActions`).
 */
import { registerRoutePages } from "@stackra/navigation/react";

import { PanelRoutePage } from "#react/route-pages/panel-route-page";

/**
 * Registers the panel's route pages with navigation.
 *
 * @example
 * registerPanelPages(); // in the generated web entry, beside registerWidgets(widgets)
 */
export function registerPanelPages(): () => void {
  // shortcut: no `resource` page until the generic List, View, Create and Edit pages are built (panel spec, open items).
  return registerRoutePages({ panel: PanelRoutePage });
}
