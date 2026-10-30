/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/checkbox-group` (Checkbox group).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Checkbox group entry of the component registry. */
export const FREE_CHECKBOX_GROUP: ComponentEntry = {
  slug: "checkbox-group",
  tier: "free",
  category: "selection",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "CheckboxGroup",
  parts: ["CheckboxGroup"],
  hero: {
    react: {
      pkg: "@heroui/react",
      slug: "checkbox-group",
      docsUrl: "https://www.heroui.com/docs/react/components/checkbox-group",
      sourceUrl:
        "https://github.com/heroui-inc/heroui/tree/v3/packages/react/src/components/checkbox-group",
      racUrl: "https://react-spectrum.adobe.com/react-aria/CheckboxGroup.html",
    },
  },
  examples: [{ id: "basic", card: true }, { id: "states" }, { id: "variants" }, { id: "live" }],
  related: ["free/checkbox", "free/combo-box", "free/entity-picker"],
  tokens: ["color.accent", "radius.field", "color.focus"],
  haptics: [{ event: "change", style: "selection" }],
  keywords: ["multiple", "options", "checklist"],
};
