/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/tamo-collection-tools` (Tamo collection tools).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; ADR 0507 (Ask Tamo: AI slots in the design system).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Tamo collection tools entry of the component registry. */
export const FREE_TAMO_COLLECTION_TOOLS: ComponentEntry = {
  slug: "tamo-collection-tools",
  tier: "free",
  category: "ai",
  platforms: ["react"],
  packageName: "@stackra/ui",
  exportName: "TamoCollectionTools",
  parts: ["TamoCollectionTools"],
  hero: {},
  examples: [{ id: "orders", card: true }],
  related: ["free/data-table", "free/data-view"],
  tokens: ["color.tamo-glow-mid", "color.surface"],
  keywords: ["ai", "tamo", "table", "summarise", "fill column", "filter in words"],
  status: "new",
};
