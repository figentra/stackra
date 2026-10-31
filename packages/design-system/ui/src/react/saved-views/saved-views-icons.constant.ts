/**
 * Stackra file contract:
 * Purpose: `SAVED_VIEWS_ICONS`, the icon name of each action of the web `SavedViews` menu.
 * Boundary: names only.
 * Runtime: browser
 * Governing contract: owner decision R-56 and ADR 0322 (no raw icon literals); data-collection plan (owner, 2026-10-29); ADR 0505.
 */
import type { IconName } from "@stackra/icons/contracts";

/** The icon of each views menu action. */
export const SAVED_VIEWS_ICONS = Object.freeze({
  save: "bookmark",
  saveAs: "bookmark-plus",
  rename: "pencil",
  share: "share-2",
  makeDefault: "star",
  remove: "trash",
} as const satisfies Readonly<Record<string, IconName>>);
