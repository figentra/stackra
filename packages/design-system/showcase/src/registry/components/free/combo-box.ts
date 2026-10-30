/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/combo-box` (Combo box).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Combo box. */
export const FREE_COMBO_BOX: ComponentEntry = {
  slug: "combo-box",
  tier: "free",
  category: "selection",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "ComboBox",
  parts: ["ComboBox"],
  hero: {
    react: {
      pkg: "@heroui/react",
      slug: "combo-box",
      docsUrl: "https://www.heroui.com/docs/react/components/combo-box",
      sourceUrl:
        "https://github.com/heroui-inc/heroui/tree/v3/packages/react/src/components/combo-box",
      racUrl: "https://react-spectrum.adobe.com/react-aria/ComboBox.html",
    },
  },
  examples: [
    { id: "basics", card: true },
    { id: "modes" },
    { id: "items" },
    { id: "states" },
    { id: "live" },
    { id: "full-width", platforms: ["native"] },
  ],
  related: ["free/checkbox-group", "free/entity-picker", "free/checkbox"],
  tokens: ["color.accent", "radius.field", "color.focus"],
  haptics: [{ event: "change", style: "selection" }],
  keywords: ["autocomplete", "typeahead", "search select"],
};
