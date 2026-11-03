/**
 * Stackra file contract:
 * Purpose: `registerPanelPages(options?)`, how a member's generated entry gives navigation the panel's route pages: the
 *          `panel` page `toPanel` renders (the panel's shell, framing the resources and documents of its area below it)
 *          and the `resource` page `toResource` renders (the generic List, View, Create and Edit pages); and what the
 *          panel routes mount and the panel navigation lists: the resources, the documents and the app's layout.
 * Boundary: calls navigation's `registerRoutePages` and records `options` in `PANEL_PAGES`; returns a disposer that takes
 *           both back. The settings pages and experience documents are not panel's to register.
 * Runtime: browser
 * Governing contract: ADR 0307 (panel v3.1); ADR 0164; the actions precedent (`registerActions`); build-list item 53
 *                     (STA-1981).
 */
import { registerRoutePages } from "@stackra/navigation/react";

import { ResourceRoutePage } from "#react/resource-pages/resource-route-page";
import { PANEL_PAGES } from "#react/route-pages/panel-pages.constant";
import type { PanelPagesOptions } from "#react/route-pages/panel-pages-options.type";
import { PanelRoutePage } from "#react/route-pages/panel-route-page";

/**
 * Registers the panel's route pages with navigation, and what the panel routes mount.
 *
 * @example
 * registerPanelPages({ resources: resourceList, documents, layout: AppLayout }); // in the generated web entry
 */
export function registerPanelPages(options: PanelPagesOptions = {}): () => void {
  const previous = PANEL_PAGES.current;
  PANEL_PAGES.current = options;
  const dispose = registerRoutePages({ panel: PanelRoutePage, resource: ResourceRoutePage });
  return () => {
    dispose();
    if (PANEL_PAGES.current === options) PANEL_PAGES.current = previous;
  };
}
