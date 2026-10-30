/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/color-picker` (Colour picker).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; wave 3a forms and pickers (owner approval 2026-10-28).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Colour picker. */
export const FREE_COLOR_PICKER: ComponentEntry = {
  slug: "color-picker",
  tier: "free",
  category: "inputs_and_forms",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "ColorPicker",
  parts: ["ColorPicker"],
  hero: {
    react: {
      pkg: "@heroui/react",
      slug: "color-picker",
      docsUrl: "https://www.heroui.com/docs/react/components/color-picker",
      sourceUrl:
        "https://github.com/heroui-inc/heroui/tree/v3/packages/react/src/components/color-picker",
    },
  },
  examples: [{ id: "basics", card: true }],
  related: ["free/settings-cell"],
  tokens: ["radius.field"],
  haptics: [{ event: "change", style: "selection" }],
  keywords: ["colour", "color", "hex", "swatch"],
  status: "new",
};
