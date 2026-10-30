/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/app-header` (App header).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** App header. */
export const FREE_APP_HEADER: ComponentEntry = {
  slug: "app-header",
  tier: "free",
  category: "layout",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "AppHeader",
  parts: ["AppHeader"],
  hero: {},
  examples: [{ id: "parts" }, { id: "arabic" }, { id: "live", card: true }],
  related: ["free/app-shell", "free/page-header", "free/screen"],
  tokens: ["color.background", "color.surface", "spacing.page"],
  keywords: ["header", "top bar", "toolbar"],
};
