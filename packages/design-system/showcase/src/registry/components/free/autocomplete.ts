/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/autocomplete` (Autocomplete).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1981.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Autocomplete entry of the component registry. */
export const FREE_AUTOCOMPLETE: ComponentEntry = {
  slug: "autocomplete",
  tier: "free",
  category: "selection",
  platforms: ["react"],
  packageName: "@stackra/ui",
  exportName: "Autocomplete",
  parts: ["Autocomplete"],
  hero: {
    react: {
      pkg: "@heroui/react",
      slug: "autocomplete",
      docsUrl: "https://www.heroui.com/docs/react/components/autocomplete",
      sourceUrl:
        "https://github.com/heroui-inc/heroui/tree/v3/packages/react/src/components/autocomplete",
    },
  },
  examples: [{ id: "basics", card: true }],
  related: ["free/combo-box", "free/select", "free/country-select"],
  tokens: ["radius.field"],
  keywords: ["autocomplete", "select", "search", "filter"],
  status: "new",
};
