/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/tree-view` (Tree view).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; design-system gap inventory (2026-10-28).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Tree view entry of the component registry. */
export const FREE_TREE_VIEW: ComponentEntry = {
  slug: "tree-view",
  tier: "free",
  category: "data_display",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "TreeView",
  parts: ["TreeView"],
  hero: {},
  examples: [{ id: "accounts", card: true }, { id: "categories" }, { id: "org" }],
  related: ["free/list", "free/accordion", "free/navigation-list"],
  tokens: ["color.surface", "color.accent", "color.border"],
  haptics: [{ event: "change", style: "selection" }],
  keywords: ["tree", "hierarchy", "nested", "chart of accounts"],
};
