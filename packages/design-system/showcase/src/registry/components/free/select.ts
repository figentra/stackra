/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/select` (Select).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Select. */
export const FREE_SELECT: ComponentEntry = {
  slug: "select",
  tier: "free",
  category: "selection",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "Select",
  parts: ["Select"],
  hero: {
    react: {
      pkg: "@heroui/react",
      slug: "select",
      docsUrl: "https://www.heroui.com/docs/react/components/select",
      sourceUrl:
        "https://github.com/heroui-inc/heroui/tree/v3/packages/react/src/components/select",
      racUrl: "https://react-spectrum.adobe.com/react-aria/Select.html",
    },
    native: {
      pkg: "heroui-native",
      slug: "select",
      docsUrl: "https://www.heroui.com/docs/native/components/select",
      sourceUrl: "https://github.com/heroui-inc/heroui-native/tree/main/src/components/select",
    },
  },
  examples: [
    { id: "basics", card: true },
    { id: "items" },
    { id: "states" },
    { id: "live" },
    { id: "presentation", platforms: ["native"] },
  ],
  related: ["free/radio-group", "free/switch", "free/tag-group"],
  tokens: ["color.accent", "radius.field", "color.focus"],
  haptics: [{ event: "change", style: "selection" }],
  keywords: ["dropdown", "picker", "options"],
};
