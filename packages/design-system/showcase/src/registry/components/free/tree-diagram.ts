/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/tree-diagram` (Tree diagram).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (gap wave, owner approval 2026-10-31).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Tree diagram entry of the component registry. */
export const FREE_TREE_DIAGRAM: ComponentEntry = {
  slug: "tree-diagram",
  tier: "free",
  category: "charts",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "TreeDiagram",
  parts: ["TreeDiagram"],
  hero: {},
  examples: [{ id: "org", card: true }],
  related: ["free/tree-view", "free/sunburst-chart", "free/treemap-chart"],
  tokens: ["color.chart-ramp-1", "color.chart-ramp-5", "color.surface"],
  keywords: ["tree", "hierarchy", "dendrogram", "org chart", "node-link"],
  status: "new",
  advanced: true,
};
