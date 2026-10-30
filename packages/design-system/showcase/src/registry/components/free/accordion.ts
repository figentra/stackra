/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/accordion` (Accordion).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Accordion. */
export const FREE_ACCORDION: ComponentEntry = {
  slug: "accordion",
  tier: "free",
  category: "data_display",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "Accordion",
  parts: ["Accordion"],
  hero: {
    react: {
      pkg: "@heroui/react",
      slug: "accordion",
      docsUrl: "https://www.heroui.com/docs/react/components/accordion",
      sourceUrl:
        "https://github.com/heroui-inc/heroui/tree/v3/packages/react/src/components/accordion",
      racUrl: "https://react-spectrum.adobe.com/react-aria/Disclosure.html",
    },
    native: {
      pkg: "heroui-native",
      slug: "accordion",
      docsUrl: "https://www.heroui.com/docs/native/components/accordion",
      sourceUrl: "https://github.com/heroui-inc/heroui-native/tree/main/src/components/accordion",
    },
  },
  examples: [
    { id: "single", platforms: ["react"], card: true },
    { id: "multiple" },
    { id: "variants" },
    { id: "expanded", platforms: ["react"] },
    { id: "states" },
    { id: "rich", platforms: ["react"] },
    { id: "live" },
    { id: "basics", platforms: ["native"] },
  ],
  related: ["free/avatar", "free/badge", "free/bulk-action-bar"],
  tokens: ["color.surface", "radius.base", "color.border"],
  keywords: ["collapse", "expand", "disclosure", "faq"],
};
