/**
 * Stackra file contract:
 * Purpose: `DATA_VIEW_ICONS`, the icon name of each tool of the web `DataView`'s toolbar and of each view in its
 *          switcher (drawn from `COLLECTION_ICONS`).
 * Boundary: names only.
 * Runtime: browser
 * Governing contract: owner decision R-56 and ADR 0322 (no raw icon literals); data-collection plan (owner, 2026-10-29).
 */
import type { IconName } from "@stackra/icons/contracts";

/** The icon of each toolbar tool and view. */
export const DATA_VIEW_ICONS = Object.freeze({
  filter: "list-filter",
  sort: "arrow-up-down",
  ascending: "arrow-up",
  descending: "arrow-down",
  group: "group",
  density: "rows-3",
  table: "table-2",
  grid: "sheet",
  list: "list",
  cards: "layout-grid",
  board: "square-kanban",
  export: "download",
  import: "upload",
  refresh: "refresh-cw",
  fullscreen: "maximize-2",
  exitFullscreen: "minimize-2",
  more: "ellipsis",
} as const satisfies Readonly<Record<string, IconName>>);
