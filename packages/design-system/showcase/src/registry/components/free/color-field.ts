/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/color-field` (Colour field).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1981.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Colour field entry of the component registry. */
export const FREE_COLOR_FIELD: ComponentEntry = {
  slug: "color-field",
  tier: "free",
  category: "inputs_and_forms",
  platforms: ["react"],
  packageName: "@stackra/ui",
  exportName: "ColorField",
  parts: ["ColorField"],
  hero: {
    react: {
      pkg: "@heroui/react",
      slug: "color-field",
      docsUrl: "https://www.heroui.com/docs/react/components/color-field",
      sourceUrl:
        "https://github.com/heroui-inc/heroui/tree/v3/packages/react/src/components/color-field",
    },
  },
  examples: [{ id: "basics", card: true }],
  related: ["free/color-picker", "free/color-swatch", "free/text-field"],
  tokens: ["radius.field"],
  keywords: ["colour", "color", "hex", "field"],
  status: "new",
};
