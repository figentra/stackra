/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/single-column-layout` (Single column layout).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Single column layout. */
export const FREE_SINGLE_COLUMN_LAYOUT: ComponentEntry = {
  slug: "single-column-layout",
  tier: "free",
  category: "layout",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "SingleColumnLayout",
  parts: ["SingleColumnLayout"],
  hero: {},
  examples: [{ id: "stacked", card: true }, { id: "wide" }, { id: "arabic" }, { id: "live" }],
  related: ["free/separator", "free/surface", "free/section"],
  tokens: ["color.background", "color.surface", "spacing.page"],
  keywords: ["layout", "column", "centred"],
};
