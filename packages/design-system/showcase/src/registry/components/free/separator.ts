/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/separator` (Separator).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Separator. */
export const FREE_SEPARATOR: ComponentEntry = {
  slug: "separator",
  tier: "free",
  category: "layout",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "Separator",
  parts: ["Separator"],
  hero: {
    react: {
      pkg: "@heroui/react",
      slug: "separator",
      docsUrl: "https://www.heroui.com/docs/react/components/separator",
      sourceUrl:
        "https://github.com/heroui-inc/heroui/tree/v3/packages/react/src/components/separator",
      racUrl: "https://react-spectrum.adobe.com/react-aria/Separator.html",
    },
    native: {
      pkg: "heroui-native",
      slug: "separator",
      docsUrl: "https://www.heroui.com/docs/native/components/separator",
      sourceUrl: "https://github.com/heroui-inc/heroui-native/tree/main/src/components/separator",
    },
  },
  examples: [
    { id: "horizontal" },
    { id: "levels" },
    { id: "vertical" },
    { id: "labelled", card: true, platforms: ["react"] },
    { id: "live" },
  ],
  related: ["free/section", "free/single-column-layout", "free/screen"],
  tokens: ["color.background", "color.surface", "spacing.page"],
  keywords: ["divider", "rule", "line"],
};
