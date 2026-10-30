/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/command-palette` (Command palette).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave 3b: data and dashboard).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Command palette entry of the component registry. */
export const FREE_COMMAND_PALETTE: ComponentEntry = {
  slug: "command-palette",
  tier: "free",
  category: "overlays",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "CommandPalette",
  parts: ["CommandPalette"],
  hero: {},
  examples: [{ id: "launcher", card: true }],
  related: ["free/search-field", "free/modal", "free/menu"],
  tokens: ["color.overlay", "shadow.overlay", "radius.lg"],
  keywords: ["command palette", "cmd k", "quick search", "launcher", "spotlight"],
  status: "new",
};
