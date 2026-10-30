/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/use-breakpoint` (useBreakpoint).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** useBreakpoint. */
export const FREE_USE_BREAKPOINT: ComponentEntry = {
  slug: "use-breakpoint",
  tier: "free",
  category: "layout",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "useBreakpoint",
  parts: ["useBreakpoint"],
  hero: {},
  examples: [{ id: "current", card: true }, { id: "drawer-or-panel" }, { id: "product-grid" }],
  related: ["free/two-column-layout", "free/drawer", "free/app-shell"],
  tokens: [],
  keywords: ["responsive", "breakpoint", "tablet", "size class", "hook"],
};
