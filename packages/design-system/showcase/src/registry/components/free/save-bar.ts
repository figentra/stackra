/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/save-bar` (Save bar).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Save bar. */
export const FREE_SAVE_BAR: ComponentEntry = {
  slug: "save-bar",
  tier: "free",
  category: "feedback_and_status",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "SaveBar",
  parts: ["SaveBar", "SaveStatus"],
  hero: {},
  examples: [{ id: "product-form", card: true }, { id: "autosave" }, { id: "attention" }],
  related: ["free/leave-confirmation", "free/inline-loading", "free/form"],
  tokens: ["color.surface", "radius.base", "motion.base"],
  haptics: [{ event: "attention", style: "warning" }],
  keywords: ["unsaved", "save", "discard", "autosave", "dirty form"],
};
