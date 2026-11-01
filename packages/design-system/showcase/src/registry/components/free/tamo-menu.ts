/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/tamo-menu` (Tamo menu).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; ADR 0507 (Ask Tamo: AI slots in the design system).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Tamo menu entry of the component registry. */
export const FREE_TAMO_MENU: ComponentEntry = {
  slug: "tamo-menu",
  tier: "free",
  category: "ai",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "TamoMenu",
  parts: ["TamoMenu"],
  hero: {},
  examples: [{ id: "actions", card: true, platforms: ["react"] }],
  related: ["free/tamo-button", "free/tamo-draft-review"],
  tokens: ["color.tamo-mark", "color.overlay"],
  keywords: ["ai", "tamo", "rewrite", "translate", "tone", "grammar"],
  status: "new",
};
