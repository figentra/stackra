/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/tamo-ask-box` (Tamo ask box).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; ADR 0507 (Ask Tamo: AI slots in the design system).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Tamo ask box entry of the component registry. */
export const FREE_TAMO_ASK_BOX: ComponentEntry = {
  slug: "tamo-ask-box",
  tier: "free",
  category: "ai",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "TamoAskBox",
  parts: ["TamoAskBox"],
  hero: {},
  examples: [{ id: "dates", card: true, platforms: ["react"] }],
  related: ["free/filter-bar", "free/date-picker"],
  tokens: ["color.tamo-glow-mid", "color.tamo-name"],
  keywords: ["ai", "tamo", "natural language", "ask in words", "proposal"],
  status: "new",
};
