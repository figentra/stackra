/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/layout` (Layout primitives: Stack, Cluster, Grid and Center).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave C).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The layout primitives entry of the component registry. */
export const FREE_LAYOUT: ComponentEntry = {
  slug: "layout",
  tier: "free",
  category: "layout",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "Stack",
  parts: ["Stack", "Cluster", "Grid", "Center"],
  hero: {},
  examples: [{ id: "stack", card: true }, { id: "cluster" }, { id: "grid" }, { id: "center" }],
  related: ["free/two-column-layout", "free/single-column-layout", "free/surface"],
  tokens: ["spacing.page", "color.surface"],
  keywords: ["stack", "cluster", "grid", "center", "layout", "spacing", "gap", "columns"],
  status: "new",
};
