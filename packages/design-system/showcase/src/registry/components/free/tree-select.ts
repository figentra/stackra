/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/tree-select` (TreeSelect).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave C, owner request 2026-10-29).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The TreeSelect entry of the component registry. */
export const FREE_TREE_SELECT: ComponentEntry = {
  slug: "tree-select",
  tier: "free",
  category: "selection",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "TreeSelect",
  parts: ["TreeSelect"],
  hero: {},
  examples: [{ id: "basics", card: true }, { id: "multiple" }, { id: "invalid" }],
  related: ["free/tree-view", "free/select", "free/multi-select"],
  tokens: ["color.field", "color.accent", "radius.field"],
  haptics: [{ event: "select", style: "selection" }],
  keywords: ["tree select", "hierarchy", "category picker", "nested select", "cascader"],
  status: "new",
};
