/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/text-field` (Text field).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Text field entry of the component registry. */
export const FREE_TEXT_FIELD: ComponentEntry = {
  slug: "text-field",
  tier: "free",
  category: "inputs_and_forms",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "TextField",
  parts: ["TextField"],
  hero: {
    react: {
      pkg: "@heroui/react",
      slug: "text-field",
      docsUrl: "https://www.heroui.com/docs/react/components/text-field",
      sourceUrl:
        "https://github.com/heroui-inc/heroui/tree/v3/packages/react/src/components/textfield",
      racUrl: "https://react-spectrum.adobe.com/react-aria/TextField.html",
    },
    native: {
      pkg: "heroui-native",
      slug: "text-field",
      docsUrl: "https://www.heroui.com/docs/native/components/text-field",
      sourceUrl: "https://github.com/heroui-inc/heroui-native/tree/main/src/components/text-field",
    },
  },
  examples: [
    { id: "variants", card: true },
    { id: "parts" },
    { id: "states" },
    { id: "kinds" },
    { id: "width" },
    { id: "live" },
  ],
  related: ["free/text-area", "free/search-field", "free/number-field"],
  tokens: ["color.field", "radius.field", "color.focus"],
  haptics: [{ event: "invalid", style: "error" }],
  keywords: ["input", "text", "field"],
};
