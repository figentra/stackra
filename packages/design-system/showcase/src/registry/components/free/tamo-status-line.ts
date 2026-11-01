/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/tamo-status-line` (Tamo status).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; ADR 0507 (Ask Tamo: AI slots in the design system).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Tamo status entry of the component registry. */
export const FREE_TAMO_STATUS_LINE: ComponentEntry = {
  slug: "tamo-status-line",
  tier: "free",
  category: "ai",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "TamoStatusLine",
  parts: ["TamoStatusLine"],
  hero: {},
  examples: [{ id: "states", card: true, platforms: ["react"] }],
  related: ["free/tamo-draft-review", "free/shimmer"],
  tokens: ["color.danger", "color.muted"],
  keywords: ["ai", "tamo", "loading", "stop", "retry", "error"],
  status: "new",
};
