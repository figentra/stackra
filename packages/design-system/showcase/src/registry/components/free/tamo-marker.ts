/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/tamo-marker` (Tamo marker).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; ADR 0507 (Ask Tamo: AI slots in the design system).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Tamo marker entry of the component registry. */
export const FREE_TAMO_MARKER: ComponentEntry = {
  slug: "tamo-marker",
  tier: "free",
  category: "ai",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "TamoMarker",
  parts: ["TamoMarker"],
  hero: {},
  examples: [{ id: "kinds", card: true, platforms: ["react"] }],
  related: ["free/ai-mark", "free/form"],
  tokens: ["color.tamo-name", "color.warning-soft"],
  keywords: ["ai", "tamo", "provenance", "generated", "review", "label"],
  status: "new",
};
