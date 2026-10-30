/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/number-field` (Number field).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Number field. */
export const FREE_NUMBER_FIELD: ComponentEntry = {
  slug: "number-field",
  tier: "free",
  category: "inputs_and_forms",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "NumberField",
  parts: ["NumberField"],
  hero: {
    react: {
      pkg: "@heroui/react",
      slug: "number-field",
      docsUrl: "https://www.heroui.com/docs/react/components/number-field",
      sourceUrl:
        "https://github.com/heroui-inc/heroui/tree/v3/packages/react/src/components/number-field",
      racUrl: "https://react-spectrum.adobe.com/react-aria/NumberField.html",
    },
  },
  examples: [
    { id: "basics", card: true },
    { id: "formats" },
    { id: "steppers" },
    { id: "states" },
    { id: "live" },
    { id: "bounded", platforms: ["native"] },
  ],
  related: ["free/mode-switch", "free/search-field", "free/input-group"],
  tokens: ["color.field", "radius.field", "color.focus"],
  haptics: [{ event: "invalid", style: "error" }],
  keywords: ["number", "stepper", "quantity"],
};
