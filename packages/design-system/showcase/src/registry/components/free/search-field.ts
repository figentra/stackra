/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/search-field` (Search field).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Search field entry of the component registry. */
export const FREE_SEARCH_FIELD: ComponentEntry = {
  slug: "search-field",
  tier: "free",
  category: "inputs_and_forms",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "SearchField",
  parts: ["SearchField"],
  hero: {
    react: {
      pkg: "@heroui/react",
      slug: "search-field",
      docsUrl: "https://www.heroui.com/docs/react/components/search-field",
      sourceUrl:
        "https://github.com/heroui-inc/heroui/tree/v3/packages/react/src/components/search-field",
      racUrl: "https://react-spectrum.adobe.com/react-aria/SearchField.html",
    },
    native: {
      pkg: "heroui-native",
      slug: "search-field",
      docsUrl: "https://www.heroui.com/docs/native/components/search-field",
      sourceUrl:
        "https://github.com/heroui-inc/heroui-native/tree/main/src/components/search-field",
    },
  },
  examples: [
    { id: "basics", card: true },
    { id: "surfaces" },
    { id: "states" },
    { id: "live" },
    { id: "full-width", platforms: ["native"] },
  ],
  related: ["free/text-area", "free/number-field", "free/text-field"],
  tokens: ["color.field", "radius.field", "color.focus"],
  haptics: [{ event: "invalid", style: "error" }],
  keywords: ["search", "query", "find"],
};
