/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/multi-select` (Multi-select), built from the P1 gap list (owner decision 2026-10-28).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Multi-select. */
export const FREE_MULTI_SELECT: ComponentEntry = {
  slug: "multi-select",
  tier: "free",
  category: "selection",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "MultiSelect",
  parts: ["MultiSelect"],
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
  examples: [{ id: "basics", card: true }, { id: "states" }, { id: "live" }, { id: "overflow" }],
  related: ["free/entity-picker", "free/radio-group", "free/combo-box"],
  tokens: ["color.accent", "radius.field", "color.focus"],
  haptics: [{ event: "select", style: "selection" }],
  keywords: ["multiselect", "tags", "chips"],
};
