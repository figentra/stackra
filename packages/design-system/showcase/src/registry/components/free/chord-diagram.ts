/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/chord-diagram` (Chord diagram).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (gap wave, owner approval 2026-10-31).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Chord diagram entry of the component registry. */
export const FREE_CHORD_DIAGRAM: ComponentEntry = {
  slug: "chord-diagram",
  tier: "free",
  category: "charts",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "ChordDiagram",
  parts: ["ChordDiagram"],
  hero: {},
  examples: [{ id: "plans", card: true }],
  related: ["free/sankey-chart", "free/network-graph"],
  tokens: ["color.chart-ramp-1", "color.chart-ramp-5"],
  keywords: ["chord", "flows", "circle", "migration", "between groups"],
  status: "new",
  advanced: true,
};
