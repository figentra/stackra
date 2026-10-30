/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/text-area` (Text area).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Text area. */
export const FREE_TEXT_AREA: ComponentEntry = {
  slug: "text-area",
  tier: "free",
  category: "inputs_and_forms",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "TextArea",
  parts: ["TextArea"],
  hero: {
    react: {
      pkg: "@heroui/react",
      slug: "text-area",
      docsUrl: "https://www.heroui.com/docs/react/components/text-area",
      sourceUrl:
        "https://github.com/heroui-inc/heroui/tree/v3/packages/react/src/components/textarea",
      racUrl: "https://react-spectrum.adobe.com/react-aria/TextArea.html",
    },
    native: {
      pkg: "heroui-native",
      slug: "text-area",
      docsUrl: "https://www.heroui.com/docs/native/components/text-area",
      sourceUrl: "https://github.com/heroui-inc/heroui-native/tree/main/src/components/text-area",
    },
  },
  examples: [
    { id: "variants", card: true },
    { id: "parts" },
    { id: "lines" },
    { id: "states" },
    { id: "width" },
    { id: "live" },
  ],
  related: ["free/search-field", "free/text-field", "free/number-field"],
  tokens: ["color.field", "radius.field", "color.focus"],
  haptics: [{ event: "invalid", style: "error" }],
  keywords: ["multiline", "textarea", "comment"],
};
