/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/tamo-button` (Tamo button).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; ADR 0507 (Ask Tamo: AI slots in the design system).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Tamo button entry of the component registry. */
export const FREE_TAMO_BUTTON: ComponentEntry = {
  slug: "tamo-button",
  tier: "free",
  category: "ai",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "TamoButton",
  parts: ["TamoButton"],
  hero: {},
  examples: [{ id: "states", card: true, platforms: ["react"] }],
  related: ["free/tamo-menu", "free/button"],
  tokens: [
    "color.tamo-glow-start",
    "color.tamo-glow-mid",
    "color.tamo-glow-end",
    "color.tamo-shimmer",
  ],
  keywords: ["ai", "tamo", "ask tamo", "assistant", "glow", "button"],
  status: "new",
};
