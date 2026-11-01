/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/tamo-ghost-text` (Tamo ghost text).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; ADR 0507 (Ask Tamo: AI slots in the design system).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Tamo ghost text entry of the component registry. */
export const FREE_TAMO_GHOST_TEXT: ComponentEntry = {
  slug: "tamo-ghost-text",
  tier: "free",
  category: "ai",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "TamoGhostText",
  parts: ["TamoGhostText"],
  hero: {},
  examples: [{ id: "continue", card: true, platforms: ["react"] }],
  related: ["free/text-area", "free/tamo-menu"],
  tokens: ["color.muted"],
  keywords: ["ai", "tamo", "autocomplete", "suggestion", "ghost text", "continue writing"],
  status: "new",
};
