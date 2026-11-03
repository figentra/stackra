/**
 * Stackra file contract:
 * Purpose: `PANEL_PAGES`, the process-wide record of what `registerPanelPages` registered: the resources, documents and
 *          layout the panel routes mount and the panel navigation lists.
 * Boundary: internal to the `./react` entry; written by `registerPanelPages` only, read when a panel route or the
 *           navigation renders, so a registration made after the route tree was built still applies.
 * Runtime: browser
 * Governing contract: ADR 0164; build-list item 53 (STA-1981); the registries precedent (`RESOURCE_REGISTRY`).
 */
import type { PanelPagesOptions } from "#react/route-pages/panel-pages-options.type";

/** The registered panel pages; empty until `registerPanelPages(options)`. */
export const PANEL_PAGES: { current: PanelPagesOptions } = { current: {} };
