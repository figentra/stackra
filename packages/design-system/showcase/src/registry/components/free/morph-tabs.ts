/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/morph-tabs` (Morph tabs).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; wave 3c mobile interactions (owner approval
 *          2026-10-28).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Morph tabs. */
export const FREE_MORPH_TABS: ComponentEntry = {
  slug: "morph-tabs",
  tier: "free",
  category: "navigation",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "MorphTabs",
  parts: ["MorphTabs"],
  hero: {},
  examples: [{ id: "basics", card: true }],
  related: ["free/tabs", "free/segmented-control"],
  tokens: ["color.accent", "radius.full", "motion.duration"],
  haptics: [{ event: "change", style: "selection" }],
  keywords: ["tabs", "bottom bar", "icons", "pill"],
  status: "new",
};
