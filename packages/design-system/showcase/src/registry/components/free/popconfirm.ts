/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/popconfirm` (Popconfirm).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave D, owner approval 2026-10-30).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Popconfirm entry of the component registry. */
export const FREE_POPCONFIRM: ComponentEntry = {
  slug: "popconfirm",
  tier: "free",
  category: "overlays",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "Popconfirm",
  parts: ["Popconfirm"],
  // HeroUI has no popconfirm; this one is the house Popover with an alertdialog role and two buttons.
  hero: {},
  examples: [
    { id: "basics", card: true },
    { id: "async-confirm" },
    { id: "row-action", platforms: ["react"] },
  ],
  related: ["free/popover", "free/alert-dialog", "free/button"],
  tokens: ["color.overlay", "color.danger", "shadow.overlay"],
  keywords: ["popconfirm", "confirm", "inline confirmation", "are you sure", "delete"],
  status: "new",
};
