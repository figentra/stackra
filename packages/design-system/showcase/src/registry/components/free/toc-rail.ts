/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/toc-rail` (Table of contents).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave 3b: data and dashboard).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Table of contents. */
export const FREE_TOC_RAIL: ComponentEntry = {
  slug: "toc-rail",
  tier: "free",
  category: "navigation",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "TocRail",
  parts: ["TocRail"],
  hero: {},
  examples: [{ id: "guide", card: true }],
  related: ["free/navigation-list", "free/breadcrumbs", "free/tabs"],
  tokens: ["color.accent", "color.separator", "color.muted"],
  keywords: ["table of contents", "toc", "on this page", "scroll spy", "anchor"],
  status: "new",
};
