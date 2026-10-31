/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/network-graph` (Network graph).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (gap wave, owner approval 2026-10-31).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Network graph entry of the component registry. */
export const FREE_NETWORK_GRAPH: ComponentEntry = {
  slug: "network-graph",
  tier: "free",
  category: "charts",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "NetworkGraph",
  parts: ["NetworkGraph"],
  hero: {},
  examples: [{ id: "team", card: true }],
  related: ["free/sankey-chart", "free/tree-diagram", "free/chord-diagram"],
  tokens: ["color.chart-ramp-1", "color.chart-ramp-5", "color.muted"],
  keywords: ["network", "graph", "force", "nodes", "links", "relationships"],
  status: "new",
  advanced: true,
};
