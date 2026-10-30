/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/table` (Table).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Table entry of the component registry. */
export const FREE_TABLE: ComponentEntry = {
  slug: "table",
  tier: "free",
  category: "data_display",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "Table",
  parts: ["Table"],
  hero: {
    react: {
      pkg: "@heroui/react",
      slug: "table",
      docsUrl: "https://www.heroui.com/docs/react/components/table",
      sourceUrl: "https://github.com/heroui-inc/heroui/tree/v3/packages/react/src/components/table",
      racUrl: "https://react-spectrum.adobe.com/react-aria/Table.html",
    },
  },
  examples: [
    { id: "basics", card: true },
    { id: "sorting" },
    { id: "selection" },
    { id: "sticky", platforms: ["react"] },
    { id: "states" },
    { id: "live", platforms: ["react"] },
    { id: "cells", platforms: ["native"] },
  ],
  related: ["free/property-list", "free/list", "free/filter-bar"],
  tokens: ["color.surface", "radius.base", "color.border"],
  keywords: ["grid", "rows", "columns"],
};
