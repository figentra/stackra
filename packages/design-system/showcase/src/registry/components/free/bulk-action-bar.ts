/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/bulk-action-bar` (Bulk action bar).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Bulk action bar. */
export const FREE_BULK_ACTION_BAR: ComponentEntry = {
  slug: "bulk-action-bar",
  tier: "free",
  category: "data_display",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "BulkActionBar",
  parts: ["BulkActionBar"],
  hero: {},
  examples: [
    { id: "counts", platforms: ["react"], card: true },
    { id: "actions", platforms: ["react"] },
    { id: "matching" },
    { id: "live" },
    { id: "basics", platforms: ["native"] },
    { id: "overflow", platforms: ["native"] },
    { id: "states", platforms: ["native"] },
  ],
  related: ["free/badge", "free/card", "free/avatar"],
  tokens: ["color.surface", "radius.base", "color.border"],
  keywords: ["selection", "batch", "toolbar"],
};
