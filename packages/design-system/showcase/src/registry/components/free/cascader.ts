/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/cascader` (Cascader).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave D, owner approval 2026-10-30).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Cascader entry of the component registry. */
export const FREE_CASCADER: ComponentEntry = {
  slug: "cascader",
  tier: "free",
  category: "selection",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "Cascader",
  parts: ["Cascader"],
  // HeroUI has no cascader; this one is a HeroUI popover of list boxes on web and the house Drawer on native.
  hero: {},
  examples: [{ id: "basics", card: true }, { id: "lazy" }, { id: "invalid", platforms: ["react"] }],
  related: ["free/tree-select", "free/select", "free/tree-view"],
  tokens: ["color.field", "color.accent", "radius.field"],
  haptics: [{ event: "select", style: "selection" }],
  keywords: ["cascader", "cascading select", "region picker", "path picker", "drill down"],
  status: "new",
};
