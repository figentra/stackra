/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/context-menu` (Context menu).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave 3b: data and dashboard).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Context menu entry of the component registry. */
export const FREE_CONTEXT_MENU: ComponentEntry = {
  slug: "context-menu",
  tier: "free",
  category: "overlays",
  platforms: ["react"],
  packageName: "@stackra/ui",
  exportName: "ContextMenu",
  parts: ["ContextMenu"],
  hero: {},
  examples: [{ id: "rows", card: true }],
  related: ["free/menu", "free/action-menu", "free/table"],
  tokens: ["color.overlay", "shadow.overlay", "radius.lg"],
  keywords: ["context menu", "right click", "shortcut menu", "shift f10"],
  status: "new",
};
