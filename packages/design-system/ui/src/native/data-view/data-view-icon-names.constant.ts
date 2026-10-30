/**
 * Stackra file contract:
 * Purpose: `NATIVE_DATA_VIEW_ICON_NAMES`, the icon name of each tool of the native `DataView`.
 * Boundary: names only.
 * Runtime: react-native
 * Governing contract: owner decision R-56 and ADR 0322 (no raw icon literals); data-collection plan (owner, 2026-10-29).
 */
import type { IconName } from "@stackra/icons/contracts";

/** The icon of each native DataView tool. */
export const NATIVE_DATA_VIEW_ICON_NAMES = Object.freeze({
  options: "sliders-horizontal",
  ascending: "arrow-up",
  descending: "arrow-down",
  remove: "x",
  list: "list",
  cards: "layout-grid",
} as const satisfies Readonly<Record<string, IconName>>);
