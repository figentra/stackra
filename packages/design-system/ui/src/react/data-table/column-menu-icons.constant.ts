/**
 * Stackra file contract:
 * Purpose: `COLUMN_MENU_ICONS`, the icon name of each item of the web `ColumnMenu` (drawn from `COLLECTION_ICONS`).
 * Boundary: names only.
 * Runtime: browser
 * Governing contract: owner decision R-56 and ADR 0322 (no raw icon literals); data-collection plan (owner, 2026-10-29).
 */
import type { IconName } from "@stackra/icons/contracts";

/** The icon of each column menu item. */
export const COLUMN_MENU_ICONS = Object.freeze({
  ascending: "arrow-up",
  descending: "arrow-down",
  addSort: "arrow-up-down",
  filter: "list-filter",
  group: "group",
  summary: "sigma",
  pin: "pin",
  unpin: "pin-off",
  resize: "move-horizontal",
  hide: "eye-off",
} as const satisfies Readonly<Record<string, IconName>>);
