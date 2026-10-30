/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/share-button` (ShareButton).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave C, owner approval 2026-10-29).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The ShareButton entry of the component registry. */
export const FREE_SHARE_BUTTON: ComponentEntry = {
  slug: "share-button",
  tier: "free",
  category: "actions",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "ShareButton",
  parts: ["ShareButton"],
  // HeroUI has no share button; this one is the Button or IconButton with the system share sheet.
  hero: {},
  examples: [{ id: "basics", card: true }, { id: "icon-only" }],
  related: ["free/copy-button", "free/button", "free/icon-button"],
  tokens: ["color.success", "color.focus"],
  keywords: ["share", "link", "social", "send", "copy link"],
  status: "new",
};
