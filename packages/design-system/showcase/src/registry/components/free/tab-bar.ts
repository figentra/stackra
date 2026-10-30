/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/tab-bar` (Tab bar).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave A, owner request 2026-10-29).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Tab bar. */
export const FREE_TAB_BAR: ComponentEntry = {
  slug: "tab-bar",
  tier: "free",
  category: "navigation",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "TabBar",
  parts: ["TabBar"],
  hero: {},
  examples: [
    { id: "main", card: true },
    { id: "arabic", platforms: ["react"] },
  ],
  related: ["free/sidebar", "free/tabs", "free/navigation-list"],
  tokens: ["color.accent-soft-foreground", "color.danger", "color.separator"],
  keywords: ["tab bar", "bottom navigation", "bottom tabs", "mobile nav", "badges"],
  status: "new",
};
