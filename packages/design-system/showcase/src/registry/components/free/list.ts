/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/list` (List).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The List entry of the component registry. */
export const FREE_LIST: ComponentEntry = {
  slug: "list",
  tier: "free",
  category: "data_display",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "List",
  parts: ["List", "List.Item"],
  hero: {
    react: {
      pkg: "@heroui/react",
      slug: "list-box",
      docsUrl: "https://www.heroui.com/docs/react/components/list-box",
      sourceUrl:
        "https://github.com/heroui-inc/heroui/tree/v3/packages/react/src/components/list-box",
      racUrl: "https://react-spectrum.adobe.com/react-aria/ListBox.html",
    },
    native: {
      pkg: "heroui-native",
      slug: "list-group",
      docsUrl: "https://www.heroui.com/docs/native/components/list-group",
      sourceUrl: "https://github.com/heroui-inc/heroui-native/tree/main/src/components/list-group",
    },
  },
  examples: [
    { id: "basics", card: true },
    { id: "slots", platforms: ["react"] },
    { id: "surfaces" },
    { id: "press" },
    { id: "selection" },
    { id: "collection", platforms: ["react"] },
    { id: "states" },
    { id: "live-press", platforms: ["react"] },
    { id: "live-select", platforms: ["react"] },
    { id: "live-more", platforms: ["react"] },
    { id: "rows", platforms: ["native"] },
  ],
  related: ["free/property-list", "free/filter-bar", "free/data-table"],
  tokens: ["color.surface", "radius.base", "color.border"],
  keywords: ["listbox", "items", "rows"],
};
