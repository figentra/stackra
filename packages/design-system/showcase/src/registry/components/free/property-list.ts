/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/property-list` (Property list).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Property list entry of the component registry. */
export const FREE_PROPERTY_LIST: ComponentEntry = {
  slug: "property-list",
  tier: "free",
  category: "data_display",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "PropertyList",
  parts: ["PropertyList"],
  hero: {},
  examples: [
    { id: "columns", platforms: ["react"], card: true },
    { id: "values", platforms: ["react"] },
    { id: "copyable", platforms: ["react"] },
    { id: "live", platforms: ["react"] },
    { id: "basics", platforms: ["native"] },
    { id: "empty", platforms: ["native"] },
    { id: "elements", platforms: ["native"] },
    { id: "copy", platforms: ["native"] },
  ],
  related: ["free/list", "free/table", "free/filter-bar"],
  tokens: ["color.surface", "radius.base", "color.border"],
  keywords: ["details", "key value", "description list"],
};
