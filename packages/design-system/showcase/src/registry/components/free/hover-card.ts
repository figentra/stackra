/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/hover-card` (Hover card).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave 3b: data and dashboard).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Hover card. */
export const FREE_HOVER_CARD: ComponentEntry = {
  slug: "hover-card",
  tier: "free",
  category: "overlays",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "HoverCard",
  parts: ["HoverCard"],
  hero: {},
  examples: [{ id: "profile", card: true }],
  related: ["free/popover", "free/tooltip", "free/avatar"],
  tokens: ["color.overlay", "shadow.overlay", "radius.lg"],
  keywords: ["hover card", "preview", "profile card", "peek", "popover"],
  status: "new",
};
