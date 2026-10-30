/**
 * Stackra file contract:
 * Purpose: `WIDGET_MENU_ICON`, the icon of each entry of a widget's overflow menu, plus `chart` for "View as chart".
 * Boundary: values only; the names are registered in the ui icon registry.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (decisions 14 to 18); owner decision R-56 (ADR 0322); STA-1371.
 */
import type { IconName } from "@stackra/icons/contracts";

import type { WidgetMenuAction } from "#contracts/enums/widget-menu-action.enum";

/** The icon names of the menu's entries. */
export const WIDGET_MENU_ICON: Readonly<Record<WidgetMenuAction | "chart", IconName>> = {
  csv: "download",
  png: "image",
  table: "table-2",
  chart: "chart-column",
  fullscreen: "maximize-2",
  link: "link-2",
};
