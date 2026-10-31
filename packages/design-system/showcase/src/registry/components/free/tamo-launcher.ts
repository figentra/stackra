/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/tamo-launcher` (Tamo launcher).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; ADR 0507 (Ask Tamo: AI slots in the design system).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Tamo launcher entry of the component registry. */
export const FREE_TAMO_LAUNCHER: ComponentEntry = {
  slug: "tamo-launcher",
  tier: "free",
  category: "ai",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "TamoLauncher",
  parts: ["TamoLauncher", "TamoPanel"],
  hero: {},
  examples: [{ id: "panel", card: true, platforms: ["react"] }],
  related: ["free/command-palette", "free/chat-surface"],
  tokens: ["color.tamo-mark", "color.overlay"],
  keywords: ["ai", "tamo", "assistant", "side panel", "copilot", "shortcut"],
  status: "new",
};
