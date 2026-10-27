/**
 * Stackra file contract:
 * Purpose: `registerPanelPages()`, how a member's generated entry gives navigation the panel's route pages: the `panel`
 *          page `toPanel` renders (the panel's shell) and the `resource` page `toResource` renders (the generic List,
 *          View, Create and Edit pages).
 * Boundary: calls navigation's `registerRoutePages`; returns its disposer. The settings and document pages are not
 *           panel's to register.
 * Runtime: browser
 * Governing contract: ADR 0307 (panel v3.1); ADR 0164; the actions precedent (`registerActions`).
 */
import { registerRoutePages } from "@stackra/navigation/react";

import { ResourceRoutePage } from "#react/resource-pages/resource-route-page";
import { PanelRoutePage } from "#react/route-pages/panel-route-page";

/**
 * Registers the panel's route pages with navigation.
 *
 * @example
 * registerPanelPages(); // in the generated web entry, beside registerWidgets(widgets) and registerResources(trees)
 */
export function registerPanelPages(): () => void {
  return registerRoutePages({ panel: PanelRoutePage, resource: ResourceRoutePage });
}
